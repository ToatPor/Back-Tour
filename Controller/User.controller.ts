import { catchAsyncFunc } from "./../Utilities/decoratorFunc";
import { User } from "../Models/User";
import { checkParamBodyError } from "../Utilities/checkError";
import { Request, Response, NextFunction } from "express";
import {
  FileNameCallBack,
  IAuthUser,
} from "./InterfaceTourController/IAuthController";
import { filterOut } from "../Utilities/filterObj";
import appError from "../Utilities/appError";
import { ControllerFactory } from "./Factory.Controller";
import { Tour } from "../Models/Tours";
import { ObjectId } from "mongodb";
import multer from "multer";
import sharp from "sharp";

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/User");
//   },
//   filename: (req: IAuthUser, file, cb) => {
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user?._id}-${Date.now()}.${ext}`);
//   },
// });
//this will convert to buffer no longer directory to file system
const storage = multer.memoryStorage();
const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileNameCallBack,
) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new appError("Not an inage! Please upload only images", 400), false);
  }
};
const upload = multer({
  storage: storage,
  fileFilter: multerFilter,
});

class UserController extends ControllerFactory {
  //read for user only
  //read update by user
  @catchAsyncFunc
  public async updateMe(req: IAuthUser, res: Response, next: NextFunction) {
    //filter out some field that we not want to update like role
    //not let permission for changing role
    const checkBody = checkParamBodyError(req);
    if (checkBody) return next(checkBody);

    //filter out some field that we don't want to update like role or other field that
    //not related with email and name
    const data = filterOut(req, "email", "name");
    if (req.file) data.photo = req.file.filename;

    //passwordConfirm is not in data base
    //if use save() will need to specify required field so findByIdAndUpdate useful
    const updateUser = await User.findByIdAndUpdate(req.user?._id, data, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: { user: updateUser },
    });
  }

  //for user
  //delete account mean set active field to false will inactive account
  @catchAsyncFunc
  public async deleteMe(req: IAuthUser, res: Response, next: NextFunction) {
    if (!req.user)
      next(new appError("Please login before delete account", 401));
    await User.findByIdAndUpdate(
      req.user?._id,
      { active: false },
      { new: true, runValidators: true },
    );
    res.status(204).json({
      status: "success",
      data: null,
    });
  }

  public getMe(req: IAuthUser, res: Response, next: NextFunction) {
    if (req.user?._id) req.params.id = req.user?._id;
    this.getOneFactory(req, res, next, User, undefined);
  }
  //read this will use only by admin
  public deleteUser(req: Request, res: Response, next: NextFunction) {
    this.deleteFactory(req, res, next, User);
  }

  // don't use for update password this will run validate and save middle ware
  public updateUser(req: Request, res: Response, next: NextFunction) {
    this.updateFactory(req, res, next, User);
  }
  public getOneUser(req: Request, res: Response, next: NextFunction) {
    this.getOneFactory(req, res, next, User, undefined);
  }

  public getAllUser(req: Request, res: Response, next: NextFunction) {
    this.getAllFactory(req, res, next, User, {});
  }

  // not provide for this route
  public createUser(req: Request, res: Response) {
    res.status(500).json({
      status: "error",
      message: "This route is not defined, Please register with /signup route",
    });
  }

  //for update embed document fuck
  @catchAsyncFunc
  public async updateByAdmin(req: Request, res: Response, next: NextFunction) {
    const error = checkParamBodyError(req);
    if (error) next(error);
    const getUserUpdate = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );
    await Tour.findOneAndUpdate(
      {
        "guides._id": new ObjectId(getUserUpdate?.id),
      },
      {
        $set: { "guides.$": getUserUpdate },
      },
    );

    if (!getUserUpdate)
      return next(new appError("There is no Document with this id", 403));
    res.status(200).json({
      status: "success",
      data: {
        [getUserUpdate.collection.collectionName]: getUserUpdate,
      },
    });
  }

  public uploadUserPhoto = upload.single("photo");

  @catchAsyncFunc
  public async resizeImage(req: IAuthUser, res: Response, next: NextFunction) {
    if (!req.file) return next();
    req.file.filename = `user-${req.user?._id}-${Date.now()}.jpeg`;
    //working with sharp is promise
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      //move image to file system with name
      .toFile(`public/img/User/${req.file.filename}`);
    next();
  }
}
export default new UserController();
