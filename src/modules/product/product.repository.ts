import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../config/prisma";
import { productFilterSchema } from "./product.schema";
export interface ProductFilter {
  q?: string;

  shopId?: string;
  shopIds?: string[];

  categoryId?: string;
  subCategoryId?: string;

  minPrice?: number;
  maxPrice?: number;
  discountOnly?: boolean;

  sizeIds?: string[];

  isActive?: boolean;

  skip: number;
  take: number;

  sortBy?: "price" | "createdAt" | "sold" | "name";
  sortOrder?: "asc" | "desc";
}
export class ProductRepository {
  create(data: any) {
    return prisma.product.create({ data });
  }

  findPaginated(where: any, skip: number, take: number) {
    return prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        sizes: true,
        category: true,
        subCategory: true,
      },
    });
  }

  count(where: any) {
    return prisma.product.count({ where });
  }

  update(id: string, data: any) {
    return prisma.product.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return prisma.product.delete({ where: { id } });
  }

  async findWithFilters(filter: ProductFilter) {
    const {
      q,
      shopId,
      shopIds,
      categoryId,
      subCategoryId,
      minPrice,
      maxPrice,
      discountOnly,
      sizeIds,
      isActive,
      skip,
      take,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filter;

    const where: Prisma.ProductWhereInput = {
      isActive,

      shopId: shopIds ? { in: shopIds } : shopId ? shopId : undefined,

      categoryId,
      subCategoryId,

      price:
        minPrice || maxPrice
          ? {
              gte: minPrice,
              lte: maxPrice,
            }
          : undefined,

      discountPrice: discountOnly ? { not: null } : undefined,

      sizes: sizeIds
        ? {
            some: {
              id: { in: sizeIds },
            },
          }
        : undefined,

      OR: q
        ? [
            { name: { contains: q, mode: "insensitive" } },
            { keywords: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    };

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sizes: true,
          category: true,
          subCategory: true,
          shop: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items,
      total,
    };
  }

  async featuredProduct() {
    return prisma.product.findMany({
      where: {
        AND: [{ isFeatured: true }, { isActive: true }],
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        discountPrice: true,
        imageUrls: true,
        rating: true,
      },
    });
  }

  async newProduct(skip: number, take: number) {
    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where: {
          isFeatured: false,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          discountPrice: true,
          imageUrls: true,
          rating: true,
        },
        skip,
        take,
      }),
      prisma.product.count({
        where: {
          isFeatured: false,
          isActive: true,
        },
      }),
    ]);

    return {
      items,
      total,
    };
  }
  async findById(id: string) {
    return prisma.product.findFirst({
      where: { id },

      include: {
        sizes: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
  async getDiscountPricesByIds(productIds: string[]) {
    return prisma.product.findMany({
      where: {
        id: { in: productIds },
        discountPrice: { not: null },
      },
      select: {
        id: true,
        price: true,
        discountPrice: true,
      },
    });
  }

  async getDeliveryCharge(userId: string) {
    const userAddress = await prisma.shippingAddress.findFirst({
      where: { userId: userId, isDefault: true },
    });
    console.log(userAddress);
    if (userAddress?.district === "Dhaka") {
      return { rate: 60 };
    } else {
      return { rate: 110 };
    }
  }

  async getSearchProductList(searchText: string) {
    return prisma.product.findMany({
      where: {
        name: {
          contains: searchText,
          mode: "insensitive", // case-insensitive search
        },
      },
      select: {
        name: true,
        id: true,
      },
    });
  }

  async getProductBySlug(slug: string, skip: number, take: number) {
    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where: {
          slug: slug,
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          discountPrice: true,
          imageUrls: true,
          rating: true,
        },
        skip,
        take,
      }),
      prisma.product.count({
        where: {
          slug: slug,
        },
      }),
    ]);

    return {
      products,
      total,
    };
  }
}
