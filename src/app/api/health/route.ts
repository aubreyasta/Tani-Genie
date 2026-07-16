import { success } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return success({ status: 'ok', database: 'connected' });
  } catch {
    return success({ status: 'degraded', database: 'disconnected' });
  }
}
