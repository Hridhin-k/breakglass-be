import bcrypt from "bcryptjs";
import { connectDB } from "../utils/database";
import {
  generateAccessToken,
  generateRefreshToken,
  newGenerateAccessToken,
  newGenerateRefreshToken,
} from "../utils/authUtils";
import crypto from "crypto";
import { sendEmail } from "../utils/emailService";
import { Users } from "../entities/Users";

export class AuthService {
  /**
   * Request access to register
   */
  async requestAccess(email: string) {
    const dataSource = await connectDB();
    const userRepository = dataSource.getRepository(Users);

    try {
      // Check if the email is already in use
      const existingUser = await userRepository.findOne({ where: { email } });

      if (existingUser) {
        if (existingUser.status === "registered") {
          throw new Error("Email is already registered.");
        } else if (existingUser.status === "pending") {
          throw new Error("Access request is already pending.");
        }
      }

      // Create new request
      const newRequest = userRepository.create({ email, status: "pending" });
      await userRepository.save(newRequest);

      return {
        message: "Access request submitted. Waiting for admin approval.",
      };
    } catch (error) {
      console.error("Error in AuthService (requestAccess):", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }

  /**
   * Admin approves request and generates OTP
   */
  async approveRequest(email: string) {
    const dataSource = await connectDB();
    const userRepository = dataSource.getRepository(Users);

    try {
      // Find user request
      const user = await userRepository.findOne({
        where: { email, status: "pending" },
      });

      if (!user) {
        throw new Error("No pending request found for this email.");
      }

      // Generate OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      // const otp = "555555";
      const otpExpiresAt = Date.now() + 10 * 60 * 1000000; // Expires in 60 mins

      // Update user status
      user.status = "approved";
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await userRepository.save(user);

      // TODO: Send OTP via email (implement an email service)
      await sendEmail(email, "otp", { otp });
      console.log(`OTP for ${email}: ${otp}`);

      return { message: "User approved, OTP sent." };
    } catch (error) {
      console.error("Error in AuthService (approveRequest):", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }
  async blockUser(email: string) {
    console.log(email, "block api");

    const dataSource = await connectDB();
    const userRepository = dataSource.getRepository(Users);

    try {
      // Find user request
      const user = await userRepository.findOne({
        where: { email, status: "registered" },
      });

      if (!user) {
        throw new Error("No pending request found for this email.");
      }

      // Update user status
      user.status = "blocked";
      await userRepository.save(user);

      return { message: "User blocked." };
    } catch (error) {
      console.error("Error in AuthService (blockUser):", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }
  async unblockUser(email: string) {
    console.log(email, "unblock api");

    const dataSource = await connectDB();
    const userRepository = dataSource.getRepository(Users);

    try {
      // Find user request
      const user = await userRepository.findOne({
        where: { email, status: "blocked" },
      });

      if (!user) {
        throw new Error("No pending request found for this email.");
      }

      // Update user status
      user.status = "registered";
      await userRepository.save(user);

      return { message: "User unblocked." };
    } catch (error) {
      console.error("Error in AuthService (unblockUser):", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }
  async rejectRequest(email: string) {
    const dataSource = await connectDB();
    const userRepository = dataSource.getRepository(Users);

    try {
      // Find user request
      const user = await userRepository.findOne({
        where: { email, status: "pending" },
      });

      if (!user) {
        throw new Error("No pending request found for this email.");
      }

      // Update user status
      user.status = "rejected";
      await userRepository.save(user);

      return { message: "User rejected." };
    } catch (error) {
      console.error("Error in AuthService (rejectRequest):", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }

  /**
   * Register or Login in one function
   */
  async registerOrLogin(email: string, password: string, otp?: string) {
    console.log(otp, "otp");

    const dataSource = await connectDB();
    const userRepository = dataSource.getRepository(Users);

    try {
      const user = await userRepository.findOne({ where: { email } });
      console.log(user, "user");

      if (!user) {
        return "User not found. Please request access first.";
      }
      if (user.status === "blocked") {
        return "User is blocked. Please contact support.";
      }

      //  Prevent login or registration if user is rejected
      if (user.status === "rejected") {
        throw new Error(
          "Your registration request was rejected. Please contact support for more details."
        );
      }

      // If OTP is NOT provided, attempt login
      if (otp === null || otp === undefined) {
        if (user.status !== "registered") {
          return "User is not registered. Please complete registration first.";
        }

        if (!user.password) {
          throw new Error("User exists but no password is set.");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid password.");
        }

        // Generate tokens
        const accessToken = newGenerateAccessToken(user);
        const refreshToken = newGenerateRefreshToken(user);
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();

        await userRepository.save(user);

        return {
          message: "Login successful",
          user: {
            id: user.id,
            status: user.status,
            email: user.email,
            createdAt: user.createdAt,
          },
          accessToken,
          refreshToken,
        };
      }

      // If OTP is provided, attempt registration
      if (user.status === "registered") {
        throw new Error("User is already registered.");
      } else if (user.status !== "approved") {
        throw new Error("User is not approved for registration.");
      }
      if (otp !== user.otp || Date.now() > user.otpExpiresAt!) {
        throw new Error("Invalid or expired OTP.");
      }

      // Register user
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.status = "registered";
      //   user.otp = null;
      //   user.otpExpiresAt = null;

      // Generate tokens
      const accessToken = newGenerateAccessToken(user);
      const refreshToken = newGenerateRefreshToken(user);
      user.refreshToken = refreshToken;

      await userRepository.save(user);
      return {
        message: "Registration successful",
        user: {
          id: user.id,
          status: user.status,
          email: user.email,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error("Error in AuthService (registerOrLogin):", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string) {
    const dataSource = await connectDB();
    const userRepository = dataSource.getRepository(Users);

    try {
      const user = await userRepository.findOne({ where: { refreshToken } });
      console.log(user, "user");

      if (!user) {
        throw new Error("Invalid refresh token.");
      }

      const newAccessToken = newGenerateAccessToken(user);
      const newRefreshToken = newGenerateRefreshToken(user);
      // Update the user's refresh token in the database
      user.refreshToken = newRefreshToken;
      await userRepository.save(user);
      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      console.error("Error in AuthService (refreshAccessToken):", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }
}
