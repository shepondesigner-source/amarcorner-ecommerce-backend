import { prisma } from "../../config/prisma";

export const create = (data: any) => {
  return prisma.subCategory.create({ data });
};

export const findAll = () => {
  return prisma.subCategory.findMany({
    include: {
      category: true,
    },
  });
};

export const findById = (id: string) => {
  return prisma.subCategory.findUnique({ where: { id } });
};

export const updateById = (id: string, data: any) => {
  return prisma.subCategory.update({
    where: { id },
    data,
  });
};

export const deleteById = (id: string) => {
  return prisma.subCategory.delete({
    where: { id },
  });
};
