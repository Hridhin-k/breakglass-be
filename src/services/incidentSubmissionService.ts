import { Equal, Repository } from "typeorm";
import { connectDB } from "../utils/database";
import { IncidentSubmission } from "../entities/IncidentSubmission";
import { IncidentAnswer } from "../entities/IncidentAnswer";
import { IncidentQuestion } from "../entities/IncidentQuestion";
import { log } from "node:console";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import * as mime from "mime-types";
import { IncidentMedia } from "../entities/IncidentMedia";
import AWS from "aws-sdk";
import dotenv from "dotenv";
import { Users } from "../entities/Users";

dotenv.config(); // Load environment variables
const s3 = new AWS.S3();
interface FileData {
  fileName: string;
  file: string;
  contentType: string;
  description?: string;
}
export class IncidentSubmissionService {
  // async uploadFileToS3(
  //   fileBuffer: Buffer,
  //   fileName: string,
  //   contentType: string
  // ): Promise<string> {
  //   const bucketName = process.env.UPLOAD_BUCKET_NAME;

  //   if (!bucketName) {
  //     throw new Error(
  //       "UPLOAD_BUCKET_NAME is not defined in environment variables."
  //     );
  //   }

  //   const key = `${uuidv4()}-${fileName}`;
  //   const uploadParams = {
  //     Bucket: bucketName,
  //     Key: key,
  //     Body: fileBuffer,
  //     ContentType: contentType,
  //   };

  //   await s3.upload(uploadParams).promise();
  //   return `https://${bucketName}.s3.${process.env.UPLOAD_REGION}.amazonaws.com/${key}`;
  // }
  // async submitIncident(
  //   userId: number,
  //   answers: { questionId: number; answer: string | any | any[] }[]
  // ) {
  //   const dataSource = await connectDB();
  //   const incidentRepository = dataSource.getRepository(IncidentSubmission);
  //   const answerRepository = dataSource.getRepository(IncidentAnswer);
  //   const questionRepository = dataSource.getRepository(IncidentQuestion);
  //   const mediaRepository = dataSource.getRepository(IncidentMedia);

  //   try {
  //     // Step 1: Create a new incident submission
  //     const submission = incidentRepository.create({
  //       user: { id: userId },
  //       incidentNumber: Date.now(),
  //       version: 1,
  //     });

  //     await incidentRepository.save(submission);

  //     // Step 2: Prepare answer entities
  //     const answerEntities = await Promise.all(
  //       answers.map(async ({ questionId, answer }) => {
  //         const question = await questionRepository.findOne({
  //           where: { id: questionId },
  //         });

  //         if (!question) {
  //           throw new Error(`Question with ID ${questionId} not found.`);
  //         }

  //         const answerEntity = answerRepository.create({
  //           incidentSubmission: submission,
  //           question,
  //           type: question.questionType,
  //           version: 1,
  //         });
  //         // Store answer based on question type
  //         switch (question.questionType) {
  //           case "single_choice":
  //             answerEntity.singleChoiceAnswer = answer as string;
  //             break;
  //           case "multiple_choice":
  //             answerEntity.multipleChoiceAnswer = Array.isArray(answer)
  //               ? answer
  //               : [answer as string];
  //             break;
  //           case "date":
  //             answerEntity.dateAnswer = new Date(answer as string);
  //             break;
  //           case "plain_text":
  //             answerEntity.textAnswer = answer as string;
  //             break;
  //           case "map":
  //             if (typeof answer === "string") {
  //               try {
  //                 answerEntity.mapAnswer = JSON.parse(answer);
  //               } catch (error) {
  //                 throw new Error(
  //                   `Invalid map data format for question ${questionId}`
  //                 );
  //               }
  //             } else {
  //               answerEntity.mapAnswer = answer as {
  //                 name: string;
  //                 latitude: number;
  //                 longitude: number;
  //               };
  //             }
  //             break;
  //           case "file":
  //             if (Array.isArray(answer)) {
  //               await Promise.all(
  //                 answer.map(
  //                   async (fileData: {
  //                     fileName: string;
  //                     file: string;
  //                     contentType: string;
  //                     description?: string;
  //                   }) => {
  //                     const fileBuffer = Buffer.from(fileData.file, "base64");
  //                     const fileUrl = await this.uploadFileToS3(
  //                       fileBuffer,
  //                       fileData.fileName,
  //                       fileData.contentType
  //                     );

