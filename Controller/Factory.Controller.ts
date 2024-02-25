import { NextFunction, Request, Response } from "express";
import { checkParamBodyError } from "../Utilities/checkError";
import appError from "../Utilities/appError";
import {
  catchAsyncFuncFactory,
  catchAsyncFuncFactoryWithGetOne,
} from "../Utilities/decoratorFunc";
import mongoose, { Model } from "mongoose";
import APIFeatures from "../Utilities/apiFeature";

export class ControllerFactory {
  @catchAsyncFuncFactory
  protected async deleteFactory(
    req: Request,
    res: Response,
    next: NextFunction,
    modal: mongoose.Model<any>,
  ) {
    //in case any error
    const requiredBody = checkParamBodyError(req);
    if (requiredBody) return next(requiredBody);

    const doc = await modal.findByIdAndDelete(req.params.id);
    if (!doc) return next(new appError("No document found with this id", 404));

    return res.status(204).json({
      status: "Success",
      data: null,
    });
  }

  @catchAsyncFuncFactory
  protected async createFactory(
    req: Request,
    res: Response,
    next: NextFunction,
    modal: mongoose.Model<any>,
  ) {
    const requiredBody = checkParamBodyError(req);
    if (requiredBody) return next(requiredBody);

    const doc = await modal.create(req.body);
    return res.status(200).json({
      status: "Success",
      data: {
        [modal.collection.collectionName]: doc,
      },
    });
  }

  @catchAsyncFuncFactory
  protected async updateFactory(
    req: Request,
    res: Response,
    next: NextFunction,
    model: mongoose.Model<any>,
  ) {
    const requiredBody = checkParamBodyError(req);
    if (requiredBody) return next(requiredBody);
    const updateData = await model
      .findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      })
      .select("-__v");
    if (!updateData)
      return next(new appError("No document found with this id", 404));

    return res.status(200).json({
      status: "Success",

      data: {
        [model.collection.collectionName]: updateData,
      },
    });
  }

  @catchAsyncFuncFactoryWithGetOne
  protected async getAllFactory(
    req: Request,
    res: Response,
    next: NextFunction,
    model: Model<any>,
    //in review route we want to find specific id that coming from nest route

    populate: object,
  ) {
    const features = new APIFeatures(model?.find(populate), req)
      .filter()
      .sort()
      .limitfiled()
      .pagination();
    const doc = await features.query;

    const count = doc.length;

    if (!count) return next(new appError("No document found in this url", 404));

    return res.status(200).json({
      status: "Success",
      dataSize: count,
      data: { [model.collection.collectionName]: doc },
    });
  }

  @catchAsyncFuncFactoryWithGetOne
  protected async getOneFactory(
    req: Request,
    res: Response,
    next: NextFunction,
    model: mongoose.Model<any>,
    populate?: { path: string; select?: string },
  ) {
    const requiredBody = checkParamBodyError(req);
    if (requiredBody) return next(requiredBody);
    let query = model.findById(req.params.id).select("-__v");

    //which virtual populate you want to infer it review should be review
    if (populate) query = query.populate(populate);

    const doc = await query;

    if (!doc) return next(new appError("No document with this id", 404));

    return res.status(200).json({
      status: "Success",
      data: {
        [model.collection.collectionName]: doc,
      },
    });
  }
}
