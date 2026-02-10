import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../core/utils/asyncHandler";

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.json(result);
});

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    res.json(result);
  },
);

export const updatePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { password } = req.body;
    const result = await authService.updatePassword(req.user?.id!, password);
    res.json(result);
  },
);

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, otp, password } = req.body;
    const result = await authService.forgetPassword(email, otp, password);
    res.json("New password setup is success.");
  },
);
