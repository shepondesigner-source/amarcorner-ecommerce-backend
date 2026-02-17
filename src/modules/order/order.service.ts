import { Role } from "../../../generated/prisma";
import { prisma } from "../../config/prisma";
import { AppError } from "../../core/errors/AppError";
import { ApiResponse } from "../../core/response/ApiResponse";
import { invoiceTemplate } from "../../core/templates/invoice.template";
import { MailService } from "../common/service";

type CreateOrderInput = {
  deliveryCharge: number;
  payment: {
    method: "COD" | "BKASH";
    txId?: string;
    amount: number;
    bkashNumber?: string;
  };
  items: {
    productId: string;
    imageUrl: string;
    sizeId?: string;
    quantity: number;
  }[];
};

export const createOrderService = async (
  userId: string,
  data: CreateOrderInput,
) => {
  /** 1️⃣ Get default shipping address */
  const shippingAddress = await prisma.shippingAddress.findFirst({
    where: {
      userId,
      isDefault: true,
    },
  });

  if (!shippingAddress) {
    throw new Error("Default shipping address not found");
  }

  /** 2️⃣ Fetch products */
  const productIds = data.items.map((i) => i.productId);

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
  });

  if (products.length !== data.items.length) {
    throw new Error("Invalid or inactive product found");
  }

  /** 3️⃣ Calculate total */
  let totalAmount = 0;

  const orderItems = data.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;

    const price = product.discountPrice ?? product.price;
    const lineTotal = price * item.quantity;
    totalAmount += lineTotal;

    return {
      productId: product.id,
      imageUrl: item.imageUrl,
      sizeId: item.sizeId,
      price: product.price,
      discountPrice: product.discountPrice,
      quantity: item.quantity,
    };
  });

  totalAmount += data.deliveryCharge;

  /** 4️⃣ Validate payment amount */
  if (data.payment.amount !== totalAmount) {
    throw new Error("Payment amount mismatch");
  }

  /** 5️⃣ Create order (transaction) */
  const order = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        shippingAddressId: shippingAddress.id,
        totalAmount,
        deliveryCharge: data.deliveryCharge,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    await tx.payment.create({
      data: {
        orderId: order.id,
        method: data.payment.method,
        txId: data.payment.txId?.trim() || null, // ✅ store null instead of ""
        amount: data.payment.amount || 0,
        bkashNumber: data.payment.bkashNumber,
      },
    });

    return order;
  });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      await MailService.send({
        to: user.email,
        subject: `Your Order #${order.id} Invoice`,
        html: invoiceTemplate({
          orderId: order.id,
          items: order.items.map((i) => ({
            name: products.find((p) => p.id === i.productId)!.name,
            quantity: i.quantity,
            price: i.price,
            discountPrice: i.discountPrice,
          })),
          total: totalAmount,
          deliveryCharge: data.deliveryCharge,
        }),
      });
    }
  } catch (err) {
    console.error("Failed to send order email:", err);
  }

  return order;
};

export const getOrderListService = async (
  userId: string,
  userRole: Role,
  page: number,
  limit: number,
) => {
  const skip = (page - 1) * limit;

  /** -----------------------------
   * WHERE condition by role
   * ----------------------------- */
  let whereCondition: any = {};

  if (userRole === "USER") {
    whereCondition.userId = userId;
  }

  if (userRole === "SHOP_OWNER") {
    whereCondition.items = {
      some: {
        product: {
          shop: {
            ownerId: userId, // 🔑 product belongs to shop owner
          },
        },
      },
    };
  }

  // ADMIN → no filter (see all orders)

  /** -----------------------------
   * Query
   * ----------------------------- */
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,

      include: {
        shippingAddress: true, // one order → one shipping address
        payment: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                shop: true,
              },
            },
            size: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),

    prisma.order.count({
      where: whereCondition,
    }),
  ]);

  return {
    data: orders,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateOrderService = async (
  orderId: string,
  userId: string,
  role: Role,
  payload: any,
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: true },
      },
      payment: true,
    },
  });

  if (!order) throw new AppError("Order not found", 404);

  /* ================= USER ================= */
  if (role === "USER") {
    if (order.userId !== userId) throw new AppError("Unauthorized", 403);

    if (payload.status !== "CANCELLED")
      throw new AppError("User can only cancel order", 403);

    if (order.status !== "PENDING")
      throw new AppError("Cannot cancel this order", 400);

    return prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
  }

  /* ================= SHOP OWNER ================= */
  if (role === "SHOP_OWNER") {
    // get all shops owned by user
    const shops = await prisma.shop.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!shops.length) throw new AppError("You do not own any shop", 403);

    const shopIds = shops.map((s) => s.id);

    // check ownership at DB level (best practice)
    const ownsProduct = await prisma.orderItem.findFirst({
      where: {
        orderId,
        product: {
          shopId: { in: shopIds },
        },
      },
    });

    if (!ownsProduct) throw new AppError("Not your order", 403);

    // SHOP OWNER can ONLY update status
    return prisma.order.update({
      where: { id: orderId },
      data: {
        status: payload.status,
      },
    });
  }

  /* ================= ADMIN ================= */
  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: payload.status,
      deliveryCharge: payload.deliveryCharge,
      payment: payload.paymentStatus
        ? {
            update: { status: payload.paymentStatus },
          }
        : undefined,
    },
  });
};
