import "reflect-metadata";
import { APIGatewayEvent, Context } from "aws-lambda";
import { AuthController } from "../controllers/authController";

export const registerUser = async (
  event: APIGatewayEvent,
  context: Context
) => {
  const { username, email, password } = JSON.parse(event.body || "{}");

  const authController = new AuthController();

  try {
    const response = await authController.registerUser({
      username,
      email,
      password,
    });
    return response;
  } catch (error: any) {
    console.error("Error in registerUserHandler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "An unexpected error occurred",
      }),
    };
  }
};

//login handler function
export const loginUser = async (event: APIGatewayEvent, context: Context) => {
  const { username, password } = JSON.parse(event.body || "{}");
  const authController = new AuthController();

  try {
    const response = await authController.loginUser({ username, password });
    return response;
  } catch (error: any) {
    console.error("Error in loginUserHandler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "An unexpected error occurred",
      }),
    };
  }
};

export const refreshToken = async (
  event: APIGatewayEvent,
  context: Context
) => {
  const { refreshToken } = JSON.parse(event.body || "{}");
  const authController = new AuthController();

  try {
    const response = await authController.refreshToken(refreshToken);
    return response;
  } catch (error: any) {
    console.error("Error in refeshTokenHandler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "An unexpected error occurred",
      }),
    };
  }
};
