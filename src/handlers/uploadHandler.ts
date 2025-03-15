import AWS from "aws-sdk";
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { IncidentMedia } from "../entities/IncidentMedia"; // Assuming IncidentMedia.ts
import { IncidentSubmission } from "../entities/IncidentSubmission"; // Assuming IncidentSubmission.ts
import { connectDB } from "../utils/database";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const s3 = new AWS.S3();

interface FileData {
  fileName: string;
  file: string;
  contentType: string;
  description?: string;
}

export const uploadMediaHandler = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Request body is missing" }),
      };
    }

    const dataSource = await connectDB();
    const incidentRepository = dataSource.getRepository(IncidentSubmission);
    const mediaRepository = dataSource.getRepository(IncidentMedia);

    const body = JSON.parse(event.body);
    const files: FileData[] = body.files;
    const submissionId: number = body.submissionId;

    if (
      !files ||
      !Array.isArray(files) ||
      files.length === 0 ||
      !submissionId
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing files or submissionId" }),
      };
    }

    const incidentSubmission = await incidentRepository.findOne({
      where: { id: submissionId },
    });

    if (!incidentSubmission) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "IncidentSubmission not found" }),
      };
    }

    const uploadedMedia: IncidentMedia[] = [];

    for (const fileData of files) {
      const { fileName, file, contentType, description } = fileData;

      if (!fileName || !file || !contentType) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message:
              "Missing filename, file, or contentType for one or more files",
          }),
        };
      }

      const fileBuffer = Buffer.from(file, "base64");
      const bucketName = process.env.UPLOAD_BUCKET_NAME;

      if (!bucketName) {
        return {
          statusCode: 500,
          body: JSON.stringify({
            message: "S3_BUCKET_NAME is not set in environment variables",
          }),
        };
      }

      const params: AWS.S3.PutObjectRequest = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
      };

      const result = await s3.upload(params).promise();
      const s3Url = result.Location;

      const incidentMedia = mediaRepository.create({
        incidentSubmission: incidentSubmission,
        url: s3Url,
        mimeType: contentType,
        description: description,
      });

      const savedMedia = await mediaRepository.save(incidentMedia);
      uploadedMedia.push(savedMedia);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Files uploaded successfully",
        media: uploadedMedia,
      }),
    };
  } catch (error: unknown) {
    console.error("Error uploading media:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error uploading media",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
