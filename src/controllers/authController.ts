import { AuthService } from "../services/authService";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }
  //define service from service factory
  // @authenticateUser()
  async registerUser(userData: {
    username: string;
    email: string;
    password: string;
  }) {
    try {
      const result = await this.authService.registerUser(userData);
      return {
        statusCode: 201,
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:3001", // or "*" if you prefer
          "Access-Control-Allow-Credentials": true,
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
        body: JSON.stringify(result),
      };
    } catch (error) {
      console.error("Error in AuthController (registerUser):", error);
      throw error;
    }
  }

  async loginUser(credentials: { username: string; password: string }) {
    try {
      const result = await this.authService.loginUser(credentials);
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
      console.error("Error in AuthController (loginUser):", error);
      throw error;
    }
  }
  async refreshToken(refreshToken: string) {
    try {
      const result = await this.authService.refreshAccessToken(refreshToken);
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
      console.error("Error in AuthController (refreshToken):", error);
      throw error;
    }
  }
}
