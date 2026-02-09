import bcrypt from "bcryptjs";
import { Role } from "../generated/prisma";
import { prisma } from "./config/prisma";

async function main() {
  const hashedPassword = await bcrypt.hash("12345678", 10);

  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      phone: "01700000000",
      role: Role.ADMIN,
      emailVerified: true,
      address: "Dhaka, Bangladesh",
    },
  });

  console.log("Seeded user:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
