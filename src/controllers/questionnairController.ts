import { log } from "node:console";
import { QuestionService } from "../services/questionnaireService";

export class QuestionController {
  private questionService = new QuestionService();
  constructor() {
    this.questionService = new QuestionService();
  }
  async addQuestions(questions: {
    title: string;
    question: string;
    description: string;
    questionType: "single_choice" | "multiple_choice" | "plain_text" | "date";
    summaryPrefix: string;
    order: number;
    required: boolean;
  }) {
    console.log(questions, "QUESTIONS");

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Questions must be a non-empty array");
    }
    // Validate each question

    questions.forEach((q) => {
      if (!q.question || !q.questionType || !q.title) {
        throw new Error(
          "Each question must include 'question', 'questionType', 'title', and 'description'"
        );
      }

      if (
        (q.questionType === "multiple_choice" ||
          q.questionType === "single_choice") &&
        !Array.isArray(q.options)
      ) {
        throw new Error(
          "Multiple choice and single choice questions must include an 'options' array"
        );
      }
    });
    try {
      const result = await this.questionService.addQuestions(questions);
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
    } catch (error) {
      console.error("Error in QuestionController (addQuestions):", error);
      throw error;
    }
  }

  async getQuestions(requestedUserId?: any) {
    try {
      const result = await this.questionService.getQuestions(requestedUserId);
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

  async updateQuestions(
    questions: {
      id: number;
      title?: string;
      question?: string;
      description?: string;
      questionType: "single_choice" | "multiple_choice" | "plain_text" | "date";
      summaryPrefix?: string;
      order?: number;
      required?: boolean;
      options?: { id?: number; optionText?: string }[];
    }[]
  ) {
    console.log(questions, "QUESTIONS");

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Questions must be a non-empty array");
    }

    try {
      const result = await this.questionService.updateQuestions(questions);
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
      console.error("Error in QuestionController (updateQuestions):", error);
      throw error;
    }
  }

  async deleteQuestions(questionIds: number[]): Promise<void> {
    try {
      await this.questionService.deleteQuestions(questionIds);
    } catch (error) {
      console.error("Error in QuestionController (deleteQuestions):", error);
      throw error;
    }
  }
}
