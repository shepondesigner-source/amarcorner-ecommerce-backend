import { Role } from "../../../generated/prisma";
import {
  BadRequestError,
  UnauthorizedError,
} from "../../core/errors/HttpError";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../core/utils/jwt";
import { AuthRepository } from "./auth.repository";
import bcrypt from "bcryptjs";

export class AuthService {
  private repo = new AuthRepository();

  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role:Role;
    
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
}
