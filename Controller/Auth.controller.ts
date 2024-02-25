import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { generateToken, jwtVerify } from "../Utilities/tokenFunc";
import { checkParamBodyError } from "../Utilities/checkError";
import { User } from "../Models/User";
import appError from "../Utilities/appError";
import { catchAsyncFunc } from "../Utilities/decoratorFunc";
import { Request, Response, NextFunction } from "express";
import {
  IAuthUser,
  decodeType,
} from "./InterfaceTourController/IAuthController";
import { UserRole } from "../Models/EnumUser";
import { checkRole } from "../Utilities/checkingRole";
import { Email } from "../Utilities/email";
import { totp } from "otplib";
// import { ObjectId } from "mongodb";
import { add, addDays, addMinutes } from "date-fns";
import { ObjectId } from "mongodb";

class authController {
  @catchAsyncFunc
  async signup(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    //read client can only be user on role
    const requiredBody = checkParamBodyError(req);
    if (requiredBody) return next(requiredBody);
    // authenticator.options = { digits: 4 };
    const token = totp.generate(process.env.JWT_SECRET as string);

    // read protect user specify role by them self
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      active: false,
      otp: token,
    });

    const signupToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    //need to provide url that front end to verify
    try {
      await new Email(
        user,
        `${req.protocol}://${req.get("host")}/api/v1/user/verifyOtp/${
          user._id
        }`,
        token,
      ).sendOtp();

      //sending id to verify

      res.cookie("jwt", signupToken, {
        expires: new Date(
          addDays(Date.now(), Number(process.env.JWT_EXPIRES_COOKIE_IN)),
        ),
        secure: true,
        httpOnly: false,
        sameSite: "none",
      });

      res.status(200).json({
        signupToken,
        status: "Success",
        message: "Please verify otp your email-address",
      });
    } catch (er) {
      //in case any error during sending email, need to delete otp and otpGenerateAt field
      user.otp = undefined;
      user.otpGenerateExp = undefined;
      return next(
        new appError(
          "There was Error during sending email please try gain",
          500,
        ),
      );
    }
  }

  @catchAsyncFunc
  async login(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    const { email, password } = req.body;
    if (!email || !password)
      return next(new appError("please provide email and password", 400));

    //set password select to false, if want to select again using select with +
    const userExist = await User.findOne({ email }).select("+password");

    //if there no user or correct password return error
    if (
      !userExist ||
      !(await userExist?.correctPassword(password, userExist?.password))
    ) {
      return next(new appError("Incorrect email or password", 401));
    }

    //token generate so we can use in protect route

    return generateToken(userExist._id, res, userExist);
  }

  @catchAsyncFunc
  async protectRoute(req: IAuthUser, res: Response, next: NextFunction) {
    const { authorization } = req.headers;
    let token: string | undefined;

    if (authorization && authorization?.startsWith("Bearer")) {
      token = authorization?.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token)
      return next(new appError("You are not login, Please login first", 401));

    //read any case any one change play load token or token was expired
    //     using custom promisify take care of jwt in case any error

    const decoded = (await jwtVerify(
      token,
      process.env.JWT_SECRET as string,
    )) as decodeType;

    //any case that user doest not exist not let go to other route
    //user base on decode id

    const getUserLogin = await User.findById(decoded?.id).select("-__v");

    //in case token was issue but user was delete after token issue
    if (!getUserLogin)
      return next(
        new appError(
          "The user belonging to this token does no longer exist",
          401,
        ),
      );

    //read client change password after token was issue
    //incase user use resetPassword router so we need to check token time with passwordChangedAt make sure user login again

    if (getUserLogin.changePasswordAfter(decoded?.iat as number)) {
      return next(
        new appError("User recently change password, Please login again", 401),
      );
    }

    //store user in request for using another route
    req.user = getUserLogin;
    next();
  }

  // wrapper function to middleware, express will call for us automatically
  //read authentication protect route that cant do in action
  restrictTo(...role: UserRole[]) {
    return (req: IAuthUser, res: Response, next: NextFunction) => {
      //check role what user role was convert string to enum by default was user

      if (
        req.user &&
        req.user.role &&
        !role.includes(checkRole(req.user.role))
      ) {
        return next(
          new appError(
            "You are not have permission to perform this action",
            403,
          ),
        );
      }
      next();
    };
  }

  //read
  //After change password this route, stale token time will more than passwordChangedAt
  @catchAsyncFunc
  async forgetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    //in case user does not provide email for us
    const emailBody = checkParamBodyError(req);
    if (emailBody) return next(emailBody);

    //check user with email address was exist or not
    const userForgotPassword = await User.findOne({ email: req.body.email });
    if (!userForgotPassword)
      return next(new appError("There is no user with email address", 404));

    //this token will use only change password not involve with stale token that we login
    //generate separate token for assume new token will expire in what time and what password of this token
    const getToken = userForgotPassword.createResetPasswordToken();
    //validateBeforeSave mean all document field that we required will not validate again
    //deactivate all validate in schema
    await userForgotPassword.save({ validateBeforeSave: false });

    try {
      //generate token for checking sending to email
      //sending email
      const resetURL = `${req.protocol}://${req.get(
        "host",
      )}/api/v1/user/resetPassword/${getToken}`;

      await new Email(
        userForgotPassword,
        resetURL,
        undefined,
      ).sendResetPassword();

      res.status(200).json({
        status: "Success",
        message: "Your token was send to your email",
      });
    } catch (er) {
      userForgotPassword.passwordResetToken = undefined;
      userForgotPassword.passwordResetTokenExpired = undefined;

      await userForgotPassword.save({ validateBeforeSave: false });
      return next(
        new appError("There was an error sending email. try it again", 500),
      );
    }
  }

  @catchAsyncFunc
  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    //getting token from email

    const resetPasswordBody = checkParamBodyError(req);
    if (resetPasswordBody) return next(resetPasswordBody);

    //get token from url sending from email to make sure token is correct
    //encrypt password to check same as password
    const tokenFromEmail = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: tokenFromEmail,
      //10 mins token was send
      //if right now 10am  after 10.10am token will expired
      passwordResetTokenExpired: { $gt: Date.now() },
    });

    //more than 10 minutes in past will throw error
    if (!user)
      return next(new appError("Token is invalid or has expired", 400));

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpired = undefined;
    await user.save();

    return generateToken(user._id, res, user);
  }

  @catchAsyncFunc
  async updatePassword(req: IAuthUser, res: Response, next: NextFunction) {
    const updatePasswordBody = checkParamBodyError(req);
    if (updatePasswordBody) return next(updatePasswordBody);
    // user need to login before changing password
    if (!req.user)
      return next(new appError("Please login before change password", 401));

    const userUpdatePassword = await User.findById(req.user?._id).select(
      "+password",
    );

    //check current password, user provide for us is correct or not
    if (
      !(await userUpdatePassword?.correctPassword(
        req.body.passwordCurrent,
        userUpdatePassword.password,
      ))
    ) {
      return next(new appError("Your current password was wrong", 401));
    }

    if (userUpdatePassword) {
      userUpdatePassword.password = req.body.password;
      userUpdatePassword.passwordConfirm = req.body.passwordConfirm;
      await userUpdatePassword.save();
      return generateToken(userUpdatePassword._id, res, userUpdatePassword);
    }
  }

  @catchAsyncFunc
  async verifyUserLogin(req: Request, res: Response, next: NextFunction) {
    let token: string | undefined;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) return next(new appError("Please signup first", 400));
    const userId = (await jwtVerify(
      token,
      process.env.JWT_SECRET as string,
    )) as decodeType;

    const user = await User.findOne({
      _id: new ObjectId(userId.id),
      otpGenerateExp: { $gt: Date.now() },
      active: { $ne: true },
    });

    if (!user)
      return next(
        new appError("Your token was expired please resent token again", 400),
      );
    if (!(await user?.correctPassword(req.body.otp, user?.otp as string)))
      return next(
        new appError(
          "Invalid otp password please provide correct password",
          403,
        ),
      );
    user.active = true;
    user.otp = undefined;
    user.otpGenerateExp = undefined;
    await user.save();
    const url = `http://localhost:5173/overview`;
    await new Email(user, url, undefined).sendWelcome();
    return generateToken(user._id, res, user);
  }

  @catchAsyncFunc
  async resendVerify(req: Request, res: Response, next: NextFunction) {
    const getUserForResendOTP = await User.findOne({
      email: req.body.email,
      otpGenerateExp: { $gt: Date.now() },
    });
    if (!getUserForResendOTP)
      return next(new appError("You are already verify please login", 400));
    const token = totp.generate(process.env.JWT_SECRET as string);
    getUserForResendOTP.otp = await bcrypt.hash(token, 12);
    getUserForResendOTP.otpGenerateExp = add(Date.now(), {
      hours: 7,
      minutes: 50,
    });
    getUserForResendOTP.save({ validateBeforeSave: false });
    try {
      await new Email(
        getUserForResendOTP,
        `${req.protocol}://${req.get("host")}/api/v1/user/verifyOtp/${
          getUserForResendOTP._id
        }`,
        token,
      ).sendOtp();
      res.status(200).json({
        status: "Success",
        message: "Please verify otp your email-address",
      });
    } catch (er) {
      //in case any error during sending email, need to delete otp and otpGenerateAt field
      getUserForResendOTP.otp = undefined;
      getUserForResendOTP.otpGenerateExp = undefined;
      return next(
        new appError(
          "There was Error during sending email please try gain",
          500,
        ),
      );
    }
  }

  // use for view
  @catchAsyncFunc
  async isLogin(req: IAuthUser, res: Response, next: NextFunction) {
    if (!req.cookies.jwt) return next();
    const decoded = (await jwtVerify(
      req.cookies.jwt,
      process.env.JWT_SECRET as string,
    )) as decodeType;
    //any case that user doest not exist not let go to other route
    //user base on decode id
    const getUserLogin = await User.findById(decoded?.id).select("-__v");
    //in case token was issue but user was delete after token issue
    if (!getUserLogin) return next();
    if (getUserLogin.changePasswordAfter(decoded?.iat as number)) return next();
    res.status(200).json({
      status: "success",
      data: {
        [getUserLogin.collection.collectionName]: getUserLogin,
      },
    });
  }

  async isLogout(req: Request, res: Response) {
    res.cookie("jwt", "null", {
      expires: new Date(addMinutes(Date.now(), 1)),
      httpOnly: false,
      secure: true,
    });
    res.status(200).json({ status: "success" });
  }
}

export const authControllers = new authController();
