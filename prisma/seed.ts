import process from 'node:process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client/client';

process.loadEnvFile('.env');
const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  // Demo farmer
  const farmer = await prisma.farmer.upsert({
    where: { id: 'demo-farmer-001' },
    update: {},
    create: {
      id: 'demo-farmer-001',
      name: 'Pak Budi',
      phone: '+62812-3456-7890',
    },
  });

  // Cabai (chili) crop definition
  const cabai = await prisma.cropDefinition.upsert({
    where: { slug: 'cabai-merah' },
    update: {},
    create: {
      slug: 'cabai-merah',
      name: 'Cabai Merah',
      commodityKey: 'cabai-merah',
      minTempC: 20,
      maxTempC: 30,
      minHumidity: 60,
      maxHumidity: 80,
      waterNeedMm: 25,
      gddBaseC: 10,
      gddTargetC: 1200,
      pestRiskHumidity: 85,
      pestRiskTempC: 28,
    },
  });

  // Bawang merah (shallot) crop definition
  const bawang = await prisma.cropDefinition.upsert({
    where: { slug: 'bawang-merah' },
    update: {},
    create: {
      slug: 'bawang-merah',
      name: 'Bawang Merah',
      commodityKey: 'bawang-merah',
      minTempC: 25,
      maxTempC: 32,
      minHumidity: 50,
      maxHumidity: 70,
      waterNeedMm: 15,
      gddBaseC: 5,
      gddTargetC: 1000,
      pestRiskHumidity: 80,
      pestRiskTempC: 30,
    },
  });

  // Plot 1 — cabai
  const plot1 = await prisma.plot.upsert({
    where: { id: 'demo-plot-001' },
    update: {},
    create: {
      id: 'demo-plot-001',
      farmerId: farmer.id,
      name: 'Kebun Cabai Belakang Rumah',
      areaM2: 500,
      latitude: -7.7956,
      longitude: 110.3695,
    },
  });

  // Plot 2 — bawang merah
  const plot2 = await prisma.plot.upsert({
    where: { id: 'demo-plot-002' },
    update: {},
    create: {
      id: 'demo-plot-002',
      farmerId: farmer.id,
      name: 'Lahan Bawang Sawah',
      areaM2: 800,
      latitude: -7.796,
      longitude: 110.37,
    },
  });

  // Planting cycle — cabai
  const planting1 = await prisma.plantingCycle.upsert({
    where: { id: 'demo-planting-001' },
    update: {},
    create: {
      id: 'demo-planting-001',
      plotId: plot1.id,
      cropId: cabai.id,
      seedName: 'Cabai Merah Keriting TM-99',
      targetYieldKg: 150,
      plantedAt: new Date('2026-06-01'),
      expectedHarvestAt: new Date('2026-09-01'),
      status: 'active',
    },
  });

  // Planting cycle — bawang merah
  await prisma.plantingCycle.upsert({
    where: { id: 'demo-planting-002' },
    update: {},
    create: {
      id: 'demo-planting-002',
      plotId: plot2.id,
      cropId: bawang.id,
      seedName: 'Bawang Merah Tuk Tuk',
      targetYieldKg: 400,
      plantedAt: new Date('2026-06-15'),
      expectedHarvestAt: new Date('2026-08-15'),
      status: 'active',
    },
  });

  // Weather snapshot for cabai plot
  await prisma.weatherSnapshot.upsert({
    where: {
      id: 'demo-weather-001',
    },
    update: {},
    create: {
      id: 'demo-weather-001',
      plantingId: planting1.id,
      observedAt: new Date('2026-07-16T06:00:00Z'),
      temperatureC: 27.5,
      rainfallMm: 5,
      humidityPct: 78,
      windSpeedKmh: 8,
      source: 'BMKG-village-forecast',
    },
  });

  // Price observations
  await prisma.priceObservation.upsert({
    where: { id: 'demo-price-001' },
    update: {},
    create: {
      id: 'demo-price-001',
      commodityKey: 'cabai-merah',
      pricePerKg: 45000,
      level: 'producer',
      observedAt: new Date('2026-07-15'),
      source: 'Panel-Harga-Bapanas',
    },
  });

  await prisma.priceObservation.upsert({
    where: { id: 'demo-price-002' },
    update: {},
    create: {
      id: 'demo-price-002',
      commodityKey: 'bawang-merah',
      pricePerKg: 28000,
      level: 'producer',
      observedAt: new Date('2026-07-15'),
      source: 'Panel-Harga-Bapanas',
    },
  });

  console.log('Seed complete:', { farmer: farmer.name, plots: 2, plantings: 2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
