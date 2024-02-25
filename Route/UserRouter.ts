// import { checkParamId } from "./../Validator/Tour.validator";
import {
  emailValidate,
  resetPasswordValidate,
  updatePassword,
} from "./../Validator/Auth.validator";
import express, { Router } from "express";
import UserController from "../Controller/User.controller";
import { UserValidator, updateMeValidator } from "../Validator/User.validator";
import { authControllers } from "../Controller/Auth.controller";
import { checkParamId } from "../Validator/Tour.validator";
import { UserRole } from "../Models/EnumUser";
import BookingController from "../Controller/Booking.controller";

const UserRouter: Router = express.Router();
//give user route
UserRouter.route("/signup").post(UserValidator, authControllers.signup);
UserRouter.route("/login").post(authControllers.login);

//incase user forget his current password for login
//hit this route first before getting resetpassword route to email
UserRouter.route("/forgotPassword").post(
  emailValidate,
  authControllers.forgetPassword,
);

// for reset password incase we not know current password
UserRouter.route("/resetPassword/:token").patch(
  resetPasswordValidate,
  authControllers.resetPassword,
);

// update active user
// user can only change status on this route
UserRouter.route("/verifyOtp").patch(authControllers.verifyUserLogin);
UserRouter.route("/resendVerifyOtp").patch(authControllers.resendVerify);

UserRouter.route("/isLogin").get(authControllers.isLogin);
UserRouter.route("/isLogout").post(authControllers.isLogout);
//read all coming from with route need to login
// middle ware come before below route
UserRouter.use(authControllers.protectRoute);
UserRouter.route("/updateMe").patch(
  //multer will copy file and put to destination of file and call next middleware
  UserController.uploadUserPhoto,
  UserController.resizeImage,
  updateMeValidator,
  UserController.updateMe,
);
// update information
// update password
UserRouter.route("/updatePassword").patch(
  updatePassword,
  authControllers.updatePassword,
);

UserRouter.route("/deleteMe").delete(UserController.deleteMe);
UserRouter.route("/me").get(UserController.getMe.bind(UserController));
UserRouter.route("/myCart").get(BookingController.getMyCart);

//for admin route
//all below will restrict to admin
UserRouter.use(authControllers.restrictTo(UserRole.admin));

UserRouter.route("/")
  .get(UserController.getAllUser.bind(UserController))
  .post(UserController.createUser);
//admin who the one who can delete user document

UserRouter.route("/:id")
  .delete(checkParamId, UserController.deleteUser.bind(UserController))
  // .patch(checkParamId, UserController.updateUser.bind(UserController))
  .patch(checkParamId, UserController.updateUser.bind(UserController))
  .get(checkParamId, UserController.getOneUser.bind(UserController));
export default UserRouter;
