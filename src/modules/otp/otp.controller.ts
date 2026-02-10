// otp.controller.ts
import { Request, Response } from "express";
import { OtpService } from "./otp.service";

const otpService = new OtpService();

export class OtpController {
  static async generate(req: Request, res: Response) {
    const { email, purpose } = req.body;

    const otp = await otpService.generateOtp(email, purpose);

    res.status(201).json({
      message: "OTP generated",
      // ⚠️ remove otp in production
    });
  }

  static async verify(req: Request, res: Response) {
    const { email, purpose, code } = req.body;

    await otpService.verifyOtp(email, purpose, code);

    res.json({ message: "OTP verified successfully" });
  }
}
