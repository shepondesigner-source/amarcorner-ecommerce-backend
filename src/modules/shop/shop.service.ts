import { Role } from "../../../generated/prisma";
import {
  deleteFromCloudinaryByUrl,
  uploadToCloudinary,
} from "../../core/service/cloudinary.service";
import { ShopRepository } from "./shop.repository";

export class ShopService {
  private repo = new ShopRepository();

  async create(
    user: { id: string; role: Role },
    data: any,
    file?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;
    if (user.role === "SHOP_OWNER") {
      data.ownerId = user.id;
    }
    if (file) {
      imageUrl = await uploadToCloudinary(file.buffer, "shops");
    }

    return this.repo.create({
      ...data,
      imageUrl,
    });
  }

  async findPaginated(query: any, user: { id: string; role: Role }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    // if (query.ownerId) where.ownerId = query.ownerId;
    if (user.role === "SHOP_OWNER") {
      where.ownerId = user.id;
    }

    const [data, total] = await Promise.all([
      this.repo.findPaginated(where, skip, limit),
      this.repo.count(where),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, data: any, file?: Express.Multer.File) {
    const shop = await this.repo.findById(id);
    if (!shop) throw new Error("Shop not found");

    let imageUrl = shop.imageUrl;

    if (file) {
      if (imageUrl) {
        await deleteFromCloudinaryByUrl(imageUrl);
      }

      imageUrl = await uploadToCloudinary(file.buffer, "shops");
    }

    return this.repo.update(id, {
      ...data,
      imageUrl,
    });
  }

  async delete(id: string) {
    const shop = await this.repo.findById(id);
    if (!shop) return;

    if (shop.imageUrl) {
      await deleteFromCloudinaryByUrl(shop.imageUrl);
    }

    await this.repo.delete(id);
  }

  async findByUserId(userId: string) {
    return this.repo.findByUserId(userId);
  }
}
