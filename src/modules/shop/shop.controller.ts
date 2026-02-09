import { Request, Response } from "express";
import { ShopService } from "./shop.service";
import { Role } from "../../../generated/prisma";

const service = new ShopService();

export const createShop = async (req: Request, res: Response) => {
  const file = req.file;

  const shop = await service.create(req?.user!, req.body, file);
  res.status(201).json(shop);
};

export const getShops = async (req: Request, res: Response) => {
  const user = req?.user;
  if (!user) {
    return res.status(400).json({ error: "User is required" });
  }
  const result = await service.findPaginated(req.query, user);
  res.json(result);
};

export const getShopsByUser = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const shops = await service.findByUserId(userId);
  res.json(shops);
};

export const updateShop = async (req: Request, res: Response) => {
  const file = req.file;
  const user = req?.user;
  if (user?.role != "ADMIN") {
    return res.status(400).json({ error: "User is prsmission required." });
  }
  const shop = await service.update(req.params.id, req.body, file);
  res.json(shop);
};

export const deleteShop = async (req: Request, res: Response) => {
  const user = req?.user;
  if (user?.role != "ADMIN") {
    return res.status(400).json({ error: "User is prsmission required." });
  }
  await service.delete(req.params.id);
  res.status(204).send();
};
