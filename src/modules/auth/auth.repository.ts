import { User } from "../../../generated/prisma";
import { prisma } from "../../config/prisma";

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

  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }
}
