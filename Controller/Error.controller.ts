import { Request, Response, NextFunction } from "express";
import { IDevError, IProductError } from "./InterfaceTourController/IError";
import appError from "../Utilities/appError";

class errorController {
  private handleCastError(error: IProductError) {
    const message = `Invalid ${error.path} : ${error.value?.id}`;
    return new appError(message, 400);
  }
  private handleDuplicateError(error: IProductError) {
    return new appError(
      `Duplicated fields value:  ${
        error.keyValue?.name || error.keyValue?.email
      } please try another value`,
      400,
    );
  }

  private handleValidateError(error: IProductError) {
    if (error.errors) {
      const messages = Object.values(error.errors)
        .map((el) => el.message)
        .join(". ");
      return new appError(messages, 400);
    }
    return error;
  }
  private handleJsonwebTokenError() {
    return new appError("Invalid token please login again", 401);
  }

  private handleTokenExpireError() {
    return new appError("Token was expired please login again", 401);
  }
  private developmentController(error: IDevError, res: Response) {
    res.status(error.errorCode).json({
      status: error.errorStatus,
      error: error,
      message: error.message,
      stack: error.stack,
    });
  }

  private productionController(error: IProductError, res: Response) {
    //read error that create by own can send it
    if (error.isOperation) {
      res.status(error.errorCode).json({
        status: error.errorStatus,
        message: error.message,
      });
    } else {
      console.error(error);
      res.status(500).json({
        error: error,
        status: "Error",
        message: "Something went very wrong!",
      });
    }
  }

  public errorResponseController(
    error: IDevError,
    req: Request,
    res: Response,
    _next: NextFunction,
  ) {
    error.errorCode = error.errorCode || 500;
    error.errorStatus = error.errorStatus || "error";

    if (process.env.NODE_ENV === "development") {
      this.developmentController(error, res);
    } else if (process.env.NODE_ENV === "production") {
      let err = Object.assign(error) as IProductError;

      //read convert to meaning error

      if (err.name === "CastError") err = this.handleCastError(err);
      if (err.code === 11000) err = this.handleDuplicateError(err);
      if (err.name === "ValidationError") err = this.handleValidateError(err);
      if (err.name === "JsonWebTokenError")
        err = this.handleJsonwebTokenError();
      if (err.name === "TokenExpiredError") err = this.handleTokenExpireError();

      this.productionController(err, res);
    }
  }
}

export default new errorController();
