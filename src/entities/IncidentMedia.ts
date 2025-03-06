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
export class IncidentMedia {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => IncidentSubmission, (submission) => submission.media, {
    onDelete: "CASCADE",
  })
  incidentSubmission!: IncidentSubmission;

  @ManyToOne(() => IncidentQuestion, (question) => question.media, {
    nullable: true,
    onDelete: "CASCADE",
  })
  question!: IncidentQuestion;

  @Column({ type: "text" })
  url!: string;

  @Column({ type: "text" }) // Store MIME type instead of a limited enum
  mimeType!: string;

  @Column({ type: "text", nullable: true })
  description?: string; // Optional description for the media

  @Column({ type: "int", default: 1 })
  version!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
