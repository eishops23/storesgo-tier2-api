import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const EMAIL = "admin@storesgo.com";
  const PASSWORD = "Admin123!";

  const existing = await prisma.adminUser.findUnique({
    where: { email: EMAIL },
  });

  if (existing) {
    console.log("Admin already exists:", EMAIL);
    return;
  }

  const hashed = await bcrypt.hash(PASSWORD, 10);

  await prisma.adminUser.create({
    data: {
      email: EMAIL,
      password: hashed,
      role: "superadmin",
    },
  });

  console.log("Superadmin created:", EMAIL);
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());