  //                     const media = mediaRepository.create({
  //                       incidentSubmission: submission,
  //                       question,
  //                       url: fileUrl,
  //                       mimeType: fileData.contentType,
  //                       version: 1,
  //                       description: fileData.description,
  //                     });
  //                     await mediaRepository.save(media);
  //                   }
  //                 )
  //               );
  //             }
  //             break;
  //           default:
  //             throw new Error(
  //               `Invalid question type: ${question.questionType}`
  //             );
  //         }

  //         return answerEntity;
  //       })
  //     );

  //     // Step 3: Save answers to the database
  //     await answerRepository.save(answerEntities);

  //     return { message: "Incident submitted successfully", submission };
  //   } catch (error) {
  //     console.error(
  //       "Error in IncidentSubmissionService (submitIncident):",
  //       error
  //     );
  //     throw error;
  //   } finally {
  //     await dataSource.destroy();
  //   }
  // }

  async submitIncident(
    userId: number,
    answers: {
      questionId: number;
      answer: string | any | any[];
      uploadedFiles?: { key: string; mimeType: string }[];
    }[]
  ) {
    const dataSource = await connectDB();
    const incidentRepository = dataSource.getRepository(IncidentSubmission);
    const answerRepository = dataSource.getRepository(IncidentAnswer);
    const questionRepository = dataSource.getRepository(IncidentQuestion);
    const mediaRepository = dataSource.getRepository(IncidentMedia);

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submission = incidentRepository.create({
        user: { id: userId },
        incidentNumber: Date.now(),
        version: 1,
      });

      const savedSubmission = await queryRunner.manager.save(submission);

      for (const { questionId, answer, uploadedFiles } of answers) {
        const question = await questionRepository.findOne({
          where: { id: questionId },
        });

        if (!question) {
          throw new Error(`Question with ID ${questionId} not found.`);
        }

        const answerEntity = answerRepository.create({
          incidentSubmission: savedSubmission,
          question,
          type: question.questionType,
          version: 1,
        });

        switch (question.questionType) {
          case "single_choice":
            answerEntity.singleChoiceAnswer = answer as string;
            await queryRunner.manager.save(answerEntity);
            break;
          case "multiple_choice":
            answerEntity.multipleChoiceAnswer = Array.isArray(answer)
              ? answer
              : [answer as string];
            await queryRunner.manager.save(answerEntity);
            break;
          case "date":
            answerEntity.dateAnswer = new Date(answer as string);
            await queryRunner.manager.save(answerEntity);
            break;
          case "plain_text":
            answerEntity.textAnswer = answer as string;
            await queryRunner.manager.save(answerEntity);
            break;
          case "map":
            if (typeof answer === "string") {
              try {
                answerEntity.mapAnswer = JSON.parse(answer);
              } catch (error) {
                throw new Error(
                  `Invalid map data format for question ${questionId}`
                );
              }
            } else {
              answerEntity.mapAnswer = answer as {
                name: string;
                latitude: number;
                longitude: number;
              };
            }
            await queryRunner.manager.save(answerEntity);
            break;
          case "file":
            // Handle file uploads
            if (uploadedFiles && uploadedFiles.length > 0) {
              for (const file of uploadedFiles) {
                const bucketName = process.env.UPLOAD_BUCKET_NAME; // Get bucket name from env
                const region = process.env.UPLOAD_REGION || "us-east-1"; // Get region from env, default to us-east-1
                const url = `https://${bucketName}.s3${
                  region === "us-east-1" ? "" : `.${region}`
                }.amazonaws.com/${file.key}`;
                console.log(url);

                const media = mediaRepository.create({
                  incidentSubmission: savedSubmission,
                  question,
                  url: url, // store the key
                  mimeType: file.mimeType,
                  version: 1,
                });
                await queryRunner.manager.save(media);
              }
            }
            break;
          default:
            throw new Error(`Invalid question type: ${question.questionType}`);
        }
      }

      await queryRunner.commitTransaction();

      return {
        message: "Incident submitted successfully",
        submission: savedSubmission,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(
        "Error in IncidentSubmissionService (submitIncident):",
        error
      );
      throw error;
    } finally {
      await queryRunner.release();
      await dataSource.destroy();
    }
  }

