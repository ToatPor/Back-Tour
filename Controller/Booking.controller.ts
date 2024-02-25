import { Booking } from "./../Models/Booking";
import { Stripe } from "stripe";
import { NextFunction, Response, Request } from "express";
import { catchAsyncFunc } from "../Utilities/decoratorFunc";
import { Tour } from "../Models/Tours";
import { IAuthUser } from "./InterfaceTourController/IAuthController";
import appError from "../Utilities/appError";
import { ControllerFactory } from "./Factory.Controller";

class BookingController extends ControllerFactory {
  //generate session for using to react use for stripe
  @catchAsyncFunc
  public async getCheckoutSession(req: IAuthUser, res: Response) {
    // 1 find tour by using param booking tour
    const tour = await Tour.findById(req.params.tourId);
    //2 checkout session
    const stripe = new Stripe(process.env.KEY_STRIPE as string, {
      typescript: true,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      //read need to specify real url
      //not secure need to deploy first
      success_url: `http://localhost:5173/overview/?tour=${req.params.tourId}&user=${req.user?._id}&price=${tour?.price}`,
      cancel_url: `http://localhost:5173/overview`,
      customer_email: req.user?.email,

      //read custom filed for stripe

      client_reference_id: req.params.tourId,

      //read  information about product that user gonna purchase
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "USD",
            unit_amount: Number(tour?.price ?? 0) * 100,
            product_data: {
              name: `${tour?.name} Tour`,
              description: tour?.summary,
              images: [`https://www.natours.dev/img/tours/${tour?.imageCover}`],
            },
          },
        },
      ],
      mode: "payment",
    });

    //3 create session as respone

    res.status(200).json({
      status: "Success",
      session,
    });
  }

  @catchAsyncFunc
  public async createBookingCheckout(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const { tour, user, price } = req.body;
    if (!tour && !user && !price) return next();
    const booking = await Booking.create(req.body);

    //importance
    res.status(200).json({
      status: "Success",
      [booking.collection.collectionName]: booking,
    });
  }

  @catchAsyncFunc
  public async getMyCart(req: IAuthUser, res: Response, next: NextFunction) {
    if (!req.user)
      return next(
        new appError("Please login before get cart information", 400),
      );
    //find booking from user
    const booking = await Booking.find({ user: req?.user._id });

    // will get all tour id
    const getTour = booking.map((val) => val.tour._id);
    const getDuplicateTour = await Promise.all(
      getTour.map(
        async (el) =>
          await Tour.findOne({ _id: el }).select(
            "name price startDates startLocation duration imageCover",
          ),
      ),
    );

    //one user can only booking for one tour
    //select all field that include in array using in
    // const Tours = await Tour.find({ _id: { $in: getTour } }).select(
    //   "name price startDates startLocation duration imageCover",
    // );

    res.status(200).json({
      status: "Success",
      //collection cant use with find
      Bookings: getDuplicateTour,
    });
  }
  //by admin
  public insertBooking(req: Request, res: Response, next: NextFunction) {
    this.createFactory(req, res, next, Booking);
  }
  public deleteBooking(req: Request, res: Response, next: NextFunction) {
    this.deleteFactory(req, res, next, Booking);
  }
  //this will use with review route in any case that not
  public getBooking(req: Request, res: Response, next: NextFunction) {
    this.getAllFactory(req, res, next, Booking, {});
  }
  public updateBooking(req: Request, res: Response, next: NextFunction) {
    this.updateFactory(req, res, next, Booking);
  }

  public getOneBooking(req: Request, res: Response, next: NextFunction) {
    //booking already populate we don't need to populate again
    this.getOneFactory(req, res, next, Booking, undefined);
  }
}
export default new BookingController();
