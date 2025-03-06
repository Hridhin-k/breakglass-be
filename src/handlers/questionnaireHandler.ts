import "reflect-metadata";
import { QuestionController } from "../controllers/questionnairController";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { authenticateToken } from "../utils/authUtils";
const questionController = new QuestionController();
export const addQuestionsHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const userId = authenticateToken(event);

  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized" }),
    };
  }

  try {
    const { questions } = JSON.parse(event.body || "{}");

    // Delegate the business logic to the controller
    await questionController.addQuestions(questions);

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*", // or "*" if you prefer
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      body: JSON.stringify({ message: "Questions added successfully" }),
    };
  } catch (error: any) {
    console.error("Add Questions error:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message }),
    };
  }
};

export const getQuestionsHandler = async (
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

    // Delegate the business logic to the controller
    const response = await questionController.getQuestions();

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

export const updateQuestionsHandler = async (
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
    const { questions } = JSON.parse(event.body || "{}");

    // Validate input
    if (!Array.isArray(questions) || questions.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Questions must be a non-empty array",
        }),
      };
    }

    // Delegate the business logic to the controller
    await questionController.updateQuestions(questions);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // or "*" if you prefer
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      body: JSON.stringify({ message: "Questions updated successfully" }),
    };
  } catch (error: any) {
    console.error("Update Questions error:", error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: error.message }),
    };
  }
};

export const deleteQuestionsHandler = async (
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
    const { questionIds } = JSON.parse(event.body || "{}");

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid request. Provide an array of question IDs.",
        }),
      };
    }

    // Delegate the business logic to the controller
    await questionController.deleteQuestions(questionIds);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // or "*" if you prefer
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      body: JSON.stringify({ message: "Questions deleted successfully" }),
    };
  } catch (error) {
    console.error("Delete Questions error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
