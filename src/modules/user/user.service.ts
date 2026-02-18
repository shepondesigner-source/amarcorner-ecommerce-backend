import bcrypt from "bcryptjs";
import { UserRepository } from "./user.repository";

export class UserService {
  private userRepo = new UserRepository();

  async createUser(payload: any) {
    const existingUser = await this.userRepo.findByEmail(payload.email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    return this.userRepo.create({
      ...payload,
      password: hashedPassword,
    });
  }

  getUsers() {
    return this.userRepo.findAll();
  }

  getAuthenticateUser(userId: string) {
    return this.userRepo.findAuthenticateUser(userId);
  }

  async getUserById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new Error("User not found");
    return user;
  }

  updateUser(id: string, payload: any) {
    return this.userRepo.update(id, payload);
  }

  deleteUser(id: string) {
    return this.userRepo.delete(id);
  }

  async filterUsers(query: any) {
    const {
      name,
      email,
      phone,
      role,
      emailVerified,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;
  
    const where: any = {};
  
    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive",
      };
    }
  
    if (email) {
      where.email = {
        contains: email,
        mode: "insensitive",
      };
    }
  
    if (phone) {
      where.phone = {
        contains: phone,
      };
    }
  
    if (role) {
      where.role = role;
    }
  
    if (emailVerified !== undefined) {
      where.emailVerified = emailVerified === "true";
    }
  
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
  
    const skip = (Number(page) - 1) * Number(limit);
  
    const [data, total] = await Promise.all([
      this.userRepo.filter(where, skip, Number(limit)),
      this.userRepo.count(where),
    ]);
  
    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
      },
    };
  }
  
}
