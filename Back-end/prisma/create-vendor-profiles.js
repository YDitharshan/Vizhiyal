import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find all approved sellers with no VendorProfile
  const sellers = await prisma.user.findMany({
    where: {
      role: "seller",
      sellerStatus: "approved",
      vendorProfile: null, // no profile exists yet
    },
    select: { id: true, name: true, email: true },
  });

  if (sellers.length === 0) {
    console.log(
      " All approved sellers already have a VendorProfile. Nothing to do.",
    );
    return;
  }

  console.log(
    `🔧  Found ${sellers.length} approved seller(s) without a VendorProfile:`,
  );
  sellers.forEach((s) => console.log(`    • ${s.name} (${s.email})`));

  // Create a skeleton profile for each
  const created = await prisma.vendorProfile.createMany({
    data: sellers.map((s) => ({
      userId: s.id,
      businessName: s.name, // seller can update this from their dashboard
      category: "General",
      description: "",
      location: "",
      portfolio: [],
    })),
    skipDuplicates: true, // safety — don't fail if one already exists
  });

  console.log(`✅  Created ${created.count} VendorProfile(s) successfully.`);
  console.log(
    "    Sellers can now update their business details from the Profile tab.",
  );
}

main()
  .catch((err) => {
    console.error("❌  Script failed:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
