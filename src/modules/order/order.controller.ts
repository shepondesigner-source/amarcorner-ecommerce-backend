import { Request, Response } from "express";
import {
  createOrderSchema,
  getOrderListSchema,
  updateOrderSchema,
} from "./order.schema";
import {
  createOrderService,
  createOrderServiceOpen,
  getOrderListService,
  updateOrderService,
} from "./order.service";
import { Role } from "../../../generated/prisma";
import { body } from "express-validator";

export const createOrderController = async (req: Request, res: Response) => {
  const parsed = createOrderSchema.parse({
    body: req.body,
  });

  const userId = req?.user?.id || "";

  const order = await createOrderService(userId, parsed.body);

  res.status(201).json({
    message: "Order created successfully",
    data: order,
  });
};

export const createOrderControllerOpen = async (
  req: Request,
  res: Response
) => {
  // const parsed = createOrderSchema.parse({
  //   body: req.body,
  // });

  console.log(req.body);
  const order = await createOrderServiceOpen( req.body);

  // res.status(201).json({
  //   message: "Order created successfully",
  //   data: order,
  // });
};

export const getOrderListController = async (req: Request, res: Response) => {
  const parsed = getOrderListSchema.parse({
    query: req.query,
  });

  const userId = req?.user?.id || "";
  const userRole = req?.user?.role as Role;

  const page = Number(parsed.query.page ?? 1);
  const limit = Number(parsed.query.limit ?? 10);

  const result = await getOrderListService(userId, userRole, page, limit);

  res.status(200).json({
    message: "Order list fetched successfully",
    ...result,
  });
};

export const updateOrderController = async (req: Request, res: Response) => {
  const parsed = updateOrderSchema.parse({
    params: req.params,
    body: req.body,
  });

  const userId = req?.user?.id || "";
  const role = req?.user?.role as Role;

  const order = await updateOrderService(
    parsed.params.id,
    userId,
    role,
    parsed.body
  );

  res.status(200).json({
    message: "Order updated successfully",
    data: order,
  });
};
