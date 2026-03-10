import { Role } from "../../../generated/prisma";
import { prisma } from "../../config/prisma";
import { AppError } from "../../core/errors/AppError";

import bcrypt from "bcryptjs";

type CreateOrderInputOpen = {
  deliveryCharge: number;
  comment?: string;
  user: {
    fullName: string;
    email?: string;
    phone: string;
    district: string;
    address: string;
  };
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
type CreateOrderInput = {
  deliveryCharge: number;
  comment?: string;
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
  data: CreateOrderInput
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
        comment: data.comment,
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

  // try {
  //   const user = await prisma.user.findUnique({ where: { id: userId } });
  //   if (user?.email) {
  //     await MailService.send({
  //       to: user.email,
  //       subject: `Your Order #${order.id} Invoice`,
  //       html: invoiceTemplate({
  //         orderId: order.id,
  //         items: order.items.map((i) => ({
  //           name: products.find((p) => p.id === i.productId)!.name,
  //           quantity: i.quantity,
  //           price: i.price,
  //           discountPrice: i.discountPrice,
  //         })),
  //         total: totalAmount,
  //         deliveryCharge: data.deliveryCharge,
  //       }),
  //     });
  //   }
  // } catch (err) {
  //   console.error("Failed to send order email:", err);
  // }

  return order;
};

export const createOrderServiceOpen = async (data: CreateOrderInputOpen) => {
  /** 1️⃣ Find user by phone */
  let user = await prisma.user.findFirst({
    where: { phone: data.user.phone },
  });

  /** 2️⃣ If user not found → create */
  if (!user) {
    const hashedPassword = await bcrypt.hash("12345678", 10);

    let emailUser = data.user.email
      ? await prisma.user.findUnique({
          where: { email: data.user.email },
        })
      : null;

    if (emailUser) {
      user = await prisma.user.update({
        where: { id: emailUser.id },
        data: {
          name: data.user.fullName,
          phone: data.user.phone,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: data.user.fullName,
          email: data.user.email || null,
          phone: data.user.phone,
          password: hashedPassword,
          role: "USER",
        },
      });
    }
  }

  /** 3️⃣ Check if shipping address exists */
  let shippingAddress = await prisma.shippingAddress.findFirst({
    where: {
      userId: user.id,
    },
  });

  /** If exists → update */
  if (shippingAddress) {
    shippingAddress = await prisma.shippingAddress.update({
      where: {
        id: shippingAddress.id,
      },
      data: {
        name: data.user.fullName,
        phone: data.user.phone,
        district: data.user.district,
        address: data.user.address,
        isDefault: true,
      },
    });
  } else {
    /** If not exists → create */
    shippingAddress = await prisma.shippingAddress.create({
      data: {
        userId: user.id,
        name: data.user.fullName,
        phone: data.user.phone,
        district: data.user.district,
        address: data.user.address,
        isDefault: true,
      },
    });
  }

  /** 4️⃣ Fetch Products */
  const productIds = data.items.map((i) => i.productId);
  if (productIds.length === 0) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
  });

  if (products.length !== data.items.length) {
    throw new Error("Invalid or inactive product found");
  }

  /** 5️⃣ Calculate Total */
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

  /** 6️⃣ Validate Payment */
  if (data.payment.amount !== totalAmount) {
    throw new Error("Payment amount mismatch");
  }

  /** 7️⃣ Transaction: Order + Payment */
  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        comment: data.comment,
        userId: user.id,
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
        orderId: createdOrder.id,
        method: data.payment.method,
        txId: data.payment.txId?.trim() || null,
        amount: data.payment.amount,
        bkashNumber: data.payment.bkashNumber,
      },
    });

    return createdOrder;
  });

  return order;
};

export const getOrderListService = async (
  userId: string,
  userRole: Role,
  page: number,
  limit: number,
  search: string | undefined
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
  if (search) {
    whereCondition.user = {
      OR: [
        {
          phone: {
            contains: search,
          },
        },

        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
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
        orderNumber: "desc",
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
                shopPrice: true,
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
  payload: any
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

export const updateOrderAmountService = async (
  orderId: string,
  amount: number
) => {
  /* ================= ADMIN ================= */
  return prisma.order.update({
    where: { id: orderId },
    data: {
      totalAmount: amount,
    },
  });
};

export const getOpenOrderService = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: true },
      },
      payment: true,
      shippingAddress: true,
    },
  });

  return order;
};

export const deleteOrderService = async (orderId: string) => {
  try {
    const orderDelete = await prisma.order.delete({ where: { id: orderId } });
    return { success: true, message: "Order is deleted." };
  } catch (error) {
    return { success: false, message: `${error}` };
  }
};
