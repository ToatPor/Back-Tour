import { Request } from "express";
import { Error } from "mongoose";

export type IUserAuth = {
  _id: string;
  name: string;
  role: string;
  email: string;
};

//get type of token
export interface decodeType {
  id: string;
  iat: number;
  exp: number;
}

export interface IAuthUser extends Request {
  user?: IUserAuth;
}

export interface IVerifyUser extends Request {
  userVerify?: IUserAuth;
}

export type FileNameCallBack = (error: Error | any, image: boolean) => void;
