import { prisma } from "../../config/prisma";

export const create = (data: any) => {
  return prisma.category.create({ data });
};

export const findAll = () => {
  return prisma.category.findMany({
    include: {
      subCategories: true,
    },
  });
};

export const findById = (id: string) => {
  return prisma.category.findUnique({
    where: { id },
    include: { subCategories: true },
  });
};

export const updateById = (id: string, data: any) => {
  return prisma.category.update({
    where: { id },
    data,
  });
};

export const deleteById = (id: string) => {
  return prisma.category.delete({
    where: { id },
  });
};
