import { prisma } from "../../config/prisma";

export const OrderRepository = {
  create: (data: any) =>
    prisma.order.create({
      data,
      include: {
        items: true,
        payment: true,
        shippingAddress: true,
      },
    }),

  findAll: () =>
    prisma.order.findMany({
      include: {
        items: true,
        shippingAddress: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    }),

  findById: (id: string) =>
    prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payment: true,
        shippingAddress: true,
      },
    }),

  findByUser: (userId: string) =>
    prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        shippingAddress: true,
      },
      orderBy: { createdAt: "desc" },
    }),

  updateStatus: (id: string, status: any) =>
    prisma.order.update({
      where: { id },
      data: { status },
    }),

  delete: (id: string) =>
    prisma.order.delete({
      where: { id },
    }),
};
