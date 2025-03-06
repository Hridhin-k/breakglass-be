import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { IncidentSubmission } from "./IncidentSubmission";
import { IncidentQuestion } from "./IncidentQuestion";

@Entity()
export class IncidentAnswer {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => IncidentSubmission, (submission) => submission.answers, {
    onDelete: "CASCADE",
  })
  incidentSubmission!: IncidentSubmission;

  @ManyToOne(() => IncidentQuestion, (question) => question.answers, {
    onDelete: "CASCADE",
  })
  question!: IncidentQuestion;

  @Column({
    type: "enum",
    enum: [
      "single_choice",
      "multiple_choice",
      "date",
      "plain_text",
      "map",
      "file",
    ],
    nullable: true,
  })
  type!:
    | "single_choice"
    | "multiple_choice"
    | "date"
    | "plain_text"
    | "map"
    | "file";

  @Column({ type: "text", nullable: true })
  textAnswer?: string; // For plain text responses

  @Column({ type: "varchar", nullable: true })
  singleChoiceAnswer?: string; // For single-choice responses

  @Column({ type: "json", nullable: true })
  multipleChoiceAnswer?: string[]; // For multiple-choice responses

  @Column({ type: "date", nullable: true })
  dateAnswer?: Date; // For date responses

  @Column({ type: "json", nullable: true })
  mapAnswer?: {
    name: string;
    latitude: number;
    longitude: number;
  };

  @Column({ type: "int", default: 1 })
  version!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
