import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { IncidentAnswer } from "./IncidentAnswer";
import { IncidentMedia } from "./IncidentMedia";
import { Users } from "./Users";

@Entity()
export class IncidentSubmission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "bigint" })
  incidentNumber!: number;

  @ManyToOne(() => Users, (user) => user.submissions, { onDelete: "CASCADE" })
  user!: Users;

  @Column({ type: "int", default: 1 })
  version!: number;

  @CreateDateColumn()
  submittedAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => IncidentAnswer, (answer) => answer.incidentSubmission, {
    cascade: true,
  })
  answers!: IncidentAnswer[];

  @OneToMany(() => IncidentMedia, (media) => media.incidentSubmission)
  media!: IncidentMedia[];
}
