import { IBooking } from "./IBooking";
import { addHours } from "date-fns";
import mongoose, { Query } from "mongoose";

const BookingSchema = new mongoose.Schema<IBooking>(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "users",
      required: [true, "Booking must belong to user"],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "tours",
      required: [true, "Booking must belong to tour"],
    },
    price: {
      type: Number,
      required: [true, "Booking must have a price"],
    },
    createAt: {
      type: Date,
      default: addHours(Date.now(), 7),
    },
    paid: {
      type: Boolean,
      default: true,
    },
  },
  {
    id: false,
  },
);

BookingSchema.pre<Query<IBooking, IBooking[]>>(/^find/, function (next) {
  this.populate({ path: "user" }).populate({ path: "tour", select: "name" });
  next();
});

export const Booking = mongoose.model<IBooking>("booking", BookingSchema);
