import { FacebookReviewRepository } from "./facebookReview.repository";
import { BadRequestError, NotFoundError } from "../../core/errors/HttpError";
import {
  deleteFromCloudinaryByUrl,
  uploadToCloudinary,
} from "../../core/service/cloudinary.service";
import { ReviewType } from "../../../generated/prisma";

export const FacebookReviewService = {
  createFacebookReview: async (
    data: { name: string; reviewType?: ReviewType },
    image?: Express.Multer.File,
  ) => {
    if (!image) throw new BadRequestError("Review image is required");

    const imageId = await uploadToCloudinary(image.buffer, "facebook-reviews");

    return FacebookReviewRepository.create({
      name: data.name,
      reviewType: data.reviewType,
      imageId,
    });
  },

  getAllFacebookReviews: async (options: {
    reviewType?: ReviewType;
    page?: number;
    limit?: number;
  }) => {
    const reviews = await FacebookReviewRepository.findAll(options);

    if (options.page === undefined || options.limit === undefined) {
      return { reviews };
    }

    const total = await FacebookReviewRepository.count(options.reviewType);
    return {
      reviews,
      total,
      totalPages: Math.ceil(total / options.limit),
    };
  },

  getFacebookReviewById: async (id: number) => {
    const review = await FacebookReviewRepository.findById(id);
    if (!review) throw new NotFoundError("Facebook review not found");
    return review;
  },

  updateFacebookReview: async (
    id: number,
    data: { name?: string; reviewType?: ReviewType },
    image?: Express.Multer.File,
  ) => {
    const review = await FacebookReviewRepository.findById(id);
    if (!review) throw new NotFoundError("Facebook review not found");

    let updateData: Partial<{
      name: string;
      reviewType: ReviewType;
      imageId: string;
    }> = { ...data };

    if (image) {
      await deleteFromCloudinaryByUrl(review.imageId);
      updateData.imageId = await uploadToCloudinary(
        image.buffer,
        "facebook-reviews",
      );
    }

    return FacebookReviewRepository.update(id, updateData);
  },

  deleteFacebookReview: async (id: number) => {
    const review = await FacebookReviewRepository.findById(id);
    if (!review) throw new NotFoundError("Facebook review not found");

    await deleteFromCloudinaryByUrl(review.imageId);
    return FacebookReviewRepository.delete(id);
  },
};
