import { prisma } from "../../config/prisma";

export class ShopRepository {
  create(data: any) {
    return prisma.shop.create({ data });
  }

  findById(id: string) {
    return prisma.shop.findUnique({
      where: { id },
      include: {
        owner: true,
        products: true,
      },
    });
  }

  findByUserId = (userId: string) => {
    return prisma.shop.findMany({
      where: { ownerId: userId },
    });
  };

  findPaginated(where: any, skip: number, take: number) {
    return prisma.shop.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        imageUrl: true,
        createdAt: true,
        ownerId: true,
        owner: true,
      },
    });
  }

  count(where: any) {
    return prisma.shop.count({ where });
  }

  update(id: string, data: any) {
    // console.log(data);
    return prisma.shop.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return prisma.shop.delete({ where: { id } });
  }
}
