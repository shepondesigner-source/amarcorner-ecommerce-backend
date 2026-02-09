import { RequestHandler } from "express";
import { UnauthorizedError } from "../errors/HttpError";
import { verifyAccessToken } from "../utils/jwt";
import { Role } from "../../../generated/prisma";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: Role;
    }

    interface Request {
      user?: User;
    }
  }
}

export const authenticate: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Authentication required"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.id,
      role: payload.role,
    };

    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
};
