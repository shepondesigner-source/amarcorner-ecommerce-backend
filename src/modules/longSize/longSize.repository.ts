import { prisma } from "../../config/prisma";

export class LongSizeRepository {
  create(data: { name: string }) {
    return prisma.longSize.create({ data });
  }

  findById(id: string) {
    return prisma.longSize.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return prisma.longSize.findUnique({ where: { name } });
  }

  findAll() {
    return prisma.longSize.findMany({
      orderBy: { name: "asc" },
    });
  }

  update(id: string, data: { name: string }) {
    return prisma.longSize.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return prisma.longSize.delete({ where: { id } });
  }
}
