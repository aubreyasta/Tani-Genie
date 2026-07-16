import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/client/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const { DATABASE_URL: databaseUrl, NODE_ENV: nodeEnv } = process.env;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({
    adapter,
    log: nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

const { NODE_ENV: nodeEnv } = process.env;

if (nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}
