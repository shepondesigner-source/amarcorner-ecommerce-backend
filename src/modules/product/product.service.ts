import { prisma } from "../../config/prisma";
import {
  deleteFromCloudinaryByUrl,
  uploadToCloudinary,
} from "../../core/service/cloudinary.service";
import { UserCookie } from "../common/type";
import { ProductRepository } from "./product.repository";

export class ProductService {
  private repo = new ProductRepository();

  async create(data: any, files?: Express.Multer.File[]) {
    const { sizeIds, ...remainingData } = data;
    const imageUrls: string[] = [];

    if (files?.length) {
      for (const file of files) {
        const publicId = await uploadToCloudinary(file.buffer, "products");
        imageUrls.push(publicId);
      }
    }

    return this.repo.create({
      ...remainingData,
      imageUrls,
      sizes: sizeIds
        ? { connect: sizeIds.map((id: string) => ({ id })) }
        : undefined,
    });
  }

  async createVendorProduct(data: any, files?: Express.Multer.File[]) {
    const { sizeIds, ...remainingData } = data;
    const imageUrls: string[] = [];

    if (files?.length) {
      for (const file of files) {
        const publicId = await uploadToCloudinary(file.buffer, "products");
        imageUrls.push(publicId);
      }
    }

    return this.repo.create({
      ...remainingData,
      imageUrls,
      sizes: sizeIds
        ? { connect: sizeIds.map((id: string) => ({ id })) }
        : undefined,
    });
  }

  async findPaginated(user: UserCookie, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    if (user?.role === "SHOP_OWNER") {
      const shops = await prisma.shop.findMany({
        where: {
          ownerId: user.id,
        },
        select: {
          id: true,
        },
      });

      const shopIds = shops.map((s) => s.id);

      // If owner has no shops → return empty result early
      if (shopIds.length === 0) {
        return {
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        };
      }

      query.shopIds = shopIds;
    }
    const result = await this.repo.findWithFilters({
      q: query.q,

      shopId: query.shopId,
      shopIds: query.shopIds
        ? Array.isArray(query.shopIds)
          ? query.shopIds
          : [query.shopIds]
        : undefined,

      categoryId: query.categoryId,
      subCategoryId: query.subCategoryId,

      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,

      discountOnly: query.discountOnly === "true",

      sizeIds: query.sizeIds
        ? Array.isArray(query.sizeIds)
          ? query.sizeIds
          : [query.sizeIds]
        : undefined,

      isActive:
        query.isActive !== undefined ? query.isActive === "true" : undefined,

      sortBy: query.sortBy || "createdAt",
      sortOrder: query.sortOrder === "asc" ? "asc" : "desc",

      skip,
      take: limit,
    });

    return {
      data: result.items,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }
  async findVendorPaginated(user: UserCookie, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    if (user.role === "SHOP_OWNER") {
      const shops = await prisma.shop.findMany({
        where: {
          ownerId: user.id,
        },
        select: {
          id: true,
        },
      });

      const shopIds = shops.map((s) => s.id);

      // If owner has no shops → return empty result early
      if (shopIds.length === 0) {
        return {
          data: [],
          meta: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        };
      }

      query.shopIds = shopIds;
    }

    const result = await this.repo.findWithFilters({
      q: query.q,

      shopId: query.shopId,
      shopIds: query.shopIds
        ? Array.isArray(query.shopIds)
          ? query.shopIds
          : [query.shopIds]
        : undefined,

      categoryId: query.categoryId,
      subCategoryId: query.subCategoryId,

      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,

      discountOnly: query.discountOnly === "true",

      sizeIds: query.sizeIds
        ? Array.isArray(query.sizeIds)
          ? query.sizeIds
          : [query.sizeIds]
        : undefined,

      isActive:
        query.isActive !== undefined ? query.isActive === "true" : undefined,

      sortBy: query.sortBy || "createdAt",
      sortOrder: query.sortOrder === "asc" ? "asc" : "desc",

      skip,
      take: limit,
    });

    return {
      data: result.items,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  async newProduct(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const result = await this.repo.newProduct(skip, limit);

    return {
      data: result,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  async update(id: string, data: any, files: Express.Multer.File[]) {
    const product = await this.repo.findById(id);
    if (!product) throw new Error("Product not found");

    /* ---------- 1. Images client wants to keep (SAFE DEFAULT) ---------- */
    const keepImages: string[] = Array.isArray(data.existingImageUrls)
      ? data.existingImageUrls
      : product.imageUrls; // ⛑ fallback → prevents auto delete

    /* ---------- 2. Images to delete ---------- */
    const imagesToDelete = product.imageUrls.filter(
      (img) => !keepImages.includes(img)
    );

    for (const img of imagesToDelete) {
      await deleteFromCloudinaryByUrl(img);
    }

    /* ---------- 3. Upload new images ---------- */
    const uploadedImages: string[] = [];

    if (files?.length) {
      for (const file of files) {
        const url = await uploadToCloudinary(file.buffer, "products");
        uploadedImages.push(url);
      }
    }

    /* ---------- 4. Final image list ---------- */
    const finalImages = [...keepImages, ...uploadedImages];

    /* ---------- 5. Size handling ---------- */
    const sizeIds =
      data.sizeIds && typeof data.sizeIds === "string"
        ? JSON.parse(data.sizeIds)
        : data.sizeIds;

    /* ---------- 6. Clean payload ---------- */
    delete data.existingImageUrls;
    delete data.sizeIds;

    /* ---------- 7. Update product ---------- */
    return this.repo.update(id, {
      ...data,
      imageUrls: finalImages,
      sizes: sizeIds
        ? { set: sizeIds.map((id: string) => ({ id })) }
        : undefined,
    });
  }

  async delete(id: string) {
    const product = await this.repo.findById(id);
    if (!product) return;

    for (const img of product.imageUrls) {
      await deleteFromCloudinaryByUrl(img);
    }

    await this.repo.delete(id);
  }

  async getFeaturedProduct() {
    const result = await this.repo.featuredProduct();
    return result;
  }

  async getbyId(id: string) {
    const product = await this.repo.findById(id);
    return product;
  }
  async getbySlug(slug: string, page: number, limit: number) {
    const pages = Number(page) || 1;
    const limits = Number(limit) || 10;
    const skip = (pages - 1) * limits;
    const product = await this.repo.getProductBySlug(slug, skip, limits);
    return product;
  }

  async getDiscountPricesByIds(productIds: string[]) {
    const product = await this.repo.getDiscountPricesByIds(productIds);
    return product;
  }

  async getDeliveryRate(id: string) {
    const rate = await this.repo.getDeliveryCharge(id);
    return rate;
  }

  async getSearchProductList(searchText: string) {
    const product = await this.repo.getSearchProductList(searchText);
    return product;
  }
}
