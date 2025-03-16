import "reflect-metadata";
import { APIGatewayEvent, Context } from "aws-lambda";
import { AuthService } from "../services/authService";

const authService = new AuthService();
export const handleAuth = async (event: APIGatewayEvent, context: Context) => {
  try {
    const { action, email, password, otp, refreshToken } = JSON.parse(
      event.body || "{}"
    );
    let response;
    console.log(action, email, password, otp, refreshToken);

    switch (action) {
      case "requestAccess":
        response = await authService.requestAccess(email);
        break;

      case "approveRequest":
        response = await authService.approveRequest(email);
        break;
      case "blockUser":
        response = await authService.blockUser(email);
        break;
      case "unblockUser":
        response = await authService.unblockUser(email);
        break;
      case "rejectRequest":
        response = await authService.rejectRequest(email);
        break;
      case "registerOrLogin":
        response = await authService.registerOrLogin(email, password, otp);
        break;

      case "refreshAccessToken":
        response = await authService.refreshAccessToken(refreshToken);
        break;

      default:
        throw new Error("Invalid action.");
    }
    console.log(response);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // or "*" if you prefer
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*", // or "*" if you prefer
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
