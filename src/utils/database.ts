import "reflect-metadata";
import { DataSource } from "typeorm";
import { IncidentAnswer } from "../entities/IncidentAnswer";
import { IncidentMedia } from "../entities/IncidentMedia";
import { IncidentQuestion } from "../entities/IncidentQuestion";
import { IncidentQuestionOption } from "../entities/IncidentQuestionOption";
import { IncidentSubmission } from "../entities/IncidentSubmission";
import { Users } from "../entities/Users";

// Create a new DataSource instance to configure the connection
export const connectDB = async (): Promise<DataSource> => {
  try {
    const dataSource = new DataSource({
      type: "postgres",
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [
        Users,
        IncidentQuestion,
        IncidentQuestionOption,
        IncidentAnswer,
        IncidentSubmission,
        IncidentMedia,
      ],
      synchronize: true, // Auto sync with DB
    });

    // Initialize the data source (connection)
    await dataSource.initialize();

    return dataSource;
  } catch (error) {
    console.error("Error connecting to the database", error);
    throw error;
  }
};
