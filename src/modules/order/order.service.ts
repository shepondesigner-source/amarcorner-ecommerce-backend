import { Prisma, Role, VendorPayoutStatus } from "../../../generated/prisma";
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

    const emailUser = data.user.email
      ? await prisma.user.findUnique({
          where: {
            email: data.user.email,
          },
        })
      : null;

    try {
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
    } catch (e: any) {
      if (e?.code === "P2002") {
        user = await prisma.user.findFirst({
          where: {
            phone: data.user.phone,
          },
        });

        if (!user) throw e;
      } else {
        throw e;
      }
    }
  }

  /** 3️⃣ Shipping Address */
  let shippingAddress = await prisma.shippingAddress.findFirst({
    where: {
      userId: user.id,
    },
  });

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

  /** 4️⃣ Products */
  const productIds = data.items.map((i) => i.productId);

  if (!productIds.length) {
    throw new Error("No product selected");
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    include: {
      shop: {
        select: {
          id: true,
          ownerId: true,
        },
      },
    },
  });

  if (products.length !== data.items.length) {
    throw new Error("Invalid or inactive product found");
  }

  /** 5️⃣ Calculate */
  let totalAmount = 0;

  const orderItems = data.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;

    const finalPrice = product.discountPrice ?? product.price;

    totalAmount += finalPrice * item.quantity;

    return {
      productId: product.id,
      imageUrl: item.imageUrl,
      sizeId: item.sizeId || null,
      price: product.price,
      discountPrice: product.discountPrice,
      quantity: item.quantity,
    };
  });

  totalAmount += data.deliveryCharge;

  /** 6️⃣ Validate payment */
  if (Number(data.payment.amount) !== Number(totalAmount)) {
    throw new Error("Payment amount mismatch");
  }

  /** 7️⃣ Transaction */
  const order = await prisma.$transaction(async (tx) => {
    // Create order
    const createdOrder = await tx.order.create({
      data: {
        comment: data.comment || null,
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

    // Create payment
    await tx.payment.create({
      data: {
        orderId: createdOrder.id,
        method: data.payment.method,
        txId: data.payment.txId?.trim() || null,
        amount: data.payment.amount,
        bkashNumber: data.payment.bkashNumber || null,
      },
    });

    /** ====================================
     * Create Vendor Payouts
     * Status = PROCESSING
     * ==================================== */
    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId)!;

      await tx.vendorPayout.create({
        data: {
          orderId: createdOrder.id,

          shopId: product.shop.id,

          shopOwnerId: product.shop.ownerId,

          amount: product.shopPrice * item.quantity,

          imageUrl: item.imageUrl,

          status: VendorPayoutStatus.PENDING,
        },
      });
    }

    return createdOrder;
  });

  return order;
};

export const getOrderListService = async (
  userId: string,
  userRole: Role,
  page: number,
  limit: number,
  search?: string,
  shopId?: string,
  vendorPayoutStatus?: VendorPayoutStatus,
  excludePaidVendorPayment?: boolean,
) => {
  const skip = (page - 1) * limit;

  /** --------------------------------
   * Build dynamic where condition
   * -------------------------------- */

  const whereCondition: Prisma.OrderWhereInput = {
    /** USER only see own orders */
    ...(userRole === "USER" && {
      userId,
    }),

    /** SHOP_OWNER only see own shop orders */
    ...(userRole === "SHOP_OWNER" && {
      status: {
        notIn: ["CANCELLED", "GIFT"],
      },
      items: {
        some: {
          product: {
            shop: {
              ownerId: userId,
            },
          },
        },
      },
    }),

    /** Search by name or phone */
    ...(search && {
      user: {
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
      },
    }),

    /** Filter by shop */
    ...(shopId && {
      items: {
        some: {
          product: {
            shopId,
          },
        },
      },
    }),

    /** Filter by vendor payout status */
    ...(vendorPayoutStatus && {
      vendorPayouts: {
        some: {
          status: vendorPayoutStatus,
        },
      },
    }),

    /** Exclude paid vendor payout */
    ...(excludePaidVendorPayment && {
      vendorPayouts: {
        none: {
          status: "PAID",
        },
      },
    }),
  };

  /** --------------------------------
   * Query
   * -------------------------------- */

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: whereCondition,
      orderBy: {
        orderNumber: "desc",
      },
      skip,
      take: limit,

      include: {
        shippingAddress: true,
        payment: true,

        vendorPayouts: {
          select: {
            status: true,
            amount: true,
            shopId: true,
          },
        },

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

  /** Total orders + total item quantity per user (all-time) */
  const userIds = [...new Set(orders.map((o) => o.userId))];

  const userStats = await prisma.$queryRaw<
    { userId: string; totalOrders: bigint; totalItems: bigint }[]
  >(
    Prisma.sql`
      SELECT
        o."userId",
        COUNT(DISTINCT o.id)          AS "totalOrders",
        COALESCE(SUM(oi.quantity), 0) AS "totalItems"
      FROM "Order" o
      LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
      WHERE o."userId" IN (${Prisma.join(userIds)})
      GROUP BY o."userId"
    `,
  );

  const statsMap = Object.fromEntries(
    userStats.map((r) => [
      r.userId,
      { totalOrders: Number(r.totalOrders), totalItems: Number(r.totalItems) },
    ]),
  );

  const ordersWithUserCount = orders.map((o) => ({
    ...o,
    userTotalOrders: statsMap[o.userId]?.totalOrders ?? 0,
    userTotalItems: statsMap[o.userId]?.totalItems ?? 0,
  }));

  return {
    data: ordersWithUserCount,
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
  console.log(payload.status);
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
      data: {
        status: "CANCELLED",
        vendorPayouts: {
          updateMany: {
            where: { orderId },
            data: { status: VendorPayoutStatus.CANCELLED },
          },
        },
      },
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
    const vendorPayoutUpdate =
      payload.status === "CONFIRMED"
        ? {
            updateMany: {
              where: { orderId },
              data: { status: VendorPayoutStatus.PENDING },
            },
          }
        : payload.status === "CANCELLED"
          ? {
              updateMany: {
                where: { orderId },
                data: { status: VendorPayoutStatus.CANCELLED },
              },
            }
          : undefined;

    return prisma.order.update({
      where: { id: orderId },
      data: {
        status: payload.status,
        vendorPayouts: vendorPayoutUpdate,
      },
    });
  }

  /* ================= ADMIN ================= */
  const adminVendorPayoutUpdate =
    payload.status === "DELIVERED"
      ? {
          updateMany: {
            where: { orderId },
            data: { status: VendorPayoutStatus.PROCESSING },
          },
        }
      : payload.status === "CANCELLED"
        ? {
            updateMany: {
              where: { orderId },
              data: { status: VendorPayoutStatus.CANCELLED },
            },
          }
        : undefined;

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
      vendorPayouts: adminVendorPayoutUpdate,
    },
  });
};

