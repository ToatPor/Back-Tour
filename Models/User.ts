import { IUser } from "./IUser";
import mongoose from "mongoose";
import validator from "validator";
import { UserRole } from "./EnumUser";
import bcrypt from "bcrypt";
import appError from "../Utilities/appError";
import { add, getTime, subSeconds } from "date-fns";
import crypto from "crypto";
import { Query } from "mongoose";
// import { Tour } from "./Tours";

const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: [true, "Please tell us your name"] },
  email: {
    type: String,
    required: [true, "Please provide email"],
    unique: true,
    lowercase: true,
    //this only work on CREATE   and SAVE!!
    validate: [validator.isEmail, "Please provide valid email for us"],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },

  //by default mongoose not accept enum type
  //mongoose already validate for enum feal free use string
  role: {
    type: String,
    default: UserRole.user,
    enum: UserRole,
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [8, "Password need to contains more than 8 characters"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    // required: [true, "Please provide a password confirm"],
  },
  passwordChangeAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpired: Date,
  active: { type: Boolean, default: false, select: false },
  otp: String,
  otpGenerateExp: Date,
});
//read password don't match with confirm password
//run before save and create
//don't use findByIdAndUpdate, it not gonna run validate
//all pre save middleware not gonna run
userSchema.pre("validate", function (next) {
  if (this.password !== this.passwordConfirm)
    next(new appError("password and password confirm are not same"));
  next();
});
// { document: true, query: false } register query middle ware to document middle ware

//run before save it to document
userSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  this.otp = await bcrypt.hash(this.otp as string, 12);
  this.otpGenerateExp = add(Date.now(), { hours: 7, minutes: 30 });
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangeAt = subSeconds(Date.now(), 1);
  next();
});

userSchema.pre<Query<IUser[], IUser>>(/^find/, function (next) {
  this.find({
    $or: [
      {
        otp: { $exists: true },
        otpGenerateExp: { $exists: true },
        active: { $eq: false },
      },
      { active: { $ne: false } },
    ],
  });

  next();
});

//testing;
//read tour populate to user this will effect to query middleware inside user model
//also review if call Tour document to other query middleware will also get effect

//this.model will point to users
//this.getQuery() point to id document that update
// const currentUserUpdate = await this.findOne({ _id: { $eq: this.getQuery()._id } });

//every document can access to this method
//comparing password with hash password in database
userSchema.methods.correctPassword = async function (
  clientPass: string,
  dataBasePass: string,
) {
  return await bcrypt.compare(clientPass, dataBasePass);
};

//instance method for checking is there change password before
//incase user use resetPassword router so we need to check token time with passwordChangedAt make sure user login again
userSchema.methods.changePasswordAfter = function (JWTTime: number) {
  if (this.passwordChangeAt) {
    // if token was issue before passwordChangeAt mean, user was change password so token need to generate new

    //need to divide 1000 to get in second get time was return in miliseconds
    const passwordChange = getTime(new Date(this.passwordChangeAt)) / 1000;
    return JWTTime < passwordChange;
  }
  //mean user does not change password
  return false;
};

//can only use with document
userSchema.methods.createResetPasswordToken = function () {
  //generate hex token for sending for user
  const generateToken = crypto.randomBytes(32).toString("hex");

  //modify database data need to save() just modify document
  //In case sensitive data store in database, we need to store data in hash to secure data
  //store token to database
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(generateToken)
    .digest("hex");

  //password resetToken will expired in 10 min make sure change password before 10 minute, after token was issue
  this.passwordResetTokenExpired = add(Date.now(), { hours: 7, minutes: 10 });

  return generateToken;
};

export const User = mongoose.model<IUser>("users", userSchema);
