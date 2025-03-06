import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "../utils/database";
import { User } from "../entities/User";
import { generateAccessToken, generateRefreshToken } from "../utils/authUtils";

export class AuthService {
  async registerUser(userData: {
    username: string;
    email: string;
    password: string;
  }) {
    const { username, email, password } = userData;
    const dataSource = await connectDB();
    const userRepository = dataSource.getRepository(User);

    try {
      // Check if user exists
      const existingUser = await userRepository.findOne({
        where: [{ username }, { email }],
      });
      if (existingUser) {
        throw new Error(
          existingUser.username === username
            ? "Username already exists"
            : "Email already exists"
        );
      }

      // Hash password and save user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = userRepository.create({
        username,
        email,
        password: hashedPassword,
      });
      await userRepository.save(newUser);
      // Generate tokens
      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);

      // Store refresh token in the database (optional: store in Redis or another secure storage)
      newUser.refreshToken = refreshToken;
      await userRepository.save(newUser);
      return {
        message: "User registered successfully",
        user: { username, email },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error("Error in AuthService (registerUser):", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }

  async loginUser(credentials: { username: string; password: string }) {
    //mention return type here
    const { username, password } = credentials;
    const dataSource = await connectDB();
    const userRepository = dataSource.getRepository(User);

    try {
      // Find user
      const user = await userRepository.findOne({ where: { username } });
      if (!user) {
        throw new Error("User not found");
      }

      // Validate password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid password");
      }

      // Generate token
      // const token = jwt.sign(
      //   { userId: user.id, username: user.username },
      //   process.env.JWT_SECRET as string,
      //   {
      //     expiresIn: "24h",
      //   }
      // );
      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await userRepository.save(user);
      return {
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error("Error in AuthService (loginUser):", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }

  async refreshAccessToken(refreshToken: string) {
    const dataSource = await connectDB();
    const userRepository = dataSource.getRepository(User);

    try {
      // Find user by refresh token
      const user = await userRepository.findOne({ where: { refreshToken } });
      if (!user) {
        throw new Error("Invalid refresh token");
      }

      // Generate new access token
      const newAccessToken = generateAccessToken(user);

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      console.error("Error in AuthService (refreshAccessToken):", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }
}
