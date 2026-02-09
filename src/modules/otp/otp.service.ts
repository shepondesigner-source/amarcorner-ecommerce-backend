// otp.service.ts
import bcrypt from "bcryptjs";
import { addMinutes } from "date-fns";
import { OtpRepository } from "./otp.repository";
import { OtpPurpose } from "./otp.type";
import { BadRequestError } from "../../core/errors/HttpError";

export class OtpService {
  private repo = new OtpRepository();

  async generateOtp(userId: string | undefined, purpose: OtpPurpose) {
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);

    const expiresAt = addMinutes(new Date(), 5);

    await this.repo.create({
      code: hashedOtp,
      purpose,
      expiresAt,
      userId,
    });

    // send OTP via email / SMS here
    return rawOtp;
  }

  async verifyOtp(
    userId: string | undefined,
    purpose: OtpPurpose,
    code: string
  ) {
    const otp = await this.repo.findValidOtp(userId, purpose);

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
