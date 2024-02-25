import { PopulatedDoc, Document, Model } from "mongoose";
import { tourCheck } from "./IToursSchema";
import { TPopulate } from "./IUser";

export interface IReview extends Document {
  review: string;
  rating: number;
  createAt: Date;
  tourRating: PopulatedDoc<tourCheck>;
  userRating: PopulatedDoc<TPopulate>;
}

export interface IReviewMethod extends Model<IReview> {
  calcAverageRating(tourId: string): void;
}
