import { Request, Response, NextFunction } from "express";
import { ComplainService } from "./complain.service";

export class ComplainController {
  private service = new ComplainService();

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const complain = await this.service.createComplain(req.body);

      res.status(201).json({
        success: true,
        message: "Complain submitted successfully",
        data: complain,
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const complains = await this.service.getAllComplains();

      res.status(200).json({
        success: true,
        data: complains,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const result = await this.service.deleteComplain(id);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
}
