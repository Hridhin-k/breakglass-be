import "reflect-metadata";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { authenticateToken } from "../utils/authUtils";
import { UserController } from "../controllers/userController";
const userController = new UserController();

export const getUserHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = authenticateToken(event);

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }
    const requestedUserId = event.queryStringParameters?.userId
      ? Number(event.queryStringParameters.userId)
      : undefined; // Convert to number if present, else pass undefined
    // Delegate the business logic to the controller
    const response = await userController.getUserData(requestedUserId);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // or "*" if you prefer
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      body: response.body,
    };
  } catch (error) {
    console.error("Get Questions error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
export const updateUserHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = authenticateToken(event);
  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }
  try {
    const { requiredUser, profileData } = JSON.parse(event.body || "{}");
    await userController.updateUserProfile(requiredUser, profileData);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // or "*" if you prefer
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      body: JSON.stringify({ message: "Profile updated successfully" }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "An unexpected error occurred",
      }),
    };
  }
  // Delegate the business logic to the controller
};
