import { Request, Response } from "express";
import {
  createSteadfastFromOrderSchema,
  createSteadfastOrderSchema,
} from "./steadfast.schema";
import {
  createSteadfastOrderFromOrderService,
  createSteadfastOrderService,
} from "./steadfast.service";

export const createSteadfastOrderController = async (
  req: Request,
  res: Response,
) => {
  const parsed = createSteadfastOrderSchema.parse({ body: req.body });
  const data = await createSteadfastOrderService(parsed.body);
  res.status(201).json({ success: true, data });
};

export const createSteadfastFromOrderController = async (
  req: Request,
  res: Response,
) => {
  const parsed = createSteadfastFromOrderSchema.parse({ body: req.body });
  const { orderId, deliveryType, note, itemDescription, totalLot } =
    parsed.body;
  const data = await createSteadfastOrderFromOrderService(orderId, {
    deliveryType,
    note,
    itemDescription,
    totalLot,
  });
  res
    .status(201)
    .json({ success: true, message: "Steadfast order created", data });
};
