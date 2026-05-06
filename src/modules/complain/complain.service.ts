import { ComplainRepository } from "./complain.repository";
import { CreateComplain } from "./complain.type";

export class ComplainService {
  private repo = new ComplainRepository();

  async createComplain(data: CreateComplain) {
    return this.repo.create(data);
  }

  async getAllComplains() {
    return this.repo.findAll();
  }

  async deleteComplain(id: number) {
    await this.repo.delete(id);
    return { message: "Complain deleted successfully" };
  }
}
