import { User } from "../../../generated/prisma";
import { prisma } from "../../config/prisma";
import { updateById } from "../category/category.repository";

export class AuthRepository {
  async createUser(data: Partial<User>): Promise<User> {
    const user = prisma.user.create({
      data: {
        name: data.name!,
        email: data.email!,
        password: data.password!,
        phone: data.phone!,
        role: data.role!,
      },
    });
    return user;
  }
  async updatePassword(id: string, password: string) {
    const user = await prisma.user.update({
      where: { id },
      data: { password }, // make sure to hash it before saving!
    });

    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }
}
