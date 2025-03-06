import "reflect-metadata";
import { IncidentSubmissionController } from "../controllers/incidentSubmissionController";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { authenticateToken } from "../utils/authUtils";
import { constants as httpConstants } from "http2";
const incidentSubmissionController = new IncidentSubmissionController();
export const submitIncidentHandler = async (
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
    const { userId, answers } = JSON.parse(event.body || "{}");
    await incidentSubmissionController.submitIncident(userId, answers);
    return {
      statusCode: httpConstants.HTTP_STATUS_OK, //import http constance
      headers: {
        "Access-Control-Allow-Origin": "*", // or "*" if you prefer
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      body: JSON.stringify({ message: "Incident submitted successfully" }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "An unexpected error occurred",
      }),
    };
  }
};

export const updateIncidentHandler = async (
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
    const { userId, incidentSubmissionId, newAnswers } = JSON.parse(
      event.body || "{}"
    );
    await incidentSubmissionController.updateIncident(
      userId,
      incidentSubmissionId,

      newAnswers
    );
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // or "*" if you prefer
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      body: JSON.stringify({ message: "Incident updated successfully" }),
    };
  } catch (error: any) {
    console.error("Error updating incident:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "An unexpected error occurred",
      }),
    };
  }
};

export const getUserSubmissionsHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const authenticatedUserId = authenticateToken(event);

    if (!authenticatedUserId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }
    const requestedUserId = event.queryStringParameters?.userId;
    const incidentNumber = event.queryStringParameters?.incidentNumber;
    const requestedVersion = event.queryStringParameters?.version
      ? Number(event.queryStringParameters?.version)
      : undefined;
    console.log(requestedUserId, incidentNumber, "what is it");

    let submissions;
    if (requestedUserId && incidentNumber) {
      submissions =
        await incidentSubmissionController.getUserSubmissionByIncidentId(
          +requestedUserId,
          +incidentNumber,
          requestedVersion
        );
    } else if (requestedUserId) {
      submissions = await incidentSubmissionController.getAllUserSubmission(
        +requestedUserId,
        requestedVersion
      );
    } else {
      // Fetch all submissions if userId is not provided
      submissions = await incidentSubmissionController.getAllSubmissions(
        requestedVersion
      );
    }
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // or "*" if you prefer
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      body: JSON.stringify(submissions),
    };
  } catch (error: any) {
    console.error("Error fetching user submissions:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "An unexpected error occurred",
      }),
    };
  }
};
