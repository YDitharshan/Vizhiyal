// prisma/reset-superadmin.js
// Verifies the superadmin account exists and resets the password to Super@123
// Run: node prisma/reset-superadmin.js
import bcrypt from "bcryptjs";
import prisma  from "../src/config/db.js";

const EMAIL    = "superadmin@vizhiyal.com";
const PASSWORD = "Super@123";

async function main() {
  const hashed = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.upsert({
    where:  { email: EMAIL },
    update: {
      password:  hashed,
      role:      "superadmin",
      isActive:  true,
      sellerStatus: "none",
    },
    create: {
      name:        "Super Admin",
      email:       EMAIL,
      password:    hashed,
      role:        "superadmin",
      isActive:    true,
      sellerStatus: "none",
    },
  });

  console.log("✅  Superadmin ready:");
  console.log(`    ID       : ${user.id}`);
  console.log(`    Email    : ${user.email}`);
  console.log(`    Role     : ${user.role}`);
  console.log(`    Active   : ${user.isActive}`);
  console.log(`    Password : ${PASSWORD}  (just reset)`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
