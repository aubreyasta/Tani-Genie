import process from 'node:process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client';
import { CROP_PRESETS } from '../src/modules/catalog/crop-presets';

process.loadEnvFile('.env');
const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  await prisma.weatherSnapshot.deleteMany({ where: { id: 'demo-weather-001' } });
  await prisma.priceObservation.deleteMany({
    where: { id: { in: ['demo-price-001', 'demo-price-002'] } },
  });
  await prisma.plantingCycle.deleteMany({
    where: { id: { in: ['demo-planting-001', 'demo-planting-002'] } },
  });
  await prisma.plot.deleteMany({
    where: { id: { in: ['demo-plot-001', 'demo-plot-002'] } },
  });
  await prisma.farmer.deleteMany({ where: { id: 'demo-farmer-001' } });

  for (const [slug, preset] of Object.entries(CROP_PRESETS)) {
    await prisma.cropDefinition.upsert({
      where: { slug },
      update: { ...preset, commodityKey: slug },
      create: { ...preset, slug, commodityKey: slug },
    });
  }

  console.log('Demo farm records removed and supported commodity catalog synchronized.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
