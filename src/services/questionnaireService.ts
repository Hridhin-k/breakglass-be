import { In } from "typeorm";
import { connectDB } from "../utils/database";
import { IncidentQuestion } from "../entities/IncidentQuestion";
import { IncidentQuestionOption } from "../entities/IncidentQuestionOption";
import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();
const s3 = new AWS.S3();
export class QuestionService {
  async addQuestions(
    questions: {
      title: string;
      question: string;
      description: string;
      questionType:
        | "single_choice"
        | "multiple_choice"
        | "plain_text"
        | "date"
        | "map";
      summaryPrefix: string;
      order: number;
      required: boolean;
      options?: { optionText: string }[];
    }[]
  ) {
    const dataSource = await connectDB();
    const questionRepository = dataSource.getRepository(IncidentQuestion);
    try {
      const formattedQuestions = questions.map((q) => {
        const questionEntity = new IncidentQuestion();
        questionEntity.title = q.title;
        questionEntity.question = q.question;
        questionEntity.description = q.description;
        questionEntity.questionType = q.questionType;
        questionEntity.summaryPrefix = q.summaryPrefix;
        questionEntity.order = q.order;
        questionEntity.required = q.required;
        if (
          (q.questionType === "multiple_choice" ||
            q.questionType === "single_choice") &&
          q.options
        ) {
          questionEntity.options = q.options.map((o) => {
            const option = new IncidentQuestionOption();
            option.optionText = o.optionText;

            return option;
          });
        }
        return questionEntity;
      });

      await questionRepository.save(formattedQuestions);
      return { message: "Questions added successfully" };
    } catch (error) {
      console.error("Error in QuestionService (addQuestions):", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }

  async getQuestions(requestedUserId?: number) {
    // userId is now optional
    const dataSource = await connectDB();
    const questionRepository = dataSource.getRepository(IncidentQuestion);

    try {
      const questions = await questionRepository
        .createQueryBuilder("question")
        .leftJoinAndSelect("question.options", "option")
        .orderBy("question.order", "ASC")
        .addOrderBy("option.createdAt", "ASC")
        .getMany();

      let questionsWithPresignedUrls = questions; // Default to questions without URLs

      if (requestedUserId) {
        // Generate URLs only if userId is provided
        questionsWithPresignedUrls = await Promise.all(
          questions.map(async (question) => {
            if (question.questionType === "file") {
              const presignedUrls = [];
              for (let i = 0; i < 10; i++) {
                const key = `${uuidv4()}`;
                const params = {
                  Bucket: process.env.UPLOAD_BUCKET_NAME,
                  Key: key,
                  Expires: 60 * 30, // 5 minutes
                };
                const url = await s3.getSignedUrlPromise("putObject", params);

                presignedUrls.push({ url, key });
              }
              return { ...question, presignedUrls };
            }
            return question;
          })
        );
      }

      return {
        statusCode: 200,
        body: {
          success: true,
          data: questionsWithPresignedUrls,
        },
      };
    } catch (error: any) {
      console.error("Error in QuestionService (getQuestions):", error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "An error occurred while fetching questions.",
          error: error.message,
        }),
      };
    } finally {
      await dataSource.destroy();
    }
  }

  async updateQuestions(
    questions: {
      id: number;
      title?: string;
      question?: string;
      description?: string;
      questionType:
        | "single_choice"
        | "multiple_choice"
        | "plain_text"
        | "date"
        | "map";
      summaryPrefix?: string;
      order?: number;
      required?: boolean;
      options?: { id?: number; optionText?: string }[];
    }[]
  ) {
    const dataSource = await connectDB();
    const questionRepository = dataSource.getRepository(IncidentQuestion);
    const optionRepository = dataSource.getRepository(IncidentQuestionOption);

    try {
      const updatedQuestions = [];

      for (const q of questions) {
        // Fetch the existing question
        const question = await questionRepository.findOne({
          where: { id: q.id },
          relations: ["options"], // Include options if needed
        });

        if (!question) {
          throw new Error(`Question with ID ${q.id} not found`);
        }

        // Update question fields
        if (q.question) question.question = q.question;
        if (q.summaryPrefix) question.summaryPrefix = q.summaryPrefix;
        if (q.description) question.description = q.description;
        if (q.title) question.title = q.title;
        if (q.questionType) question.questionType = q.questionType;
        if (q.order) question.order = q.order;
        if (q.required) question.required = q.required;

        // Update or add options if applicable
        if (q.options) {
          for (const option of q.options) {
            if (option.id) {
              // Update existing option
              const existingOption = question.options.find(
                (o) => o.id === option.id
              );
              if (existingOption) {
                existingOption.optionText =
                  option.optionText || existingOption.optionText;
              }
            } else if (option.optionText) {
              // Add new option
              const newOption = new IncidentQuestionOption();
              newOption.optionText = option.optionText;
              question.options.push(newOption);
            }
          }
        }

        // Save the updated question
        const savedQuestion = await questionRepository.save(question);
        updatedQuestions.push(savedQuestion);
      }

      return { message: "Questions updated successfully", updatedQuestions };
    } catch (error) {
      console.error("Error in QuestionService (updateQuestions):", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }

  async deleteQuestions(questionIds: number[]): Promise<void> {
    const dataSource = await connectDB();
    const questionRepository = dataSource.getRepository(IncidentQuestion);

    try {
      // Use TypeORM's `delete` method to remove questions and cascade deletions to nested options
      await questionRepository
        .createQueryBuilder()
        .delete()
        .from(IncidentQuestion)
        .where("id IN (:...ids)", { ids: questionIds })
        .execute();
    } catch (error) {
      console.error("Error in QuestionService (deleteQuestions):", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }
}
