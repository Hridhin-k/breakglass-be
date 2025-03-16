import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { IncidentSubmission } from "./IncidentSubmission";

@Entity({ name: "users" })
export class Users {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  username!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "text", nullable: true })
  profileImage!: string;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected", "registered", "blocked"],
    default: "pending",
  })
  status!: "pending" | "approved" | "rejected" | "registered" | "blocked";

  @Column({ nullable: true, type: "varchar", length: 255 })
  otp!: string;

  @Column({ type: "bigint", nullable: true })
  otpExpiresAt!: number;

  @Column({ nullable: true, type: "varchar", length: 255 })
  password?: string;

  @Column({ type: "timestamp", nullable: true })
  lastLogin?: Date; // Stores last login timestamp

  @Column({ nullable: true, type: "varchar", length: 500 })
  refreshToken!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  firstName!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  lastName!: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  mobileNumber!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  address!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  city!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  state!: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  zipCode!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  institution!: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  classYear!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  majoringIn!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  studentOrganization!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  category!: string | null;

  @OneToMany(() => IncidentSubmission, (submission) => submission.user)
  submissions!: IncidentSubmission[];

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;
}
