const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	allowExitOnIdle: true,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Exposed for integration tests to fully close adapter-owned resources.
prisma.$pool = pool;

module.exports = prisma;
