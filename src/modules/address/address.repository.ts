import { prisma } from "../../config/prisma";
import { ForbiddenError, NotFoundError } from "../../core/errors/HttpError";

export class ShippingAddressRepository {
  create(userId: string, data: any) {
    return prisma.shippingAddress.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  findByUser(userId: string) {
    return prisma.shippingAddress.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  findById(id: string) {
    return prisma.shippingAddress.findUnique({ where: { id } });
  }

  countByUser(userId: string) {
    return prisma.shippingAddress.count({ where: { userId } });
  }

  update(id: string, data: any) {
    return prisma.shippingAddress.update({
      where: { id },
      data,
    });
  }

  async updateDefault(addressId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const address = await tx.shippingAddress.findUnique({
        where: { id: addressId },
      });

      if (!address) {
        throw new NotFoundError("Shipping address not found");
      }

      if (address.userId !== userId) {
        throw new ForbiddenError("You cannot modify this address");
      }

      // 1️⃣ unset all defaults for this user
      await tx.shippingAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      // 2️⃣ set selected address as default
      return tx.shippingAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }

  delete(id: string) {
    return prisma.shippingAddress.delete({ where: { id } });
  }
}
