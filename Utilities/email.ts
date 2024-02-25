import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { IUser } from "../Models/IUser";
import pug from "pug";
import { convert } from "html-to-text";

export class Email {
  to: string;
  firstName: string;
  from: string;

  constructor(
    protected user: IUser,
    private url: string,
    private token: string | undefined,
  ) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url;
    this.from = `Natours <${process.env.EMAIL_FROM}}>`;
    this.token = token;
  }

  createTransport() {
    if (process.env.NODE_ENV === "development") {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      } as SMTPTransport.Options);
    }
    return;
  }

  async send(template: string, subject: string) {
    //grab pug file from view folder
    const html = pug.renderFile(
      `${__dirname}/View/emails/${template}.pug`,
      //passing parameter to template
      { firstName: this.firstName, url: this.url, subject, token: this.token },
    );

    //use html to text transform  html to text
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html,
      text: convert(html),
    };

    await this.createTransport()?.sendMail(mailOptions);
  }

  //select which template you want to select like welcome send otp
  async sendWelcome() {
    await this.send("welcome", "Welcome to the Natours Family");
  }

  async sendOtp() {
    await this.send("otp", "Please verify your otp");
  }

  async sendResetPassword() {
    await this.send(
      "resetpassword",
      `Your password reset token (valid only 10 minutes)`,
    );
  }
}

//mailer always return promise
// export const sendEmail = async function (optionsEmail: {
//   email: string;
//   subject: string;
//   message: string;
// }) {
//   //create transport for sending email

//   const transport = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   } as SMTPTransport.Options);

//   // email option
//   const mailOptions = {
//     from: "crazytoat@dickhead.com",
//     to: optionsEmail.email,
//     subject: optionsEmail.subject,
//     text: optionsEmail.message,
//   };

//   //send email
//   await transport.sendMail(mailOptions);
// };
