import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { IncidentQuestion } from "./IncidentQuestion";

@Entity()
export class IncidentQuestionOption {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  optionText!: string;

  // @Column({ type: "boolean", default: false })
  // isCorrect!: boolean;

  @ManyToOne(() => IncidentQuestion, (question) => question.options, {
    onDelete: "CASCADE",
  })
  question!: IncidentQuestion;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;
}
