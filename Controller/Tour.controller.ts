import { Tour } from "./../Models/Tours";
import { NextFunction, Request, Response } from "express";
import { catchAsyncFunc } from "../Utilities/decoratorFunc";
import { checkParamBodyError } from "../Utilities/checkError";
import { ControllerFactory } from "./Factory.Controller";
import appError from "../Utilities/appError";
import multer from "multer";
import { FileNameCallBack } from "./InterfaceTourController/IAuthController";
import sharp from "sharp";

const multerStorage = multer.memoryStorage();

const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileNameCallBack,
) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(
      new appError("Not an image! Please provide upload only images", 400),
      false,
    );
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

//this will use files

class TourController extends ControllerFactory {
  public async getAllTours(req: Request, res: Response, next: NextFunction) {
    this.getAllFactory(req, res, next, Tour, {});
  }

  public async getToursById(req: Request, res: Response, next: NextFunction) {
    //populate which one of review we don't want
    this.getOneFactory(req, res, next, Tour, {
      path: "review",
      select: "review rating userRating -tourRating",
    });
  }

  // const tour = JSON.parse(readFileSync(`${__dirname}/data.json`, "utf-8"));
  // await Tour.create(tour);
  public async createTour(req: Request, res: Response, next: NextFunction) {
    this.createFactory(req, res, next, Tour);
  }

  public deleteTour(req: Request, res: Response, next: NextFunction) {
    this.deleteFactory(req, res, next, Tour);
  }

  public async updateTour(req: Request, res: Response, next: NextFunction) {
    this.updateFactory(req, res, next, Tour);
  }

  @catchAsyncFunc
  public async getTourStats(req: Request, res: Response) {
    const tourStats = await Tour.aggregate([
      {
        //match just like query the tour that have rating above or equal 4.5
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          //set _id to null will calculate all data
          //select to which field
          _id: { $toUpper: "$difficulty" },
          numTours: { $count: {} },
          numberRatings: { $sum: "$ratingsQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      { $sort: { numTours: 1 } },
    ]);

    return res.status(200).json({
      status: "Success",
      data: { tourStats },
    });
  }

  @catchAsyncFunc
  public async getMonthlyPlan(req: Request, res: Response, next: NextFunction) {
    const requiredBody = checkParamBodyError(req);
    if (requiredBody) return next(requiredBody);
    const year = Number(req.params.year) * 1;
    //unwind use for array fields will got one result for each document
    const monthlyPlan = await Tour.aggregate([
      {
        $unwind: "$startDates",
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$startDates" },
          tours: { $push: "$name" },
          numTours: { $count: {} },
        },
      },
      { $addFields: { month: "$_id" } },
      { $project: { _id: 0 } },
      { $sort: { month: 1 } },
      { $limit: 12 },
    ]);

    return res.status(200).json({
      status: "Success",
      data: { monthlyPlan },
    });
  }
  // /tours-within/:distance/center/:latlng/unit/:unit
  //finding with radius finding location that within 400 distance on earth
  @catchAsyncFunc
  public async getToursWithIn(req: Request, res: Response, next: NextFunction) {
    const error = checkParamBodyError(req);
    if (error) return next(error);

    //you want to search tours document that within a sphere that radius with ${distance miles}
    const { distance, latlng, unit = "mi" } = req.params;

    const [lat, lng] = latlng.split(",");

    //radius of the earth convert it to radians, get it need to divide radius of earth
    const radius =
      unit === "mi" ? Number(distance) / 3963.2 : Number(distance) / 6371;
    if (!lat || !lng)
      return next(
        new appError(
          "please provide latitude and longitude in format lat,lng",
          400,
        ),
      );

    //find tour document that inside of sphere that start
    //example like order food, your house is centerSphere, find restaurant that within radius
    //how distance you want to find need to convert to mile
    const tours = await Tour.find({
      //$near
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });
    res.status(200).json({
      status: "success",
      results: tours.length,
      data: {
        [Tour.collection.collectionName]: tours,
      },
    });
  }

  //get distance from position lat lng that you want to calculate how far with it
  //when you need to use $geoNear you need to specify index in model before use it
  //if you have a lot of index for geo special, use key
  @catchAsyncFunc
  public async getDistance(req: Request, res: Response, next: NextFunction) {
    const error = checkParamBodyError(req);
    if (error) return next(error);

    const { latlng, unit = "mi" } = req.params;
    const multiplier = unit === "mi" ? 0.000621371 : 0.001;

    const [lat, lng] = latlng.split(",");
    if (!lat || !lng)
      return next(
        new appError(
          "please provide latitude and longitude in format lat,lng",
          400,
        ),
      );
    const distance = await Tour.aggregate([
      {
        $geoNear: {
          //have only one index for special geo no need to specify key
          // key: "startLocation",
          near: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          distanceField: "distance",
          distanceMultiplier: multiplier, //same as divide 1000
        },
      },
      { $project: { distance: 1, name: 1 } },
    ]);
    res.status(200).json({
      status: "success",
      data: { [Tour.collection.collectionName]: distance },
    });
  }

  public uploadTourImage = upload.fields([
    { name: "imageCover", maxCount: 1 },
    { name: "images", maxCount: 3 },
  ]);

  @catchAsyncFunc
  public async resizeImages(req: Request, res: Response, next: NextFunction) {
    const files = req.files as any;

    if (!files) return next();

    if (files.imageCover) {
      //Cover images set to body before put to database
      //Change image cover id to this middleware before pass to update middle ware
      req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg `;

      //working with sharp is work with promise
      await sharp(files?.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/Tours/${req.body.imageCover}`);
    }

    if (files.images) {
      req.body.images = [];
      await Promise.all(
        files.images.map(async (file: any, i: number) => {
          const fileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
          await sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat("jpeg")
            .jpeg({ quality: 90 })
            .toFile(`public/img/Tours/${fileName}`);

          req.body.images.push(fileName);
        }),
      );
    }

    next();
  }
}

export default new TourController();

// public async importData() {
//   const deleteOrImport = true;
//   if (deleteOrImport) {
//     const Tours = JSON.parse(fs.readFileSync(`${__dirname}/tour.json`, "utf-8"));
//     const review = JSON.parse(fs.readFileSync(`${__dirname}/review.json`, "utf-8"));
//     const user = JSON.parse(fs.readFileSync(`${__dirname}/user.json`, "utf-8"));

//     await Tour.create(Tours);
//     await User.create(user, { validateBeforeSave: false });
//     await reviews.create(review);
//   }
// await Tour.deleteMany();
// await reviews.deleteMany();
// await User.deleteMany();

//accept multiple filed of file we use fields
//incase that one field accept multiple image we use upload.array
//max count of 5
// upload.array('images',5)
//incase many field use fields
//this only store in memory not change any thing
