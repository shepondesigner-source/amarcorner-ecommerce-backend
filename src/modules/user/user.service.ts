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
}
