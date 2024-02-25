import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

export const catchAsyncFuncFactory = function (
  _target: object,
  _name: string,
  descriptor: PropertyDescriptor,
) {
  //method will remember controller function
  const method = descriptor.value;
  descriptor.value = (
    req: Request,
    res: Response,
    next: NextFunction,
    modal: mongoose.Model<any>,
  ) => {
    method(req, res, next, modal).catch(next);
  };
};

export const catchAsyncFuncFactoryWithGetOne = function (
  _target: object,
  _name: string,
  descriptor: PropertyDescriptor,
) {
  //method will remember controller function
  const method = descriptor.value;
  descriptor.value = (
    req: Request,
    res: Response,
    next: NextFunction,
    modal: mongoose.Model<any>,
    populate?: object,
  ) => {
    method(req, res, next, modal, populate).catch(next);
  };
};

export const catchAsyncFunc = function (
  _target: object,
  _name: string,
  descriptor: PropertyDescriptor,
) {
  //method will remember controller function
  const method = descriptor.value;

  descriptor.value = (req: Request, res: Response, next: NextFunction) => {
    method(req, res, next).catch(next);
  };
};
// export const cathcAsyncFuncs = (obj: unknown) =>
//   function (_target: object, _name: string, descriptor: PropertyDescriptor) {
//     const method = descriptor.value;
//     descriptor.value = (next: NextFunction, ...arg: any[]) => {
//       return method.apply(obj, [...arg, next]).catch(next);
//     };
//     return method;
//   };
