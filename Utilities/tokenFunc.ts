import { addDays } from "date-fns";
import { Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { TCleanPassword } from "../Models/IUser";

export const generateToken = function (
  dataId: mongoose.Types.ObjectId,
  res: Response,
  user: TCleanPassword,
) {
  // const tokenExpire = process.env.JWT_EXPIRES_IN;
  const token = jwt.sign({ id: dataId }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  //clear output response to client
  user.password = undefined;

  //httpOnly need to fix to true
  res.cookie("jwt", token, {
    expires: new Date(
      addDays(Date.now(), Number(process.env.JWT_EXPIRES_COOKIE_IN)),
    ),
    secure: true,
    httpOnly: false,
    sameSite: "none",
  });

  res.status(200).json({
    status: "success",
    token,
    data: { user },
  });
};

// read get this key word in class
// type not safety
export function jwtVerify(token: string, secret: string) {
  return new Promise((resolve, reject) => {
    //read promisify convert jwt.verify call back to promise
    //any thing return from call back function will resolve generate promise
    jwt.verify(token, secret, (error, decoded) => {
      if (error) return reject(error);
      resolve(decoded);
    });
  });
}
