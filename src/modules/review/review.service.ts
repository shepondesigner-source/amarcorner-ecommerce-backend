// review/review.service.ts

import { ReviewRepository } from "./review.repository";
import { CreateReview } from "./review.type";

export class ReviewService {
  private repo = new ReviewRepository();

  async createReview(data: CreateReview) {
    const review = await this.repo.create(data);
    return review;
  }

  async updateReview(id: string, data: CreateReview) {
    const review = await this.repo.update(id, data);
    return review;
  }

  async deleteReview(id: string) {
    await this.repo.delete(id);
    return { message: "Review deleted successfully" };
  }
}
