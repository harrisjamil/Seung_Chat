import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/lib/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;

  // Dev hot reload keeps globalThis, but Prisma client must be recreated after schema changes.
  if (cached && 'loginAlert' in cached) {
    return cached;
  }

  if (cached) {
    // Stale global client from before schema changes; cast needed because TS
    // narrows to `never` once `loginAlert` is missing from a PrismaClient-shaped value.
    void (cached as PrismaClient).$disconnect().catch(() => undefined);
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const db = getPrismaClient();
