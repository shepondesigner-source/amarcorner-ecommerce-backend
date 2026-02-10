// otp.service.ts
import bcrypt from "bcryptjs";
import { addMinutes } from "date-fns";
import { OtpRepository } from "./otp.repository";
import { OtpPurpose } from "./otp.type";
import { BadRequestError } from "../../core/errors/HttpError";
import { prisma } from "../../config/prisma";
import { MailService } from "../common/service";
import { otpTemplate } from "../../core/templates/otp.template";

export class OtpService {
  private repo = new OtpRepository();

  async generateOtp(email: string, purpose: OtpPurpose) {
    if (!email) {
      throw new BadRequestError("Email is required");
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestError("User not found");
    }

    /* ---------- Invalidate previous OTPs ---------- */
    await this.repo.deleteMany({
      userId: user.id,
      purpose,
    });

    /* ---------- Generate OTP ---------- */
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);

    const expiresAt = addMinutes(new Date(), 5);

    /* ---------- Save OTP ---------- */
    await this.repo.create({
      code: hashedOtp,
      purpose,
      expiresAt,
      userId: user.id,
    });

    /* ---------- Send OTP Email ---------- */
    await MailService.send({
      to: user.email,
      subject: "Your Password Reset OTP",
      html: otpTemplate({
        name: user.name,
        otp: rawOtp,
        storeName: "YourStoreName",
      }),
    });

    /* ---------- Never return hashed OTP ---------- */
    return rawOtp; // only if you really need it (usually not)
  }

  async verifyOtp(
    email: string | undefined,
    purpose: OtpPurpose,
    code: string,
  ) {
    if (!email) {
      throw new BadRequestError("Email is required");
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestError("User not found");
    }
    const otp = await this.repo.findValidOtp(user.id, purpose);

    if (!otp) {
      throw new BadRequestError("OTP not found or expired");
    }

    const isMatch = await bcrypt.compare(code, otp.code);

    if (!isMatch) {
      throw new BadRequestError("Invalid OTP");
    }

    await this.repo.markVerified(otp.id);

    return true;
  }
}
