import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "email_requests" })
export class EmailRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "registered"],
    default: "pending",
  })
  status!: "pending" | "approved" | "registered";

  @Column({ nullable: true })
  otp!: string;

  @Column({ type: "bigint", nullable: true })
  otpExpiresAt!: number;

  @Column({ nullable: true })
  password?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
