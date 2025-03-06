import { connectDB } from "../utils/database";
import { User } from "../entities/User";

export class UserService {
  async getUserData(requestedUserId?: number) {
    const dataSource = await connectDB();
    const userRepository = dataSource.getRepository(User);

    try {
      const whereCondition = requestedUserId ? { id: requestedUserId } : {}; // Apply filter if userId is provided

      const users = await userRepository.find({
        where: whereCondition, // Filter by userId if provided
        relations: ["submissions"], // Fetch submissions along with users
      });

      console.log(users); // Debugging

      const userData = users.map((user) => ({
        userId: user.id,
        username: user.username,
        email: user.email,
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
    const userRepository = dataSource.getRepository(User);
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
