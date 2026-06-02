import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  const gigs = await prisma.gig.findMany({ select: { id: true } });
  for (const g of gigs) {
    const s = await prisma.review.aggregate({
      where:  { gigId: g.id, removed: false },
      _avg:   { rating: true },
      _count: { rating: true },
    });
    await prisma.gig.update({
      where: { id: g.id },
      data: {
        avgRating:    s._avg.rating   ?? 0,
        totalReviews: s._count.rating ?? 0,
      },
    });
  }
  console.log("Done backfilling", gigs.length, "gigs");
  await prisma.$disconnect();
}

run().catch(console.error);
