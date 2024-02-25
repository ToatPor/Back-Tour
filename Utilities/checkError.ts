import appError from "./appError";
import { Request } from "express";
import { validationResult } from "express-validator";

export const checkParamBodyError = function (req: Request) {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    const invalidId = error
      .array()
      .map((el) => el.msg)
      .join(", ");
    return new appError(invalidId, 403);
  }
  return;
};
