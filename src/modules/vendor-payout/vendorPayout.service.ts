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
};
