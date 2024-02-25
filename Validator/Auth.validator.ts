import { ValidationChain, body, param } from "express-validator";

export const emailValidate: ValidationChain[] = [
  body("email")
    .notEmpty()
    .withMessage("Please provide e-mail for us")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email format, Ensure email address was correct"),
];

export const resetPasswordValidate: ValidationChain[] = [
  body("password")
    .notEmpty()
    .withMessage("Please provide password")
    .isString()
    .withMessage("password should be string format")
    .isLength({ min: 8 })
    .withMessage("password should contains more than 8 characters")
    .escape(),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("Please provide passwordConfirm")
    .isString()
    .withMessage("passwordConfirm should be string format")
    .isLength({ min: 8 })
    .withMessage("password should contains more than 8 letter")
    .escape(),
  param("token")
    .exists()
    .isString()
    .withMessage("Invalid token, Please provide token for us")
    .trim(),
];

export const updatePassword: ValidationChain[] = [
  body("passwordCurrent")
    .notEmpty()
    .withMessage("Please provide current password")
    .isString()
    .withMessage("current password should be string format")
    .isLength({ min: 8 })
    .withMessage("current password should contains more than 8 characters")
    .trim()
    .escape(),
  body("password")
    .notEmpty()
    .withMessage("Please provide password")
    .isString()
    .withMessage("password should be string format")
    .isLength({ min: 8 })
    .withMessage("password should contains more than 8 characters")
    .trim()
    .escape(),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("Please provide passwordConfirm")
    .isString()
    .withMessage("passwordConfirm should be string format")
    .isLength({ min: 8 })
    .withMessage("password should contains more than 8 letter")
    .trim()
    .escape(),
];
