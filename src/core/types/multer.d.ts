import "express";

declare module "express" {
  export interface Request {
    files?: {
      [fieldname: string]: Express.Multer.File[];
    };
  }
}
