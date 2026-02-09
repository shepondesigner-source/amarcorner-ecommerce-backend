import { RequestHandler } from "express";
import { ForbiddenError } from "../errors/HttpError";

export const authorize = (...allowedRoles: string[]): RequestHandler => {
  return (req, res, next) => {
    const authReq = req;

    if (!authReq.user) {
      return next(new ForbiddenError("Access denied"));
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      return next(new ForbiddenError("You do not have permission"));
    }

    next();
  };
};
