import express, { Express } from "express";
import TourRouter from "./Route/TourRoute";
import UserRouter from "./Route/UserRouter";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import ErrorController from "./Controller/Error.controller";
import appError from "./Utilities/appError";
// import rateLimit from "express-rate-limit";
import helmet from "helmet";
import ExpressMongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import reviewRouter from "./Route/ReviewRoute";
import PaymentRoute from "./Route/PaymentRoute";

const app: Express = express();

//fixing cookies does not sending to front-end
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);
app.use(express.static("public"));

//set Security http headers
app.use(helmet());
app.use(morgan("dev"));
//count request coming from same Ip address
//only apply only route start with /api
// app.use(
//   "/api",
//   rateLimit({
//     //how maximum limited
//     max: 100,
//     //hours windowMs reset rate limit
//     windowMs: 60 * 60 * 1000,
//     message: "Too many requests from this IP, Please try again an hour!",
//   }),
// );

//When data coming from body large more than 10kb will not accept
app.use(bodyParser.json({ limit: "10kb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

//data sanitization against NoSql query injection
app.use(ExpressMongoSanitize());
app.use(
  hpp({
    whitelist: [
      "duration",
      "price",
      "ratingsAverage",
      "ratingsQuantity",
      "difficulty",
      "maxGroupSize",
    ],
  }),
);
app.use("/api/v1/tours", TourRouter);
app.use("/api/v1/user", UserRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/booking", PaymentRoute);

app.all("*", (req, res, next) => {
  next(new appError(`Cant find ${req.originalUrl} on this server`, 404));
});

app.use(ErrorController.errorResponseController.bind(ErrorController));
export default app;
