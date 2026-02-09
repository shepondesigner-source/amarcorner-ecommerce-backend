import { Request, Response } from "express";
import { SizeService } from "./size.service";

const sizeService = new SizeService();

export const createSize = async (req: Request, res: Response) => {
  try {
    const size = await sizeService.createSize(req.body.name);
    res.status(201).json({ success: true, data: size });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSizes = async (_req: Request, res: Response) => {
  const sizes = await sizeService.getAllSizes();
  res.json({ success: true, data: sizes });
};

export const updateSize = async (req: Request, res: Response) => {
  try {
    const size = await sizeService.updateSize(req.params.id, req.body.name);
    res.json({ success: true, data: size });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSize = async (req: Request, res: Response) => {
  await sizeService.deleteSize(req.params.id);
  res.json({ success: true, message: "Size deleted" });
};
