import { IncidentSubmissionService } from "../services/incidentSubmissionService";
import { In } from "typeorm";

// const incidentService = new IncidentSubmissionService();

export class IncidentSubmissionController {
  private incidentService = new IncidentSubmissionService();
  constructor() {
    this.incidentService = new IncidentSubmissionService();
  }
  /** Submit a new incident */
  async submitIncident(userId: number, answers: any) {
    const result = await this.incidentService.submitIncident(userId, answers);
    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*", // or "*" if you prefer
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      body: result,
    };
  }

  /**update */
  async updateIncident(
    userId: number,
    incidentSubmissionId: number,
    newAnswers: any
  ) {
    const result = await this.incidentService.updateIncident(
      userId,
      incidentSubmissionId,

      newAnswers
    );
    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*", // or "*" if you prefer
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      body: JSON.stringify(result),
    };
  }
  /** Get perticular incident of a user **/
  async getUserSubmissionByIncidentId(
    userId: number,
    incidentNumber: number,
    requestedVersion?: number
  ) {
    return await this.incidentService.getUserSubmissionByIncidentId(
      userId,
      incidentNumber,
      requestedVersion
    );
  }
  // get all the submissions of a user
  async getAllUserSubmission(userId: number, requestedVersion?: number) {
    return await this.incidentService.getAllUserSubmission(userId);
  }

  //get all submissions of all user
  async getAllSubmissions(requestedVersion?: number) {
    return await this.incidentService.getAllSubmissions(requestedVersion);
  }
}
