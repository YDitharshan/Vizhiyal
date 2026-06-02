// prisma/seed.js — seeds the default superadmin account
// Run: node prisma/seed.js   (from the Back-end folder)
import bcrypt  from "bcryptjs";
import prisma  from "../src/config/db.js";

const SUPERADMIN_EMAIL    = "superadmin@vizhiyal.com";
const SUPERADMIN_PASSWORD = "Super@123";
const SUPERADMIN_NAME     = "Super Admin";

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: SUPERADMIN_EMAIL },
  });

  if (existing) {
    console.log(`✅  Superadmin already exists: ${SUPERADMIN_EMAIL}`);
    return;
  }

  const hashed = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);

  await prisma.user.create({
    data: {
      name:         SUPERADMIN_NAME,
      email:        SUPERADMIN_EMAIL,
      password:     hashed,
      role:         "superadmin",
      sellerStatus: "none",
      isActive:     true,
    },
  });

  console.log("🚀  Default superadmin created:");
  console.log(`    Email    : ${SUPERADMIN_EMAIL}`);
  console.log(`    Password : ${SUPERADMIN_PASSWORD}`);
  console.log("    ⚠️  Change the password after first login!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
