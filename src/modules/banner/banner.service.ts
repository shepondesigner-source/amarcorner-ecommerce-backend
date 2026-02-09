import { BannerRepository } from "./banner.repository";
import { BadRequestError, NotFoundError } from "../../core/errors/HttpError";
import {
  deleteFromCloudinaryByUrl,
  uploadToCloudinary,
} from "../../core/service/cloudinary.service";

export const BannerService = {
  createBanner: async (data: any, image?: Express.Multer.File) => {
    const order = Number(data.order);
    const isActive = Boolean(data.isActive);

    if (!image) throw new BadRequestError("Banner image is required");

    const upload = await uploadToCloudinary(image.buffer, "banners");

    return BannerRepository.create({
      ...data,
      isActive,
      order,
      imageUrl: upload,
    });
  },

  getAllBanners: async () => {
    return BannerRepository.findAll();
  },

  getBannerById: async (id: string) => {
    const banner = await BannerRepository.findById(id);
    if (!banner) throw new NotFoundError("Banner not found");
    return banner;
  },

  updateBanner: async (id: string, data: any, image?: Express.Multer.File) => {
    const banner = await BannerRepository.findById(id);
    const order = Number(data.order);
    const isActive = Boolean(data.isActive);
    if (!banner) throw new NotFoundError("Banner not found");

    let updateData = { ...data, isActive, order };

    if (image) {
      await deleteFromCloudinaryByUrl(banner.imageUrl); // remove old image
      const upload = await uploadToCloudinary(image.buffer, "banners");
      updateData = { ...updateData, imageUrl: upload };
    }

    return BannerRepository.update(id, updateData);
  },

  deleteBanner: async (id: string) => {
    const banner = await BannerRepository.findById(id);
    if (!banner) throw new NotFoundError("Banner not found");

    await deleteFromCloudinaryByUrl(banner.imageUrl);
    return BannerRepository.delete(id);
  },
};
