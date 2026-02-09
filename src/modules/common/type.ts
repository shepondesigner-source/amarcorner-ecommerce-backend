import { Role } from "../../../generated/prisma";

export interface UserCookie {
  id: string;
  role: Role;
}
