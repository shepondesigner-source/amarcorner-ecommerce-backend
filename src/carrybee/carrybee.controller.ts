import { Request, Response } from "express";
import {
  createCarrybeeFromOrderSchema,
  createCarrybeeOrderSchema,
  createStoreSchema,
  getAreasSchema,
  getZonesSchema,
  trackCarrybeeOrderSchema,
} from "./carrybee.schema";
import {
  cancelCarrybeeOrderService,
  createCarrybeeOrderFromOrderService,
  createCarrybeeOrderService,
  createStoreService,
  getAreasService,
  getCitiesService,
  getStoresService,
  getZonesService,
  trackCarrybeeOrderService,
} from "./carrybee.service";

export const getStoresController = async (_req: Request, res: Response) => {
  const data = await getStoresService();
  res.json({ success: true, data });
};

export const createStoreController = async (req: Request, res: Response) => {
  const parsed = createStoreSchema.parse({ body: req.body });
  const data = await createStoreService(parsed.body);
  res.status(201).json({ success: true, data });
};

export const getCitiesController = async (_req: Request, res: Response) => {
  const data = await getCitiesService();
  res.json({ success: true, data });
};

export const getZonesController = async (req: Request, res: Response) => {
  const parsed = getZonesSchema.parse({ query: req.query });
  const data = await getZonesService(parsed.query.city_id);
  res.json({ success: true, data });
};

export const getAreasController = async (req: Request, res: Response) => {
  const parsed = getAreasSchema.parse({ query: req.query });
  const data = await getAreasService(
    parsed.query.city_id,
    parsed.query.zone_id,
  );
  res.json({ success: true, data });
};

export const createCarrybeeOrderController = async (
  req: Request,
  res: Response,
) => {
  const parsed = createCarrybeeOrderSchema.parse({ body: req.body });
  const data = await createCarrybeeOrderService(parsed.body);
  res.status(201).json({ success: true, data });
};

export const createCarrybeeFromOrderController = async (
  req: Request,
  res: Response,
) => {
  const parsed = createCarrybeeFromOrderSchema.parse({ body: req.body });
  const {
    orderId,
    cityId,
    zoneId,
    areaId,
    deliveryType,
    itemWeight,
    instruction,
  } = parsed.body;
  const data = await createCarrybeeOrderFromOrderService(
    orderId,
    cityId,
    zoneId,
    areaId,
    deliveryType,
    itemWeight,
    instruction,
  );
  res
    .status(201)
    .json({ success: true, message: "Carrybee order created", data });
};

export const trackCarrybeeOrderController = async (
  req: Request,
  res: Response,
) => {
  const parsed = trackCarrybeeOrderSchema.parse({ params: req.params });
  const data = await trackCarrybeeOrderService(parsed.params.consignmentId);
  res.json({ success: true, data });
};

export const cancelCarrybeeOrderController = async (
  req: Request,
  res: Response,
) => {
  const parsed = trackCarrybeeOrderSchema.parse({ params: req.params });
  const data = await cancelCarrybeeOrderService(parsed.params.consignmentId);
  res.json({ success: true, data });
};
