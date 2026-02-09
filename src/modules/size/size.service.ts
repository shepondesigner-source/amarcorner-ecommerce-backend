import { SizeRepository } from "./size.repository";

export class SizeService {
  private sizeRepo = new SizeRepository();

  async createSize(name: string) {
    const existing = await this.sizeRepo.findByName(name);
    if (existing) {
      throw new Error("Size already exists");
    }
    return this.sizeRepo.create({ name });
  }

  getAllSizes() {
    return this.sizeRepo.findAll();
  }

  async getSizeById(id: string) {
    const size = await this.sizeRepo.findById(id);
    if (!size) throw new Error("Size not found");
    return size;
  }

  async updateSize(id: string, name: string) {
    const existing = await this.sizeRepo.findByName(name);
    if (existing && existing.id !== id) {
      throw new Error("Size name already in use");
    }
    return this.sizeRepo.update(id, { name });
  }

  deleteSize(id: string) {
    return this.sizeRepo.delete(id);
  }
}
