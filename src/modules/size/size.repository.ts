import { prisma } from "../../config/prisma";

export class SizeRepository {
  create(data: { name: string }) {
    return prisma.size.create({ data });
  }

  findById(id: string) {
    return prisma.size.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return prisma.size.findUnique({ where: { name } });
  }

  findAll() {
    return prisma.size.findMany({
      orderBy: { name: "asc" },
    });
  }

  update(id: string, data: { name: string }) {
    return prisma.size.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return prisma.size.delete({ where: { id } });
  }
}
