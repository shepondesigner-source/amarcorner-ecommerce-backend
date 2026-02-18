// review/review.repository.ts
import { prisma } from "../../config/prisma";
import { CreateReview } from "./review.type";

export class ReviewRepository {
  create(data: CreateReview) {
    return prisma.review.create({ data });
  }
  update(id: string, data: CreateReview) {
    return prisma.review.update({ where: { id }, data });
  }
  delete(id: string) {
    return prisma.review.delete({ where: { id } });
  }
}
