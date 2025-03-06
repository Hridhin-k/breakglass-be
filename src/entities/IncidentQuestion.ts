import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  In,
} from "typeorm";
import { IncidentQuestionOption } from "./IncidentQuestionOption";
import { IncidentAnswer } from "./IncidentAnswer";
import { IncidentMedia } from "./IncidentMedia";

@Entity()
export class IncidentQuestion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "varchar", length: 255, unique: false })
  question!: string;

  @Column({ type: "varchar", length: 255 })
  description!: string;

  @Column({
    type: "enum",
    enum: [
      "single_choice",
      "multiple_choice",
      "plain_text",
      "date",
      "map",
      "file",
    ],
    nullable: true,
  })
  questionType!:
    | "single_choice"
    | "multiple_choice"
    | "plain_text"
    | "date"
    | "map"
    | "file";

  @Column({ type: "varchar", length: 255, nullable: true })
  summaryPrefix!: string;

  @Column({ type: "boolean", default: false })
  required!: boolean;

  @Column({ type: "int", nullable: true })
  order!: number;

  @OneToMany(() => IncidentQuestionOption, (option) => option.question, {
    cascade: true,
  })
  options!: IncidentQuestionOption[];

  @OneToMany(() => IncidentAnswer, (answer) => answer.question)
  answers!: IncidentAnswer[];

  @OneToMany(() => IncidentMedia, (media) => media.question)
  media!: IncidentMedia[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;
}
