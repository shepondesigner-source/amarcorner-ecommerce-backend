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
    const { shopId, orderIds, amount, adminMessage } = data;

    // find payouts
    const payouts = await prisma.vendorPayout.findMany({
      where: {
        shopId,
        orderId: { in: orderIds },
        status: VendorPayoutStatus.PENDING,
      },
    });

    if (!payouts.length) {
      throw new Error("No pending payouts found");
    }

    const payoutIds = payouts.map((p) => p.id);

    await prisma.vendorPayout.updateMany({
      where: {
        id: { in: payoutIds },
      },
      data: {
        status: VendorPayoutStatus.PAID,
        adminMessage,
        paidAt: new Date(),
      },
    });

    return {
      count: payoutIds.length,
      amount,
    };
  },
};
