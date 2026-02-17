import { Request, Response } from "express";
import { ProductService } from "./product.service";

const service = new ProductService();

export const createProduct = async (req: Request, res: Response) => {
  const files = Array.isArray(req.files) ? req.files : [];

  const product = await service.create(req.body, files);
  res.status(201).json(product);
};

export const createVendorProduct = async (req: Request, res: Response) => {
  const files = Array.isArray(req.files) ? req.files : [];

  const product = await service.createVendorProduct(req.body, files);
  res.status(201).json(product);
};

export const getProducts = async (req: Request, res: Response) => {
  const result = await service.findPaginated(req.user!, req.query);
  res.json(result);
};

export const updateProduct = async (req: Request, res: Response) => {
  const files = Array.isArray(req.files) ? req.files : [];

  const product = await service.update(req.params.id, req.body, files);
  res.json(product);
};

export const deleteProduct = async (req: Request, res: Response) => {
  await service.delete(req.params.id);
  res.status(204).send();
};

export const getFeaturedProduct = async (req: Request, res: Response) => {
  const featured = await service.getFeaturedProduct();
  res.json(featured);
};

export const getdProductDeliveryCharge = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user?.id;
  if (userId) {
    const featured = await service.getDeliveryRate(userId);
    res.json(featured);
  }
};

export const getNewProducts = async (req: Request, res: Response) => {
  const result = await service.newProduct(req.query);
  res.json(result);
};

export const getProductsBySlug = async (req: Request, res: Response) => {
  const { slug, page = "1", limit = "10" } = req.query;
  if (!slug) {
    return res.status(400).json({
      message: "slug is required",
    });
  }

  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  if (isNaN(pageNumber) || isNaN(limitNumber)) {
    return res.status(400).json({
      message: "page and limit must be numbers",
    });
  }
  const result = await service.getbySlug(
    slug as string,
    pageNumber,
    limitNumber,
  );

  return res.json(result);
};

export const productById = async (req: Request, res: Response) => {
  const featured = await service.getbyId(req.params.id);
  res.json(featured);
};

export const productBySearchText = async (req: Request, res: Response) => {
  const { searchText } = req.body;
  const serchProducts = await service.getSearchProductList(searchText);
  res.json(serchProducts);
};

export const getDiscountPricesByIds = async (req: Request, res: Response) => {
  const { productIds } = req.body as { productIds: string[] };

  if (!productIds || !productIds.length) {
    return res.status(400).json({
      message: "productIds array is required",
    });
  }

  const products = await service.getDiscountPricesByIds(productIds);

  res.json(products);
};
