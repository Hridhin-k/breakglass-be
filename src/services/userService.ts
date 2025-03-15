import { In } from "typeorm";
import { Users } from "../entities/Users";
import { connectDB } from "../utils/database";

export class UserService {
  async getUserData(requestedUserId?: number, pendingUsers?: string) {
    console.log(requestedUserId, pendingUsers);

    const dataSource = await connectDB();
    const userRepository = dataSource.getRepository(Users);

    try {
      const whereCondition: any = {}; // Initialize empty filter

      if (requestedUserId) {
        whereCondition.id = requestedUserId;
      }

      if (pendingUsers) {
        whereCondition.status = pendingUsers; // Add status filter if pendingUsers is provided
      } else {
        // Default to fetching users with status "registered" or "blocked"
        whereCondition.status = In(["registered", "blocked"]);
      }

      const users = await userRepository.find({
        where: whereCondition, // Filter by userId if provided
        relations: ["submissions"], // Fetch submissions along with users
      });

      console.log(users); // Debugging

      const userData = users.map((user) => ({
        userId: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        lastLogin: user.lastLogin,
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        institution: user.institution,
        classYear: user.classYear,
        majoringIn: user.majoringIn,
        studentOrganization: user.studentOrganization,
        category: user.category,
        createdAt: user.createdAt,
        submissions: user.submissions || [], // Include all submission details
      }));

      return {
        statusCode: 200,
        body: {
          success: true,
          data: userData,
        },
      };
    } catch (error: any) {
      console.error("Error in UserService (getUserData):", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "An error occurred while fetching users.",
          error: error.message,
        }),
      };
    } finally {
      await dataSource.destroy();
    }
  }

  async updateUserProfile(requiredUser: number, profileData: any) {
    const dataSource = await connectDB();
    const userRepository = dataSource.getRepository(Users);
    console.log(profileData);

    try {
      const user = await userRepository.findOne({
        where: { id: requiredUser },
      });

      if (!user) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            success: false,
            message: "User not found",
          }),
        };
      }
      console.log(user, "user");

      // Update user profile fields (excluding username and password)
      user.firstName = profileData.firstName || user.firstName;
      user.lastName = profileData.lastName || user.lastName;
      user.mobileNumber = profileData.mobileNumber || user.mobileNumber;
      user.address = profileData.address || user.address;
      user.city = profileData.city || user.city;
      user.state = profileData.state || user.state;
      user.zipCode = profileData.zipCode || user.zipCode;
      user.institution = profileData.institution || user.institution;
      user.classYear = profileData.classYear || user.classYear;
      user.majoringIn = profileData.majoringIn || user.majoringIn;
      user.studentOrganization =
        profileData.studentOrganization || user.studentOrganization;
      user.category = profileData.category || user.category;

      await userRepository.save(user);

      return {
        statusCode: 200,
        body: {
          success: true,
          message: "Profile updated successfully",
          data: user,
        },
      };
    } catch (error: any) {
      console.error("Error in UserService (updateUserProfile):", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "An error occurred while updating profile.",
          error: error.message,
        }),
      };
    } finally {
      await dataSource.destroy();
    }
  }
}
