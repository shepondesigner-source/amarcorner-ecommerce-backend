import nodemailer from "nodemailer";
import { Resend } from "resend";

export const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  }
});


export const resend = new Resend(process.env.RESEND_API_KEY);



