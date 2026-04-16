import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@storesgo.com";
  const plainPassword = "password";

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {
      password: passwordHash,
    },
    create: {
      email,
      password: passwordHash,
      role: "admin",
    },
  });

  console.log("Admin user created or updated:", {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });
}

main()
  .catch((err) => {
    console.error("Error seeding admin user:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
