import { prisma } from "../../config/prisma";

export const BannerRepository = {
  create: (data: any) => prisma.banner.create({ data }),
  findAll: () => prisma.banner.findMany({ orderBy: { order: "desc" } }),
  findById: (id: string) => prisma.banner.findUnique({ where: { id } }),
  update: (id: string, data: any) => prisma.banner.update({ where: { id }, data }),
  delete: (id: string) => prisma.banner.delete({ where: { id } }),
};