export const updateOrderAmountService = async (
  orderId: string,
  amount: number,
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
        include: { product: true, size:{
          select:{
              name:true
          }} },
        
      },
      payment: true,
      shippingAddress: true,
      
    },
  });

  return order;
};
export const trackOrderService = async (orderNumber: number, phone: string) => {
  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      shippingAddress: {
        phone,
      },
    },
    select: {
      orderNumber: true,
      status: true,
      totalAmount: true,
      deliveryCharge: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
      shippingAddress: {
        select: {
          name: true,
          phone: true,
          district: true,
          address: true,
        },
      },
      payment: {
        select: {
          method: true,
          status: true,
          amount: true,
        },
      },
      items: {
        select: {
          quantity: true,
          price: true,
          discountPrice: true,
          imageUrl: true,
          product: {
            select: {
              name: true,
              slug: true,
            },
          },
          size: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError(
      "Order not found. Please check your order number and phone number.",
      404,
    );
  }

  return order;
};

const orderInclude = {
  shippingAddress: true,
  payment: true,
  items: {
    include: {
      product: { select: { id: true, name: true, slug: true } },
      size: { select: { id: true, name: true } },
    },
  },
} as const;

const dayRange = (offsetDays: number) => {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - offsetDays,
  );
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end, date: start.toISOString().split("T")[0] };
};

export const getDayOrdersService = async (day: "today" | "yesterday") => {
  const { start, end, date } = dayRange(day === "yesterday" ? 1 : 0);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start, lt: end } },
      orderBy: { orderNumber: "desc" },
      include: orderInclude,
    }),
    prisma.order.count({ where: { createdAt: { gte: start, lt: end } } }),
  ]);

  return { data: orders, meta: { total, date } };
};

export const getDaysSummaryService = async () => {
  const today = dayRange(0);
  const yesterday = dayRange(1);

  const [todayOrders, yesterdayOrders] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: today.start, lt: today.end } },
      orderBy: { orderNumber: "desc" },
      include: orderInclude,
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: yesterday.start, lt: yesterday.end } },
      orderBy: { orderNumber: "desc" },
      include: orderInclude,
    }),
  ]);

  return {
    today: {
      data: todayOrders,
      meta: { total: todayOrders.length, date: today.date },
    },
    yesterday: {
      data: yesterdayOrders,
      meta: { total: yesterdayOrders.length, date: yesterday.date },
    },
  };
};

export const exportContactsService = async () => {
  const rows = await prisma.shippingAddress.findMany({
    select: { name: true, phone: true },
    orderBy: { createdAt: "desc" },
  });

  // Keep the most-recent entry per phone number
  const seen = new Map<string, string>();
  for (const { phone, name } of rows) {
    if (!seen.has(phone)) seen.set(phone, name);
  }

  return [...seen.entries()]
    .map(
      ([phone, name]) =>
        `BEGIN:VCARD\r\nVERSION:3.0\r\nFN:${name}\r\nTEL;TYPE=CELL:${phone}\r\nEND:VCARD`,
    )
    .join("\r\n");
};

export const deleteOrderService = async (orderId: string) => {
  try {
    const orderDelete = await prisma.order.delete({ where: { id: orderId } });
    return { success: true, message: "Order is deleted." };
  } catch (error) {
    return { success: false, message: `${error}` };
  }
};
