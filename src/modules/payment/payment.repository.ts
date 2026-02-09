import { prisma } from "../../config/prisma";

export const PaymentRepository = {
  create: (data: any) =>
    prisma.payment.create({
      data,
      include: { order: true },
    }),

  findAll: (where: any) =>
    prisma.payment.findMany({
      where,
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    shop: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

  findById: (id: string) =>
    prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    }),

  update: (id: string, data: any) =>
    prisma.payment.update({
      where: { id },
      data,
    }),
};
