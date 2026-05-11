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
            status: {
              not: VendorPayoutStatus.CANCELLED,
            },
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
    adminMessage?: string,
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

    // =====================================
    // 1️⃣ Check Shop
    // =====================================
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!shop) {
      throw new Error("Shop not found");
    }

    // =====================================
    // 2️⃣ Find Pending Payout Rows
    // =====================================
    const payouts = await prisma.vendorPayout.findMany({
      where: {
        shopId,
        orderId: { in: orderIds },
        status: {
          in: [VendorPayoutStatus.PENDING, VendorPayoutStatus.PROCESSING],
        },
      },
    });

    if (!payouts.length) {
      throw new Error("No pending payouts found");
    }

    // =====================================
    // 3️⃣ Calculate Total
    // =====================================
    const totalAmount = payouts.reduce((sum, row) => sum + row.amount, 0);

    // Optional verify frontend amount
    if (Number(amount) !== Number(totalAmount)) {
      throw new Error("Amount mismatch");
    }

    // =====================================
    // 4️⃣ Update Existing Rows
    // =====================================
    const result = await prisma.vendorPayout.updateMany({
      where: {
        shopId,
        orderId: { in: orderIds },
        status: {
          in: [VendorPayoutStatus.PENDING, VendorPayoutStatus.PROCESSING],
        },
      },
      data: {
        status: VendorPayoutStatus.PAID,
        adminMessage: adminMessage || null,
        paidAt: new Date(),
      },
    });

    // =====================================
    // 5️⃣ Response
    // =====================================
    return {
      count: result.count,
      amount: totalAmount,
      message: "Vendor payouts marked as PAID successfully",
    };
  },
};
