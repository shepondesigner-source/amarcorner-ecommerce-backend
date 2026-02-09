import { prisma } from "../../config/prisma";
import { findById } from "../category/category.repository";

export class UserRepository {
  create(data: any) {
    return prisma.user.create({ data });
  }

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  findAll() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  findAuthenticateUser(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });
  }

  update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }
}
