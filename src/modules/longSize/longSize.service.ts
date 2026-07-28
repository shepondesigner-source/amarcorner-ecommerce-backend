import { LongSizeRepository } from "./longSize.repository";

export class LongSizeService {
  private longSizeRepo = new LongSizeRepository();

  async createLongSize(name: string) {
    const existing = await this.longSizeRepo.findByName(name);
    if (existing) {
      throw new Error("Long size already exists");
    }
    return this.longSizeRepo.create({ name });
  }

  getAllLongSizes() {
    return this.longSizeRepo.findAll();
  }

  async getLongSizeById(id: string) {
    const longSize = await this.longSizeRepo.findById(id);
    if (!longSize) throw new Error("Long size not found");
    return longSize;
  }

  async updateLongSize(id: string, name: string) {
    const existing = await this.longSizeRepo.findByName(name);
    if (existing && existing.id !== id) {
      throw new Error("Long size name already in use");
    }
    return this.longSizeRepo.update(id, { name });
  }

  deleteLongSize(id: string) {
    return this.longSizeRepo.delete(id);
  }
}
