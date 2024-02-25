import { Document, Types } from "mongoose";

export interface IBooking extends Document {
  user: Types.ObjectId;
  tour: Types.ObjectId;
  price: number;
  createAt: Date;
  paid: boolean;
}
