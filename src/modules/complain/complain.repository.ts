import { prisma } from "../../config/prisma";
import { CreateComplain } from "./complain.type";

export class ComplainRepository {
  create(data: CreateComplain) {
    return prisma.complain.create({ data });
  }

  findAll() {
    return prisma.complain.findMany({ orderBy: { id: "desc" } });
  }

  delete(id: number) {
    return prisma.complain.delete({ where: { id } });
  }
}
