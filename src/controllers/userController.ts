import { log } from "node:console";
import { UserService } from "../services/userService";

export class UserController {
  private userService = new UserService();
  constructor() {
    this.userService = new UserService();
  }

  async getUserData(requestedUserId?: number) {
    try {
      const result = await this.userService.getUserData(requestedUserId);
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // or "*" if you prefer
          "Access-Control-Allow-Credentials": true,
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
        body: JSON.stringify(result),
      };
    } catch (error) {
      console.error("Error in QuestionController (getQuestions):", error);
      throw error;
    }
  }

  async updateUserProfile(requiredUser: number, profileData: any) {
    try {
      const result = await this.userService.updateUserProfile(
        requiredUser,
        profileData
      );
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // or "*" if you prefer
          "Access-Control-Allow-Credentials": true,
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
        body: JSON.stringify(result),
      };
    } catch (error) {
      console.error("Error in QuestionController (getQuestions):", error);
      throw error;
    }
  }
}
