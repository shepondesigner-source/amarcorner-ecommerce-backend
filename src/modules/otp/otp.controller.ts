// otp.controller.ts
import { Request, Response } from "express";
import { OtpService } from "./otp.service";

const otpService = new OtpService();

export class OtpController {
  static async generate(req: Request, res: Response) {
    const { userId, purpose } = req.body;

    const otp = await otpService.generateOtp(userId, purpose);

    res.status(201).json({
      message: "OTP generated",
      // ⚠️ remove otp in production
      otp,
    });
  }

  static async verify(req: Request, res: Response) {
    const { userId, purpose, code } = req.body;

    await otpService.verifyOtp(userId, purpose, code);

    res.json({ message: "OTP verified successfully" });
  }
}
