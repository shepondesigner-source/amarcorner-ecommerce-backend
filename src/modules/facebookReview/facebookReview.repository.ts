import { prisma } from "../../config/prisma";
import { ReviewType } from "../../../generated/prisma";

export const FacebookReviewRepository = {
  create: (data: { name: string; imageId: string; reviewType?: ReviewType }) =>
    prisma.facebookReview.create({ data }),

  findAll: (options: {
    reviewType?: ReviewType;
    page?: number;
    limit?: number;
  }) => {
    const where = options.reviewType ? { reviewType: options.reviewType } : {};
    const paginated =
      options.page !== undefined && options.limit !== undefined;

    return prisma.facebookReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(paginated && {
        skip: (options.page! - 1) * options.limit!,
        take: options.limit,
      }),
    });
  },

  count: (reviewType?: ReviewType) =>
    prisma.facebookReview.count({
      where: reviewType ? { reviewType } : {},
    }),

  findById: (id: number) =>
    prisma.facebookReview.findUnique({ where: { id } }),

  update: (
    id: number,
    data: Partial<{ name: string; imageId: string; reviewType: ReviewType }>,
  ) => prisma.facebookReview.update({ where: { id }, data }),

  delete: (id: number) => prisma.facebookReview.delete({ where: { id } }),
};
