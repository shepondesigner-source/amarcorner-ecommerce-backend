import { RequestHandler } from "express";
import { ZodObject, ZodTypeAny } from "zod";
import { BadRequestError } from "../errors/HttpError";

export const validate =
  (schema: ZodObject<any, any>): RequestHandler =>
  (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      console.log(parsed);
      req.body = parsed.body ?? req.body;
      next();
    } catch (error: any) {
      console.log(error);
      next(
        new BadRequestError(error.errors?.[0]?.message || "Validation failed")
      );
    }
  };
