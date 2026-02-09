import * as repo from "./category.repository";
import { NotFoundError } from "../../core/errors/HttpError";
import {
  deleteFromCloudinaryByUrl,
  uploadToCloudinary,
} from "../../core/service/cloudinary.service";

export const createCategory = async (
  data: any,
  iconFile?: Express.Multer.File,
  imageFile?: Express.Multer.File,
) => {
  const iconUrl = iconFile
    ? await uploadToCloudinary(iconFile.buffer, "categories/icons")
    : "";

  const imageUrl = imageFile
    ? await uploadToCloudinary(imageFile.buffer, "categories/images")
    : "";
  return repo.create({
    ...data,
    iconUrl,
    imageUrl,
  });
};

export const getCategories = async () => {
  return repo.findAll();
};

export const getCategoryById = async (id: string) => {
  return repo.findById(id);
};

export const updateCategory = async (
  id: string,
  data: any,
  iconFile?: Express.Multer.File,
  imageFile?: Express.Multer.File,
) => {
  const category = await repo.findById(id);

  if (!category) throw new NotFoundError("Category not found");

  if (iconFile && category.iconUrl) {
    await deleteFromCloudinaryByUrl(category.iconUrl);
    data.iconUrl = await uploadToCloudinary(
      iconFile.buffer,
      "categories/icons",
    );
  }

  if (imageFile && category.imageUrl) {
    await deleteFromCloudinaryByUrl(category.imageUrl);
    data.imageUrl = await uploadToCloudinary(
      imageFile.buffer,
      "categories/images",
    );
  }

  return repo.updateById(id, { ...data });
};

export const deleteCategory = async (id: string) => {
  const category = await repo.findById(id);
  if (!category) throw new NotFoundError("Category not found");

  if (category.iconUrl) await deleteFromCloudinaryByUrl(category.iconUrl);
  if (category.imageUrl) await deleteFromCloudinaryByUrl(category.imageUrl);

  return repo.deleteById(id);
};
