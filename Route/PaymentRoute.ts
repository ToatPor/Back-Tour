import { Router } from "express";
import { authControllers } from "../Controller/Auth.controller";
import BookingController from "../Controller/Booking.controller";
import { UserRole } from "../Models/EnumUser";

const PaymentRoute = Router();
//get check out session
PaymentRoute.use(authControllers.protectRoute);
PaymentRoute.route("/checkout").post(BookingController.createBookingCheckout);
PaymentRoute.route("/checkoutSession/:tourId").get(
  BookingController.getCheckoutSession,
);

PaymentRoute.use(
  authControllers.restrictTo(UserRole.admin, UserRole.leadGuide),
);
PaymentRoute.route("/")
  .post(BookingController.insertBooking.bind(BookingController))
  .get(BookingController.getBooking.bind(BookingController));

PaymentRoute.route("/:id")
  .delete(BookingController.deleteBooking.bind(BookingController))
  .patch(BookingController.updateBooking.bind(BookingController))
  .get(BookingController.getOneBooking.bind(BookingController));

export default PaymentRoute;
