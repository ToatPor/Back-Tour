import { checkGeoDistance } from "./../Validator/Tour.validator";
import express, { Router } from "express";
import TourController from "../Controller/Tour.controller";
import {
  checkParamId,
  TourValidator,
  TourMonthlyPlanValidate,
  checkGeoParam,
} from "../Validator/Tour.validator";
import { authControllers } from "../Controller/Auth.controller";
import { UserRole } from "../Models/EnumUser";
import reviewRouter from "./ReviewRoute";

const TourRouter: Router = express.Router();

// nested route with tour and review to show how relationship between
// TourRouter.route("/:id/reviews").post(
//   authControllers.protectRoute,
//   authControllers.restrictTo(UserRole.user),
//   ReviewController.createReview,
//  same as this line any case visit this route will re-direct to  Review route
// we will get into tour id and pass it to reviews
// TourRouter.route("/importData").post(TourController.importData);
TourRouter.use("/:id/reviews", reviewRouter);
TourRouter.route("/tour-stat").get(TourController.getTourStats);
TourRouter.route("/getMonthlyPlan/:year").get(
  authControllers.protectRoute,
  authControllers.restrictTo(
    UserRole.leadGuide,
    UserRole.admin,
    UserRole.guide,
  ),
  TourMonthlyPlanValidate,
  TourController.getMonthlyPlan,
);

TourRouter.route("/tours-within/:distance/center/:latlng/unit/:unit").get(
  checkGeoParam,
  TourController.getToursWithIn,
);
TourRouter.route("/distance/:latlng/unit/:unit").get(
  checkGeoDistance,
  TourController.getDistance,
);

TourRouter.route("/")
  .get(TourController.getAllTours.bind(TourController))
  .post(
    authControllers.protectRoute,
    authControllers.restrictTo(UserRole.admin, UserRole.leadGuide),
    TourValidator,
    TourController.createTour.bind(TourController),
  );

TourRouter.route("/:id")
  .delete(
    authControllers.protectRoute,
    authControllers.restrictTo(UserRole.leadGuide, UserRole.admin),
    checkParamId,
    TourController.deleteTour.bind(TourController),
  )
  .patch(
    authControllers.protectRoute,
    authControllers.restrictTo(UserRole.leadGuide, UserRole.admin),
    TourController.uploadTourImage,
    TourController.resizeImages,
    checkParamId,
    TourController.updateTour.bind(TourController),
  )
  .get(checkParamId, TourController.getToursById.bind(TourController));

export default TourRouter;
