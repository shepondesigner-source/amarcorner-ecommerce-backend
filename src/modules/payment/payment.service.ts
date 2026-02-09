import { PaymentRepository } from "./payment.repository";
import { prisma } from "../../config/prisma";
import { NotFoundError, ForbiddenError } from "../../core/errors/HttpError";
import { Role } from "../../../generated/prisma";

export const PaymentService = {
  createUserPayment: async (
    userId: string,
    data: {
      orderId: string;
      amount: number;
      method: string;
      txId: string;
    }
  ) => {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) throw new NotFoundError("Order not found");

    if (order.userId !== userId) {
      throw new ForbiddenError("Access denied");
    }

    const payment = await PaymentRepository.create({
      amount: data.amount,
      method: data.method,
      txId: data.txId,
      status: "PENDING",
      type: "USER_PAYMENT",
      userId,
      orderId: order.id,
    });

    return payment;
  },

  getAllPayments: async (user: { id: string; role: Role }) => {
    // ✅ ADMIN → all payments
    if (user.role === Role.ADMIN) {
      return PaymentRepository.findAll({});
    }

    // ✅ USER → only own payments
    if (user.role === Role.USER) {
      return PaymentRepository.findAll({
        order: {
          userId: user.id,
        },
      });
    }

    // ✅ SHOP_OWNER → payments for own shop products
    if (user.role === Role.SHOP_OWNER) {
      return PaymentRepository.findAll({
        order: {
          items: {
            some: {
              product: {
                shop: {
                  ownerId: user.id,
                },
              },
            },
          },
        },
      });
    }

    throw new ForbiddenError("Access denied");
  },

  getPaymentById: async (id: string, user?: any) => {
    const payment = await PaymentRepository.findById(id);
    if (!payment) throw new NotFoundError("Payment not found");

    // if (user?.role !== "ADMIN" && payment.userId !== user?.id) {
    //   throw new ForbiddenError("Access denied");
    // }

    return payment;
  },

  // getUserPayments: async (userId: string) => {
  //   return PaymentRepository.findByUser(userId);
  // },

  updatePaymentStatus: async (id: string, status: string) => {
    const payment = await PaymentRepository.findById(id);
    if (!payment) throw new NotFoundError("Payment not found");

    // If payment succeeds → mark order PAID
    if (status === "SUCCESS" && payment.orderId) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "DELIVERED" },
      });
    }

    return PaymentRepository.update(id, { status });
  },
};
