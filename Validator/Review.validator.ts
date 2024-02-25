import { ValidationChain, body } from "express-validator";

export const reviewValidator: ValidationChain[] = [
  body("review")
    .notEmpty()
    .withMessage("Please provide review message")
    .isString()
    .withMessage("Review should be string format"),
  body("rating")
    .optional()
    .isNumeric()
    .withMessage("rating should be number format")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating minimum value is 1 and maximum value is 5"),
  body("createAt")
    .optional()
    .isISO8601()
    .toDate()
    .trim()
    .withMessage("createAt should be date format"),
];
