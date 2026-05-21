require("dotenv").config();
const prisma = require("./src/prisma");

(async () => {
  const rows = await prisma.$queryRaw`
    SELECT source, "radiusKm", COUNT(*)::int AS total,
           MIN("searchedAt") AS primera, MAX("searchedAt") AS ultima
    FROM "SearchEvent"
    WHERE "radiusKm" IS NOT NULL AND source <> 'map'
    GROUP BY source, "radiusKm"
    ORDER BY source, "radiusKm" ASC
  `;
  console.table(rows);
  await prisma.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
