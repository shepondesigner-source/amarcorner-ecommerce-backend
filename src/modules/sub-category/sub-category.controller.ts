import { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import * as service from "./sub-category.service";
import { ApiResponse } from "../../core/response/ApiResponse";

export const create = asyncHandler<Request>(async (req: Request, res: Response) => {
  const category = await service.createCategory(
    req.body,
    req.files?.["icon"]?.[0],
    req.files?.["image"]?.[0]
  );
  res.json(new ApiResponse("Category created", category));
});

export const findAll = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await service.getCategories();
  res.json(new ApiResponse("Category list", categories));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const category = await service.updateCategory(
    req.params.id,
    req.body,
    req.files?.["icon"]?.[0],
    req.files?.["image"]?.[0]
  );
  res.json(new ApiResponse("Category updated", category));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await service.deleteCategory(req.params.id);
  res.json(new ApiResponse("Category deleted"));
});
