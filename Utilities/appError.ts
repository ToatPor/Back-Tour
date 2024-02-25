// export type IErrorsendDev = Pick<IDevError, "message" | "errorCode" | "errorStatus" | "stack">;
import { IDevError } from "../Controller/InterfaceTourController/IError";
class appError extends Error implements IDevError {
  public errorStatus: string;
  public isOperation: boolean = true;
  public stack: string;
  constructor(
    public message: string,
    public errorCode: number = 500,
  ) {
    super(message);
    this.errorStatus = `${errorCode}`.startsWith("4") ? "fail" : "error";
    this.errorCode = errorCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default appError;
