import { Request, Response } from "express";
import { LongSizeService } from "./longSize.service";

const longSizeService = new LongSizeService();

export const createLongSize = async (req: Request, res: Response) => {
  try {
    const longSize = await longSizeService.createLongSize(req.body.name);
    res.status(201).json({ success: true, data: longSize });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getLongSizes = async (_req: Request, res: Response) => {
  const longSizes = await longSizeService.getAllLongSizes();
  res.json({ success: true, data: longSizes });
};

export const updateLongSize = async (req: Request, res: Response) => {
  try {
    const longSize = await longSizeService.updateLongSize(
      req.params.id,
      req.body.name,
    );
    res.json({ success: true, data: longSize });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteLongSize = async (req: Request, res: Response) => {
  await longSizeService.deleteLongSize(req.params.id);
  res.json({ success: true, message: "Long size deleted" });
};