  // Get all incidents of a user
  async getAllUserSubmission(
    userId: number,
    // incidentNumber: number,
    requestedVersion?: number
  ) {
    const dataSource = await connectDB();
    const incidentRepository = dataSource.getRepository(IncidentSubmission);
    const userRepository = dataSource.getRepository(Users);
    const answerRepository = dataSource.getRepository(IncidentAnswer);
    try {
      const user = await userRepository.findOne({
        where: { id: userId },
        select: [
          "id",
          "username",
          "email",
          "firstName",
          "lastName",
          "mobileNumber",
          "address",
          "city",
          "state",
          "zipCode",
          "institution",
          "category",
          "classYear",
          "majoringIn",
        ],
      });

      if (!user) {
        throw new Error("User not found");
      }
      let submissions = [];
      if (requestedVersion !== undefined) {
        submissions = await incidentRepository
          .createQueryBuilder("submission")
          .leftJoinAndSelect("submission.answers", "answer")
          .leftJoinAndSelect("answer.question", "question")
          .where("submission.userId = :userId", { userId })
          .andWhere((qb) => {
            const subQuery = qb
              .subQuery()
              .select("latestAnswer.version") // Select the version
              .from(IncidentAnswer, "latestAnswer")
              .where("latestAnswer.questionId = answer.questionId") // Correlate with outer query
              .andWhere("latestAnswer.version <= :requestedVersion", {
                //query return all versions less than or equal to requestedVersion
                requestedVersion,
              })
              .getQuery();

            return `answer.version IN (${subQuery})`; // Use IN for multiple possible versions
          })
          .getMany();
      } else {
        submissions = await incidentRepository
          .createQueryBuilder("submission")
          .leftJoinAndSelect("submission.answers", "answer")
          .leftJoinAndSelect("answer.question", "question")
          .where("submission.userId = :userId", { userId })
          .andWhere((qb) => {
            const subQuery = qb
              .subQuery()
              .select("MAX(latestAnswer.version)", "maxVersion")
              .from(IncidentAnswer, "latestAnswer")
              .where("latestAnswer.questionId = answer.questionId") // Correlate
              .getQuery();

            return `answer.version = (${subQuery})`; // Direct comparison for max version
          })
          .orderBy("question.order", "ASC")
          .getMany();
      }

      return { user, submissions };
    } catch (error) {
      console.error("Error fetching user submissions:", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }

  // get perticular incident of a perticular user
  async getUserSubmissionByIncidentId(
    userId: number,
    incidentNumber: number,
    requestedVersion?: number
  ) {
    const dataSource = await connectDB();
    const incidentRepository = dataSource.getRepository(IncidentSubmission);
    const userRepository = dataSource.getRepository(Users);
    const answerRepository = dataSource.getRepository(IncidentAnswer);
    try {
      const user = await userRepository.findOne({
        where: { id: userId },
        select: [
          "id",
          "username",
          "email",
          "firstName",
          "lastName",
          "mobileNumber",
          "address",
          "city",
          "state",
          "zipCode",
          "institution",
          "category",
          "classYear",
          "majoringIn",
        ],
      });

      if (!user) {
        throw new Error("User not found");
      }
      let submissions = [];
      if (requestedVersion !== undefined) {
        submissions = await incidentRepository
          .createQueryBuilder("submission")
          .leftJoinAndSelect("submission.answers", "answer")
          .leftJoinAndSelect("answer.question", "question")
          .where("submission.userId = :userId", { userId })
          .andWhere((qb) => {
            const subQuery = qb
              .subQuery()
              .select("latestAnswer.version") // Select the version
              .from(IncidentAnswer, "latestAnswer")
              .where("latestAnswer.questionId = answer.questionId") // Correlate with outer query
              .andWhere("latestAnswer.version <= :requestedVersion", {
                //query return all versions less than or equal to requestedVersion
                requestedVersion,
              })
              .getQuery();

            return `answer.version IN (${subQuery})`; // Use IN for multiple possible versions
          })
          .getMany();
      } else {
        submissions = await incidentRepository
          .createQueryBuilder("submission")
          .leftJoinAndSelect("submission.answers", "answer")
          .leftJoinAndSelect("answer.question", "question")
          .where("submission.incidentNumber = :incidentNumber", {
            incidentNumber,
          })
          .andWhere((qb) => {
            const subQuery = qb
              .subQuery()
              .select("MAX(latestAnswer.version)", "maxVersion")
              .from(IncidentAnswer, "latestAnswer")
              .where("latestAnswer.questionId = answer.questionId") // Correlate
              .getQuery();

            return `answer.version = (${subQuery})`; // Direct comparison for max version
          })
          .orderBy("question.order", "ASC")
          .getMany();
      }

      return { user, submissions };
    } catch (error) {
      console.error("Error fetching user submissions:", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }

  // get all submitions of every user
  async getAllSubmissions(requestedVersion?: number) {
    const dataSource = await connectDB();
    const incidentRepository = dataSource.getRepository(IncidentSubmission);
    const userRepository = dataSource.getRepository(Users);
    try {
      const submissions = await incidentRepository
        .createQueryBuilder("submission")
        .leftJoinAndSelect("submission.answers", "answer")
        .leftJoinAndSelect("answer.question", "question")
        .leftJoinAndSelect("submission.user", "user") // Eager load the user relationship
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select("MAX(latestAnswer.version)", "maxVersion")
            .from(IncidentAnswer, "latestAnswer")
            .where("latestAnswer.questionId = answer.questionId")
            .getQuery();

          return `answer.version = (${subQuery})`;
        })
        .orderBy("question.order", "ASC")
        .getMany();

      const submissionsWithUsers = await Promise.all(
        submissions.map(async (submission) => {
          let user = null;
          if (submission.user) {
            user = await userRepository.findOne({
              where: { id: submission.user.id },
            });
          }
          return { ...submission, user };
        })
      );
      return submissionsWithUsers;
    } catch (error: any) {
      console.error("Error in IncidentService (getAllSubmissions):", error);
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }

  // Update an incident
  // async updateIncident(
  //   userId: number,
  //   incidentSubmissionId: number,
  //   newAnswers: { questionId: number; answer: string | string[] | Date }[] // The answers array
  // ) {
  //   const dataSource = await connectDB();
  //   const answerRepository = dataSource.getRepository(IncidentAnswer);
  //   const questionRepository = dataSource.getRepository(IncidentQuestion);
  //   const incidentSubmissionRepository =
  //     dataSource.getRepository(IncidentSubmission);

  //   try {
  //     // Fetch the incident submission
  //     const submission = await incidentSubmissionRepository.findOne({
  //       where: { id: incidentSubmissionId, user: { id: userId } },
  //     });

  //     if (!submission) {
  //       throw new Error("Incident submission not found");
  //     }
  //     const submissionId = submission.id;
  //     // Process each answer in the array
  //     for (const { questionId, answer: newAnswer } of newAnswers) {
  //       // Fetch the existing answer for the question
  //       const existingAnswer = await answerRepository.findOne({
  //         where: {
  //           incidentSubmission: Equal(submissionId),
  //           question: { id: questionId },
  //         },
  //         order: { version: "DESC" }, // Get the latest version of the answer
  //       });

  //       if (!existingAnswer) {
  //         throw new Error(
  //           `Answer not found for the specified question ID: ${questionId}`
  //         );
  //       }

  //       // Increment the version for the new answer
  //       const newVersion = existingAnswer.version + 1;

  //       const question = await questionRepository.findOne({
  //         where: { id: questionId },
  //       });

  //       if (!question) {
  //         throw new Error(`Question with ID ${questionId} not found.`);
  //       }

  //       // Create a new answer entity with the new version
  //       const newAnswerEntity = answerRepository.create({
  //         incidentSubmission: submission,
  //         question,
  //         type: question.questionType,
  //         // answer: newAnswer,
  //         version: newVersion,
  //       });
  //       // Save the answer in the correct field based on the question type
  //       switch (question.questionType) {
  //         case "single_choice":
  //           newAnswerEntity.singleChoiceAnswer = newAnswer as string;
  //           break;
  //         case "multiple_choice":
  //           newAnswerEntity.multipleChoiceAnswer = Array.isArray(newAnswer)
  //             ? newAnswer
  //             : [newAnswer as string];
  //           break;
  //         case "date":
  //           newAnswerEntity.dateAnswer = new Date(newAnswer as string);
  //           break;
  //         case "plain_text":
  //           newAnswerEntity.textAnswer = newAnswer as string;
  //           break;
  //         case "map":
  //           if (typeof newAnswer === "string") {
  //             try {
  //               newAnswerEntity.mapAnswer = JSON.parse(newAnswer);
  //             } catch (error) {
  //               throw new Error(
  //                 `Invalid map data format for question ${questionId}`
  //               );
  //             }
  //           } else if (
  //             typeof newAnswer === "object" &&
  //             "name" in newAnswer &&
  //             "latitude" in newAnswer &&
  //             "longitude" in newAnswer
  //           ) {
  //             newAnswerEntity.mapAnswer = newAnswer as {
  //               name: string;
  //               latitude: number;
  //               longitude: number;
  //             };
  //           } else {
  //             throw new Error(
  //               `Invalid map data format for question ${questionId}`
  //             );
  //           }
  //           break;
  //         default:
  //           throw new Error(`Invalid question type: ${question.questionType}`);
  //       }
  //       // Save the new answer
  //       await answerRepository.save(newAnswerEntity);
  //     }

  //     // Increment the version of the incident submission
  //     submission.version = submission.version + 1; // Increment submission version

  //     // Save the updated incident submission
  //     await incidentSubmissionRepository.save(submission);

  //     return { message: "Answers updated successfully" };
  //   } catch (error) {
  //     console.error(
  //       "Error in IncidentSubmissionService (updateIncident):",
  //       error
  //     );
  //     throw error;
  //   } finally {
  //     await dataSource.destroy();
  //   }
  // }

  async updateIncident(
    userId: number | any,
    incidentSubmissionId: number,
    newAnswers: { questionId: number; answer: string | string[] | Date }[]
  ) {
    const dataSource = await connectDB();
    const answerRepository = dataSource.getRepository(IncidentAnswer);
    const questionRepository = dataSource.getRepository(IncidentQuestion);
    const incidentSubmissionRepository =
      dataSource.getRepository(IncidentSubmission);

    try {
      const submission = await incidentSubmissionRepository.findOne({
        where: { id: incidentSubmissionId, user: { id: userId } },
      });

      if (!submission) {
        throw new Error("Incident submission not found");
      }

      for (const { questionId, answer: newAnswer } of newAnswers) {
        const existingAnswer = await answerRepository.findOne({
          where: {
            incidentSubmission: Equal(submission.id), // Use submission.id
            question: { id: questionId },
          },
          order: { version: "DESC" },
        });

        let newVersion = 1; // Default to 1 if no existing answer
        if (existingAnswer) {
          newVersion = existingAnswer.version + 1;
        }

        const question = await questionRepository.findOne({
          where: { id: questionId },
        });

        if (!question) {
          throw new Error(`Question with ID ${questionId} not found.`);
        }

        const newAnswerEntity = answerRepository.create({
          incidentSubmission: submission,
          question,
          type: question.questionType,
          version: newVersion,
        });

        switch (question.questionType) {
          case "single_choice":
            newAnswerEntity.singleChoiceAnswer = newAnswer as string;
            break;
          case "multiple_choice":
            newAnswerEntity.multipleChoiceAnswer = Array.isArray(newAnswer)
              ? newAnswer
              : [newAnswer as string];
            break;
          case "date":
            newAnswerEntity.dateAnswer = new Date(newAnswer as string);
            break;
          case "plain_text":
            newAnswerEntity.textAnswer = newAnswer as string;
            break;
          case "map":
            if (typeof newAnswer === "string") {
              try {
                newAnswerEntity.mapAnswer = JSON.parse(newAnswer);
              } catch (error) {
                throw new Error(
                  `Invalid map data format for question ${questionId}`
                );
              }
            } else if (
              typeof newAnswer === "object" &&
              "name" in newAnswer &&
              "latitude" in newAnswer &&
              "longitude" in newAnswer
            ) {
              newAnswerEntity.mapAnswer = newAnswer as {
                name: string;
                latitude: number;
                longitude: number;
              };
            } else {
              throw new Error(
                `Invalid map data format for question ${questionId}`
              );
            }
            break;
          default:
            throw new Error(`Invalid question type: ${question.questionType}`);
        }

        await answerRepository.save(newAnswerEntity);
      }

      submission.version = submission.version + 1;
      await incidentSubmissionRepository.save(submission);

      return { message: "Answers updated successfully" };
    } catch (error) {
      console.error(
        "Error in IncidentSubmissionService (updateIncident):",
        error
      );
      throw error;
    } finally {
      await dataSource.destroy();
    }
  }
}
