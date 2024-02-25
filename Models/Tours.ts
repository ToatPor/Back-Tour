import mongoose, { Query, Types } from "mongoose";
import { add } from "date-fns";
import appError from "../Utilities/appError";
import { tourDifficulty } from "./EnumTour";
import { tourCheck } from "./IToursSchema";
// import { User } from "./User";
// import { IUserAuth } from "../Controller/InterfaceTourController/IAuthController";

interface Iid {
  id?: Types.ObjectId;
}
const tourSchema = new mongoose.Schema<tourCheck>(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "A Tour name must have less or equal 40 characters"],
      minlength: [10, "A Tour name must have more or equal 10 characters"],
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration   "],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour have a challenge"],
      enum: {
        values: [
          tourDifficulty.easy,
          tourDifficulty.medium,
          tourDifficulty.difficult,
        ],
        message: "Difficulty is either: easy, medium or difficult",
      },
    },
    //depend on review create update or delete
    //related dataset to reviews
    //put it on tour dataset we no need to query review to calculate again after we query
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      //setter function will run each time that new value is coming
      set: (val: number) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },

    priceDiscount: {
      type: Number,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have description"],
    },
    description: {
      type: String,
      trim: true,
    },

    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createDate: {
      type: Date,
      default: add(Date.now(), { hours: 7 }),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    //object
    //geospatial data in mongodb, describe place on earth using lat,lng
    startLocation: {
      //geo json
      //need to have type field and coordinates and you can add more field like address
      //this will create sub-field
      //nest object geojson
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    //embed document passing object inside array will create brand new document
    //inside parent document dataset that close relationship with parent dataset
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    //reference to other document child
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        //data base name
        ref: "users",
      },
    ],
  },
  {
    //read get rid of virtual id
    //using virtual it will expose id, for dummy data
    id: false,
    toJSON: {
      //delete id that coming from virtual
      transform: function (doc, ret) {
        ret.locations?.map((val: Iid) => delete val?.id);

        if (!ret.durationWeeks) delete ret.durationWeeks;
      },
      virtuals: true,
      //will effect to other virtual or pollute
      // transform: function (doc, ret) {
      //   ret.locations.map((val: ILocation) => delete val?.id);
      // },
    },
    toObject: { virtuals: true },
  },
);
//using index we not have to scan all document, engine will only scan less and
//giving more performance
//read which field is gonna query often, like price
//mongodb will not search entire collection but will search through ordered index like _id or field that we generate index
//create compound index no need to create individual index
tourSchema.index({ price: 1, ratingsAverage: -1 });

//able to do special geo special queries we need to provide index for that field
//that geo special searching for, if we use point and store data real location on earth surface [lat,lng ] use 2dsphere
tourSchema.index({ startLocation: "2dsphere" });

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

//read only appear when populate virtual populate connect two model that not persist in data base
//parent ref
//use only tour:id route for get all information about reviews
tourSchema.virtual("review", {
  ref: "reviews", //model
  foreignField: "tourRating", //with field want to populate
  localField: "_id",
});

//read embed dataset to tour for guide filed
// tourSchema.pre("save", async function (next) {
//   const embedUser = this.guides.map(async (val) => await User.findById(val));
//   this.guides = (await Promise.all(embedUser)) as IUserAuth[];
//   next();

// to get all promise value out
// });

//Document middleware
tourSchema.pre("save", function (next) {
  if ((this.priceDiscount as number) > this.price)
    next(new appError(`Price-discount need to lower than original price`, 403));
  next();
});
//Query middleware
tourSchema.pre<Query<tourCheck[], tourCheck>>(/^find/, function (next) {
  //this keyword will point to quey middle ware
  this.find({ secretTour: { $ne: true } });
  next();
});

//populate will effect to other populate call populate chain
//this will get 2 query in background
//get result of ref field by using populate
tourSchema.pre<Query<tourCheck[], tourCheck>>(/^find/, function (next) {
  this.populate({ path: "guides", select: "-__v -passwordChangeAt" });
  next();
});
export const Tour = mongoose.model<tourCheck>("tours", tourSchema);
