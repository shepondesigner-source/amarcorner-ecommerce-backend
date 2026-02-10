import { Role } from "../../../generated/prisma";
import { prisma } from "../../config/prisma";
import {
  BadRequestError,
  UnauthorizedError,
} from "../../core/errors/HttpError";
import { welcomeTemplate } from "../../core/templates/welocome.template";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../core/utils/jwt";
import { MailService } from "../common/service";
import { AuthRepository } from "./auth.repository";
import bcrypt from "bcryptjs";

export class AuthService {
  private repo = new AuthRepository();

  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: Role;
  }) {
    const existing = await this.repo.findUserByEmail(data.email);
    if (existing) throw new BadRequestError("Email already exists");

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.repo.createUser({
      ...data,
      password: hashedPassword,
    });

    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id, role: user.role });
    try {
      if (user?.email) {
        await MailService.send({
          to: user.email,
          subject: `Welcome`,
          html: welcomeTemplate({ name: user.name, storeName: "Amarcorner" }),
        });
      }
    } catch (err) {
      console.error("Failed to send order email:", err);
    }
    return { accessToken, refreshToken };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.repo.findUserByEmail(data.email);
    if (!user) throw new UnauthorizedError("Invalid credentials");

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new UnauthorizedError("Invalid credentials");

    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id, role: user.role });
    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return { userInfo, accessToken, refreshToken };
  }

  async refreshToken(token: string) {
    try {
      const payload = verifyRefreshToken(token);
      const accessToken = signAccessToken({
        id: payload.id,
        role: payload.role,
      });
      const refreshToken = signRefreshToken({
        id: payload.id,
        role: payload.role,
      });
      return { accessToken, refreshToken };
    } catch {
      throw new UnauthorizedError("Invalid refresh token");
    }
  }

  async updatePassword(
    id: string,

    password: string,
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.repo.updatePassword(id, hashedPassword);

    return user;
  }

  async forgetPassword(email: string, otp: string, password: string) {
    // 1️⃣ Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestError("User not found");

    // 2️⃣ Find latest OTP for password reset
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId: user.id,
        purpose: "PASSWORD_RESET", // your OtpPurpose enum
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) throw new BadRequestError("OTP not found");

    // 3️⃣ Check expiry
    if (otpRecord.expiresAt < new Date()) {
      throw new BadRequestError("OTP expired");
    }

    // 4️⃣ Compare OTP
    const isOtpValid = await bcrypt.compare(otp, otpRecord.code);
    if (!isOtpValid) {
      throw new BadRequestError("Invalid OTP");
    }

    // 5️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6️⃣ Update user password
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // 7️⃣ Mark OTP as used (optional: delete instead)
    await prisma.oTP.delete({ where: { id: otpRecord.id } });

    return updatedUser;
  }
}
