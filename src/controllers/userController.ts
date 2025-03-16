import { log } from "node:console";
import { UserService } from "../services/userService";

export class UserController {
  private userService = new UserService();
  constructor() {
    this.userService = new UserService();
  }

  async getUserData(requestedUserId?: number, pendingUsers?: string) {
    try {
      const result = await this.userService.getUserData(
        requestedUserId,
        pendingUsers
      );
      return {
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
        body: JSON.stringify(result),
      };
    } catch (error) {
      console.error("Error in QuestionController (getQuestions):", error);
      throw error;
    }
  }
}
