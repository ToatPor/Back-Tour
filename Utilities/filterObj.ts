import { Request } from "express";
export const filterOut = function (req: Request, ...arg: string[]) {
  const newObj: Record<string, string> = {};
  Object.keys(req.body).forEach((el) => {
    if (arg.includes(el)) newObj[el] = req.body[el];
  });

  return newObj;
};
