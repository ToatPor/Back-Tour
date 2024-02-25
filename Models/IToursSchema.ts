import { Document, PopulatedDoc, Types } from "mongoose";
import { Point } from "geojson";
import { TPopulate } from "./IUser";

export interface tourCheck extends Document {
  name: string;
  duration: number;
  maxGroupSize: number;
  difficulty: string;
  ratingsAverage?: number;
  ratingsQuantity?: number;
  price: number;
  priceDiscount?: number;
  summary: string;
  description?: string;
  imageCover: string;
  images?: string[];
  createDate?: Date;
  startDates?: Date[];
  secretTour?: boolean;
  startLocation: geoJson;
  locations: geoJson[];

  //populate function need to specify populate type of
  guides: PopulatedDoc<TPopulate>[];
}

interface geoJson {
  type: Point;
  coordinate: [lat: number, lng: number];
  [key: string]: unknown;
}

export interface ILocation {
  type: "Point";
  coordinates: [number, number];
  description: string;
  day: number;
  _id: Types.ObjectId;
  id?: Types.ObjectId;
}
