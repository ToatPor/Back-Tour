import { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  photo?: string;
  role: string;
  password: string;
  passwordConfirm: string | undefined;
  passwordChangeAt?: Date;
  passwordResetToken?: string;
  passwordResetTokenExpired?: Date;
  correctPassword: (password: string, databasePass: string) => boolean;
  changePasswordAfter: (JWTTime: number) => boolean;
  createResetPasswordToken: () => string;
  active: boolean;
  otp?: string;
  otpGenerateExp?: Date;
}

export type TCleanPassword = Partial<IUser>;
export type TPopulate = Pick<IUser, "name" | "email" | "role">;
