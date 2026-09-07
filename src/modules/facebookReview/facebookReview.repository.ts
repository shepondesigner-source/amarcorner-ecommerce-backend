import { prisma } from "../../config/prisma";
import { ReviewType } from "../../../generated/prisma";

export const FacebookReviewRepository = {
  create: (data: { name: string; imageId: string; reviewType?: ReviewType }) =>
    prisma.facebookReview.create({ data }),

  findAll: (reviewType?: ReviewType) =>
    prisma.facebookReview.findMany({
      where: reviewType ? { reviewType } : {},
      orderBy: { createdAt: "desc" },
    }),

  findById: (id: number) =>
    prisma.facebookReview.findUnique({ where: { id } }),

  update: (
    id: number,
    data: Partial<{ name: string; imageId: string; reviewType: ReviewType }>,
  ) => prisma.facebookReview.update({ where: { id }, data }),

  delete: (id: number) => prisma.facebookReview.delete({ where: { id } }),
};
