import { Role, VendorPayoutStatus } from "../../../generated/prisma";
import { prisma } from "../../config/prisma";

export const VendorPayoutService = {
  async create(data: {
    orderId: string;
    shopId: string;
    shopOwnerId: string;
    amount: number;
  }) {
    return prisma.vendorPayout.create({
      data,
    });
  },

  async findAll(userId: string, role: Role) {
    const where =
      role === "SHOP_OWNER"
        ? {
            shopOwnerId: userId,
          }
        : {};

    return prisma.vendorPayout.findMany({
      where,
      include: {
        shop: true,
        order: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async findById(id: string) {
    return prisma.vendorPayout.findUnique({
      where: { id },
      include: {
        shop: true,
        order: true,
        shopOwner: true,
      },
    });
  },

  async updateStatus(
    id: string,
    status: VendorPayoutStatus,
    adminMessage?: string
  ) {
    return prisma.vendorPayout.update({
      where: { id },
      data: {
        status,
        adminMessage,
        paidAt: status === "PAID" ? new Date() : undefined,
      },
    });
  },

  async delete(id: string) {
    return prisma.vendorPayout.delete({
      where: { id },
    });
  },

async bulkPay(data: {
  shopId: string;
  orderIds: string[];
  amount: number;
  adminMessage?: string;
}) {
  const { shopId, orderIds, adminMessage } = data;

  // get shop owner
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { ownerId: true },
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  // get orders
  const orders = await prisma.order.findMany({
    where: {
      id: { in: orderIds },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!orders.length) {
    throw new Error("Orders not found");
  }

  const payoutData = orders.map((order) => {
    let orderAmount = 0;

    order.items.forEach((item) => {
      orderAmount += item.product.shopPrice * item.quantity;
    });

    return {
      shopId,
      shopOwnerId: shop.ownerId,
      orderId: order.id,
      amount: orderAmount,
      status: "PAID" as const,
      adminMessage,
      paidAt: new Date(),
    };
  });

  const result = await prisma.vendorPayout.createMany({
    data: payoutData,
  });

  const totalAmount = payoutData.reduce((sum, p) => sum + p.amount, 0);

  return {
    count: result.count,
    amount: totalAmount,
  };
}
};
