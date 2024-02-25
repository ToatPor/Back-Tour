import { checkParamId } from "./../Validator/Tour.validator";
import { authControllers } from "./../Controller/Auth.controller";
import { reviewValidator } from "./../Validator/Review.validator";
import { Router } from "express";
import ReviewController from "../Controller/Review.controller";
import { UserRole } from "../Models/EnumUser";

const reviewRouter = Router({ mergeParams: true });
//read mergeParams get access to param from router before this case will get from tour router before
//do nested route
// {{URL}}/api/v1/tours/65a1ffa291ae775e9eac2f00/review
// {{URL}}/api/v1/review
// all this route will end up with this controller
reviewRouter.use(authControllers.protectRoute);
reviewRouter
  .route("/")
  .post(
    authControllers.restrictTo(UserRole.user),
    reviewValidator,
    ReviewController.createReview.bind(ReviewController),
  )
  .patch(
    authControllers.restrictTo(UserRole.user),
    reviewValidator,
    ReviewController.updateReviewByUser,
  )
  .delete(
    authControllers.restrictTo(UserRole.user),
    checkParamId,
    ReviewController.deleteReviewByUser,
  )
  .get(ReviewController.getAllReview.bind(ReviewController));

//read for admin only
reviewRouter.use(authControllers.restrictTo(UserRole.admin));
reviewRouter
  .route("/:id")
  .delete(checkParamId, ReviewController.deleteReview.bind(ReviewController))
  .patch(checkParamId, reviewValidator, ReviewController.updateReview.bind(ReviewController))
  .get(checkParamId, ReviewController.getOneReview.bind(ReviewController));

export default reviewRouter;
