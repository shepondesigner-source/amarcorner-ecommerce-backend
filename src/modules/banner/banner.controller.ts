import { Request, Response, NextFunction } from "express";
import { BannerService } from "./banner.service";

export const BannerController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const banner = await BannerService.createBanner(
        req.body,
        req.files?.["image"]?.[0],
      );
      res.status(201).json({ success: true, data: banner });
    } catch (err) {
      next(err);
    }
  },

  getAll: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const banners = await BannerService.getAllBanners();
      res.json({ success: true, data: banners });
    } catch (err) {
      next(err);
    }
  },

  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const banner = await BannerService.getBannerById(req.params.id);
      res.json({ success: true, data: banner });
    } catch (err) {
      next(err);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const banner = await BannerService.updateBanner(
        req.params.id,
        req.body,
        req.files?.["image"]?.[0],
      );
      res.json({ success: true, data: banner });
    } catch (err) {
      next(err);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await BannerService.deleteBanner(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
