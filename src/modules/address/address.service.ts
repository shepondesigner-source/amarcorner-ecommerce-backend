import { ShippingAddressRepository } from "./address.repository";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../core/errors/HttpError";
import { Role } from "../../../generated/prisma";
import { CreateAddressDto, UpdateAddressDto } from "./address.schema";

type AuthUser = {
  id: string;
  role: Role;
};

export class ShippingAddressService {
  private repo = new ShippingAddressRepository();

  async create(userId: string, data: CreateAddressDto) {
    const count = await this.repo.countByUser(userId);

    if (count >= 2) {
      throw new BadRequestError(
        "You cannot add more than 2 shipping addresses",
      );
    }

    return this.repo.create(userId, data);
  }

  async getMyAddresses(userId: string) {
    return this.repo.findByUser(userId);
  }

  async update(
    addressId: string,
    data: UpdateAddressDto,
    user: AuthUser,
  ) {
    const address = await this.repo.findById(addressId);

    if (!address) {
      throw new NotFoundError("Shipping address not found");
    }

    if (user.role !== Role.ADMIN && address.userId !== user.id) {
      throw new ForbiddenError("You are not allowed to update this address");
    }

    return this.repo.update(addressId, data);
  }
  async updateDefault(
    addressId: string,
    user: AuthUser,
  ) {
    const address = await this.repo.findById(addressId);

    if (!address) {
      throw new NotFoundError("Shipping address not found");
    }

    if (user.role !== Role.USER && address.userId !== user.id) {
      throw new ForbiddenError("You are not allowed to update this address");
    }

    return this.repo.updateDefault(addressId,user.id);
  }

  async delete(addressId: string, user: AuthUser) {
    const address = await this.repo.findById(addressId);

    if (!address) {
      throw new NotFoundError("Shipping address not found");
    }

    if (user.role !== Role.ADMIN && address.userId !== user.id) {
      throw new ForbiddenError("You are not allowed to delete this address");
    }

    return this.repo.delete(addressId);
  }
}
