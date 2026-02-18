import { Request, Response } from "express";
import { UserService } from "./user.service";

const userService = new UserService();

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getUsers = async (_req: Request, res: Response) => {
  const users = await userService.getUsers();
  res.json({ success: true, data: users });
};
export const getAuthenticateUserInfo = async (req: Request, res: Response) => {
  const userId = req?.user?.id || "";
  const users = await userService.getAuthenticateUser(userId);
  res.json({ success: true, data: users });
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.json({ success: true, data: user });
};

export const deleteUser = async (req: Request, res: Response) => {
  await userService.deleteUser(req.params.id);
  res.json({ success: true, message: "User deleted successfully" });
};
export const getFilterUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.filterUsers(req.query);

    res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
