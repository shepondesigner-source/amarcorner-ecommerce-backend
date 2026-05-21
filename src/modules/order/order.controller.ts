import { Request, Response } from "express";
import {
  createOrderSchema,
  getOrderListSchema,
  getOrderSchema,
  trackOrderSchema,
  updateOrderAmountSchema,
  updateOrderSchema,
} from "./order.schema";
import {
  createOrderService,
  createOrderServiceOpen,
  deleteOrderService,
  exportContactsService,
  getDayOrdersService,
  getDaysSummaryService,
  getOpenOrderService,
  getOrderListService,
  trackOrderService,
  updateOrderAmountService,
  updateOrderService,
} from "./order.service";
import { Role, VendorPayoutStatus } from "../../../generated/prisma";
import { body } from "express-validator";
import { createPathaoOrder } from "../common/service";

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
  res: Response,
) => {
  // const parsed = createOrderSchema.parse({
  //   body: req.body,
  // });

  // console.log(req.body);
  const order: any = await createOrderServiceOpen(req.body);
  if (order.length === 0) {
    res.status(500).json({
      message: "Internal server error",
      data: order,
    });
  }
  res.status(201).json({
    message: "Order created successfully",
    data: order,
  });
};

export const getOrderListController = async (req: Request, res: Response) => {
  try {
    const userId = req?.user?.id || "";
    const userRole = req?.user?.role as Role;

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    const search = req.query.search as string | undefined;
    const shopId = req.query.shopId as string | undefined;

    const vendorPayoutStatus = req.query.vendorPayoutStatus as
      | VendorPayoutStatus
      | undefined;

    const excludePaidVendorPayment =
      req.query.excludePaidVendorPayment === "true";

    const result = await getOrderListService(
      userId,
      userRole,
      page,
      limit,
      search,
      shopId,
      vendorPayoutStatus,
      excludePaidVendorPayment,
    );

    res.status(200).json({
      success: true,
      message: "Order list fetched successfully",
      ...result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch order list",
    });
  }
};

export const getOpenOrderController = async (req: Request, res: Response) => {
  const parsed = getOrderSchema.parse({
    params: req.params,
  });

  const order = await getOpenOrderService(parsed.params.id);

  res.status(200).json({
    message: "Order updated successfully",
    data: order,
  });
};


export const updateOrderController = async (req: Request, res: Response) => {
  const parsed = updateOrderSchema.parse({
    params: req.params,
    body: req.body,
  });
console.log(body)
  const userId = req?.user?.id || "";
  const role = req?.user?.role as Role;

  const order = await updateOrderService(
    parsed.params.id,
    userId,
    role,
    parsed.body,
  );

  res.status(200).json({
    message: "Order updated successfully",
    data: order,
  });
};

export const updateOrderPriceController = async (
  req: Request,
  res: Response,
) => {
  const parsed = updateOrderAmountSchema.parse({
    params: req.params,
    body: req.body,
  });

  const order = await updateOrderAmountService(
    parsed.params.id,
    parsed.body.totalAmount,
  );

  res.status(200).json({
    message: "Order updated successfully",
    data: order,
  });
};

export const deleteOrderController = async (req: Request, res: Response) => {
  const order = await deleteOrderService(req.params.id);

  res.status(200).json(order);
};

export const pathaoOrderController = async (req: Request, res: Response) => {
  const order = await createPathaoOrder(req.body.id);

  res.status(200).json({ message: "Pathao order created successfully" });
};

export const getDayOrdersController = async (req: Request, res: Response) => {
  const day = req.params.day as "today" | "yesterday";
  const result = await getDayOrdersService(day);
  res.status(200).json({ success: true, ...result });
};

export const getDaysSummaryController = async (_req: Request, res: Response) => {
  const result = await getDaysSummaryService();
  res.status(200).json({ success: true, ...result });
};

export const exportContactsController = async (_req: Request, res: Response) => {
  const vcf = await exportContactsService();
  res.setHeader("Content-Type", "text/vcard; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="customers.vcf"');
  res.send(vcf);
};

export const trackOrderController = async (req: Request, res: Response) => {
  const parsed = trackOrderSchema.parse({ query: req.query });

  const order = await trackOrderService(
    Number(parsed.query.orderNumber),
    parsed.query.phone,
  );

  res.status(200).json({
    success: true,
    data: order,
  });
};
