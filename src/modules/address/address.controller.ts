import { Request, Response } from "express";
import { ShippingAddressService } from "./address.service";

const service = new ShippingAddressService();

export class ShippingAddressController {
  static async create(req: Request, res: Response) {
    const userId = req.user?.id || "";
    const address = await service.create(userId, req.body);
    res.status(201).json(address);
  }

  static async getMy(req: Request, res: Response) {
    const userId = req.user?.id || "";

    const data = await service.getMyAddresses(userId);
    res.json(data);
  }

  static async update(req: Request, res: Response) {
    const address = await service.update(req.params.id, req.body, req.user!!);
    res.json(address);
  }

  static async updateDefault(req: Request, res: Response) {
    const address = await service.updateDefault(req.params.id, req.user!!);
    res.json(address);
  }

  static async delete(req: Request, res: Response) {
    await service.delete(req.params.id, req.user!!);
    res.status(204).send();
  }
}
