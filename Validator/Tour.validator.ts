import { ValidationChain, body, param } from "express-validator";

export const TourValidator: ValidationChain[] = [
  body("name")
    .not()
    .isEmpty()
    .withMessage("Tour name must be fill")
    .trim()
    .isString()
    .withMessage("Name should be text format")
    .escape(),
  body("duration")
    .not()
    .isEmpty()
    .withMessage("Tour must have a duration")
    .isNumeric()
    .withMessage("Duration should be numeric format")
    .escape(),
  body("maxGroupSize")
    .not()
    .isEmpty()
    .withMessage("Tour must have a maxGroupsize")
    .isNumeric()
    .withMessage("Duration should be number format"),
  body("difficulty")
    .not()
    .isEmpty()
    .withMessage("Tour have a challenge")
    .trim()
    .isIn(["easy", "medium", "difficult"])
    .withMessage("Difficulty can only be easy, medium or difficult"),
  body("ratingsAverage")
    .optional()
    .isNumeric()
    .withMessage("ratings average should be number format")
    .isFloat({ min: 1, max: 5 })
    .withMessage("rating average minimum score is 1 and  maximum number is 5"),
  body("ratingsQuantity")
    .optional()
    .isNumeric()
    .withMessage("ratings quantity should be number format"),
  body("price")
    .not()
    .isEmpty()
    .withMessage("Tour should contain price")
    .isNumeric()
    .withMessage("Price should be number format"),
  body("priceDiscount")
    .optional()
    .isNumeric()
    .withMessage("Price discount should be number format"),
  body("summary")
    .not()
    .isEmpty()
    .withMessage("Tour summary need to be fill")
    .isString()
    .withMessage("Summary should be string format")
    .escape(),
  body("description")
    .optional()
    .isString()
    .withMessage("Description should be string format")
    .trim()
    .escape(),
  body("imageCover")
    .not()
    .isEmpty()
    .withMessage("image cover should be fill")
    .isString()
    .withMessage("Image cover should be string format")
    .trim()
    .escape(),
  body("images.*")
    .optional()
    .isString()
    .withMessage("images should be string format")
    .trim()
    .escape(),
  body("images")
    .optional()
    .isArray()
    .withMessage("images should contain in array"),
  body("createDate")
    .optional()
    .isISO8601()
    .toDate()
    .trim()
    .withMessage("Create date should be type of date"),
  body("startDates.*")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Start date should be type of date"),

  body("secretTour")
    .optional()
    .isBoolean()
    .withMessage("Secret tour need should be type of boolean"),
  body("startLocation")
    .optional()
    .isObject()
    .withMessage("startLocation should be an object"),
  body("startLocation.type")
    .optional()
    .isString()
    .equals("Point")
    .withMessage("Type of startLocation should be point")
    .escape(),
  body("startLocation.coordinates")
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinated should be array"),
  body("startLocation.coordinates.*")
    .optional()
    .isNumeric()
    .withMessage("lat and lng should be number"),
  body("startLocation.address")
    .optional()
    .isString()
    .withMessage("Address should be type of string")
    .trim(),
  body("startLocation.description")
    .optional()
    .isString()
    .withMessage("start location description should be type of string")
    .trim(),
  body("locations")
    .optional()
    .isArray({ min: 1 })
    .withMessage("locations should contains 1"),
  body("locations.*.type")
    .notEmpty()
    .withMessage("Please provide type of point")
    .isString()
    .equals("Point")
    .withMessage("This filed can only be Point"),
  body("locations.*.coordinates")
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage("Please provide lat lng coordinates"),
  body("locations.*.coordinates.*")
    .isNumeric()
    .withMessage("lat lng should be Numeric type"),
  body("locations.*.description")
    .isString()
    .withMessage("Description should be string format")
    .trim()
    .escape(),
  body("locations.*.day")
    .isNumeric()
    .withMessage("day should be number format")
    .trim()
    .escape(),
];

export const TourMonthlyPlanValidate: ValidationChain[] = [
  param("year")
    .exists({ checkFalsy: true })
    .trim()
    .isNumeric()
    .withMessage(
      "please provide year for forcasting monthly plan should be number format",
    )
    .isLength({ min: 4 })
    .withMessage("year must contains 4 digits"),
];
export const checkParamId: ValidationChain[] = [
  param("id")
    .exists({ checkFalsy: true })
    .trim()
    .isMongoId()
    .withMessage("Document id was not correct please check again!"),
];
// /tours-within/:distance/center/:latlng/unit/:unit

export const checkGeoParam: ValidationChain[] = [
  param("distance")
    .notEmpty()
    .withMessage("Please provide distance")
    .isNumeric()
    .withMessage("distance should be numeric format"),
  param("latlng")
    .notEmpty()
    .withMessage("Please provide distance")
    .isLatLong()
    .withMessage(
      "Invalid input for latlng, Please provide latitude and longitude ",
    ),
  // .matches(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/)
  // .withMessage("please provide latitude,longitude in numeric format"),
  param("unit")
    .exists()
    .isIn(["mi", "km"])
    .withMessage("unit should be only mi or km"),
];

export const checkGeoDistance: ValidationChain[] = [
  param("latlng")
    .exists()
    .isLatLong()
    .withMessage(
      "Invalid input for latlng, Please provide latitude and longitude",
    ),
  param("unit")
    .exists()
    .isIn(["mi", "k m"])
    .withMessage("unit should be only mi or km"),
];
