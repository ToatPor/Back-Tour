import { reviews } from "./../Models/Review";
import { NextFunction, Request, Response } from "express";
import { IAuthUser } from "./InterfaceTourController/IAuthController";
import { ControllerFactory } from "./Factory.Controller";
import { catchAsyncFunc } from "../Utilities/decoratorFunc";
import { checkParamBodyError } from "../Utilities/checkError";
import appError from "../Utilities/appError";

class ReviewController extends ControllerFactory {
  public getAllReview(req: Request, res: Response, next: NextFunction) {
    //can be use as admin and user incase that coming from tour/:id/review
    let tourById = {};
    if (req.params.id) tourById = { tourRating: req.params.id };
    //get specific tours with tour belong to this review
    //if there no any id form route will get empty object get all review of tour
    //in review route we want to find specific id that coming from nest route
    this.getAllFactory(req, res, next, reviews, tourById);
  }

  public deleteReview(req: Request, res: Response, next: NextFunction) {
    this.deleteFactory(req, res, next, reviews);
  }
  public updateReview(req: Request, res: Response, next: NextFunction) {
    this.updateFactory(req, res, next, reviews);
  }
  public getOneReview(req: Request, res: Response, next: NextFunction) {
    this.getOneFactory(req, res, next, reviews, undefined);
  }

  // read by user who belong to review
  @catchAsyncFunc
  public async deleteReviewByUser(req: IAuthUser, res: Response, next: NextFunction) {
    const requiredBody = checkParamBodyError(req);
    if (requiredBody) return next(requiredBody);

    //reviews that belong to user
    const userReview = await reviews.findOneAndDelete({
      userRating: { $eq: req.user?._id },
      tourRating: { $eq: req.params.id },
    });

    if (!userReview)
      return next(new appError("There is no your reviews please check it again", 403));

    res.status(204).json({
      status: "success",
      data: null,
    });
  }

  @catchAsyncFunc
  public async updateReviewByUser(req: IAuthUser, res: Response, next: NextFunction) {
    const requiredBody = checkParamBodyError(req);
    if (requiredBody) return next(requiredBody);

    const userReview = await reviews.findOneAndUpdate(
      {
        userRating: { $eq: req.user?._id },
        tourRating: { $eq: req.params.id },
      },
      req.body,
      { new: true, runValidators: true },
    );
    if (!userReview) return next(new appError("There is no document that user belong", 403));
    res.status(200).json({
      status: "success",
      data: { [userReview.collection.collectionName]: userReview },
    });
  }

  public createReview(req: IAuthUser, res: Response, next: NextFunction) {
    //read if there no id of tour provide from user, we gonna use nested route to take care of it
    //get id from tour Route
    //or can set in middleware to set body
    if (!req.body.tourRating) req.body.tourRating = req.params.id;
    if (!req.body.userRating) req.body.userRating = req.user?._id;
    this.createFactory(req, res, next, reviews);
  }
}

export default new ReviewController();
