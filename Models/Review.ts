import { addHours } from "date-fns";
import mongoose, { Query } from "mongoose";
import { IReview, IReviewMethod } from "./IReview";
import { Tour } from "./Tours";

const ReviewSchema = new mongoose.Schema<IReview>(
  {
    review: {
      type: String,
      required: [true, "Review must contains letter can't empty"],
    },
    rating: {
      type: Number,
      min: [1, "Minimum rating  is 1"],
      max: [5, "Maximum rating is 5"],
    },
    createAt: {
      type: Date,
      default: addHours(Date.now(), 7),
    },

    //parent ref
    tourRating: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tours",
      required: [true, "Review must belong to tour"],
    },
    userRating: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "Review must belong to user"],
    },
  },
  {
    id: false,
    toJSON: {
      virtuals: true,
    },
    toObject: { virtuals: true },
  },
);

//each of user can review only one  can't write mutiple review  same tour
ReviewSchema.index({ tourRating: 1, userRating: 1 }, { unique: true });

ReviewSchema.pre<Query<IReview[], IReview>>(/^find/, function (next) {
  this.populate({
    path: "userRating",
    select: "name photo",
  });
  next();
});

//storing related dataset on main data set
//like reviewQuantity and reviewNumber can store inside Tour dataset
ReviewSchema.statics.calcAverageRating = async function (tourId) {
  //get static about review then save it on tour
  //statics method this keyword point to model
  const dataStat = await this.aggregate([
    {
      $match: { tourRating: tourId },
    },
    {
      $group: {
        _id: "$tourRating",
        nRating: { $count: {} },
        aRating: { $avg: "$rating" },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: dataStat[0]?.aRating,
    ratingsQuantity: dataStat[0]?.nRating,
  });
};

//in port save will call next auto
//document should in collection before do statics method and store in tour
ReviewSchema.post("save", function () {
  //this Model constructor that create the current document.
  //this.constructor will point to current model
  const model = this.constructor as IReviewMethod;
  model.calcAverageRating(this.tourRating);
  // this.constructor.calcAverageRating(this.tourRating);
});

//in post  middleware, access to document as first argument
//findOneAnd same as findByIdAndUpdate is equivalent
ReviewSchema.post(/^findOneAnd/, async function (doc) {
  if (!doc) return;
  doc.constructor.calcAverageRating(doc.tourRating);
});

export const reviews = mongoose.model<IReview, IReviewMethod>(
  "reviews",
  ReviewSchema,
);
