import { z } from 'zod';

const dataPointSourceSchema = z.enum(['api', 'iot']);

export const dataPointMappingSchema = z
  .object({
    temp: dataPointSourceSchema.optional(),
    humidity: dataPointSourceSchema.optional(),
    rainfall: dataPointSourceSchema.optional(),
    soil_moisture: dataPointSourceSchema.optional(),
    nutrients_ph: dataPointSourceSchema.optional(),
  })
  .strict();

export const createCropSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1, 'Nama komoditas wajib diisi').max(100),
    commodityKey: z.string().min(1).max(100),
    minTempC: z.number(),
    maxTempC: z.number(),
    minHumidity: z.number().min(0).max(100),
    maxHumidity: z.number().min(0).max(100),
    waterNeedMm: z.number().nonnegative(),
    gddBaseC: z.number(),
    gddTargetC: z.number().positive(),
    pestRiskHumidity: z.number().min(0).max(100),
    pestRiskTempC: z.number(),
  })
  .refine((data) => data.maxTempC > data.minTempC, {
    message: 'Suhu maksimum harus lebih besar dari suhu minimum',
    path: ['maxTempC'],
  })
  .refine((data) => data.maxHumidity > data.minHumidity, {
    message: 'Kelembapan maksimum harus lebih besar dari kelembapan minimum',
    path: ['maxHumidity'],
  });

export const createPlotSchema = z.object({
  farmerId: z.string().min(1),
  name: z.string().min(1, 'Nama lahan wajib diisi').max(200),
  areaM2: z.number().positive('Luas lahan harus positif'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const updatePlotSchema = createPlotSchema.partial();

export const createPlantingSchema = z.object({
  plotId: z.string().min(1),
  cropId: z.string().min(1),
  seedName: z.string().min(1, 'Nama benih wajib diisi').max(200),
  targetYieldKg: z.number().positive('Target hasil harus positif'),
  plantedAt: z.string().datetime(),
  expectedHarvestAt: z.string().datetime(),
  dataPoints: dataPointMappingSchema.default({}),
});

export const updatePlantingSchema = createPlantingSchema.partial().extend({
  status: z.enum(['active', 'finished', 'planned']).optional(),
});

export const generateNotificationSchema = z.object({
  farmerId: z.string().min(1),
});

export const deliverNotificationSchema = z.object({
  channel: z.enum(['whatsapp', 'sms']),
  forceFail: z.boolean().optional(),
});
