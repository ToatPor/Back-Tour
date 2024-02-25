import { ValidationChain, body, param } from "express-validator";
import { UserRole } from "../Models/EnumUser";

export const UserValidator: ValidationChain[] = [
  body("name")
    .notEmpty()
    .withMessage("Please provide name for us")
    .isString()
    .withMessage("Name should be text format")
    .escape(),
  body("email")
    .notEmpty()
    .withMessage("Please provide email for us")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide valid email"),
  body("role")
    .optional()
    .isEmpty()
    .trim()
    .equals(UserRole.user)
    .withMessage("Role can only be user"),
  body("photo").optional().trim().isString().withMessage("Photo should be text format").escape(),
  body("password")
    .notEmpty()
    .withMessage("Please provide password for us")
    .isString()
    .withMessage("password should be text format")
    .isLength({ min: 8 })
    .withMessage("password should contains more than or equal 8 characters")
    .escape(),
  body("passwordConfirm")
    .notEmpty()
    .withMessage("Please provide password for us")
    .isString()
    .withMessage("password should be text format")
    .isLength({ min: 8 })
    .withMessage("password should contains more than or equal 8 characters")
    .escape(),
  body("passwordChangeAt")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("password change at should be date type"),
  body("passwordResetToken")
    .optional()
    .trim()
    .isString()
    .withMessage("This field should format in string")
    .escape(),
  body("passwordResetTokenExpired")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("passwordResetTokenExpired change at should be date type"),
  body("active")
    .optional()
    .isEmpty()
    .withMessage("This field is not required please delete")
    .isBoolean({ strict: false })
    .withMessage("Property accepts only boolean"),
];

export const updateMeValidator: ValidationChain[] = [
  body("password")
    .isEmpty()
    .withMessage("This route is not for update password, Please use /updatePassword route")
    .escape(),
  body("passwordConfirm")
    .isEmpty()
    .withMessage("This route is not for update password, Please use /updatePassword route")
    .escape(),
  body("role").isEmpty().withMessage("You have no permission to change role"),
  body("email").optional().isEmail().withMessage("Please provide valid email address").escape(),
  body("name").optional().isString().withMessage("Name should be string format").escape(),
];

export const verifyUserValidator: ValidationChain[] = [
  body("otp")
    .notEmpty()
    .withMessage("Please provide OTP password for verify your login")
    .isString()
    .withMessage("OTP password should be string format")
    .isLength({ min: 6, max: 6 })
    .withMessage("Please provide 6 digits of your OTP password")
    .escape(),
  param("id")
    .exists({ checkFalsy: true })
    .trim()
    .isMongoId()
    .withMessage("Invalid Id please provide correct Id"),
];

export const updateByAdmin: ValidationChain[] = [
  body("email").optional().isEmail().normalizeEmail().withMessage("Please provide valid E-mail"),
  body("role")
    .optional()
    .isIn([UserRole.guide, UserRole.leadGuide])
    .withMessage("Role can be only guide or lead-guide"),
  body("name").optional().isString().withMessage("Name should be string format"),
];
