import { z } from 'zod';

export const createPlotSchema = z.object({
  farmerId: z.string().uuid(),
  name: z.string().min(1, 'Nama lahan wajib diisi').max(200),
  areaM2: z.number().positive('Luas lahan harus positif'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const updatePlotSchema = createPlotSchema.partial();

export const createPlantingSchema = z.object({
  plotId: z.string().uuid(),
  cropId: z.string().uuid(),
  seedName: z.string().min(1, 'Nama benih wajib diisi').max(200),
  targetYieldKg: z.number().positive('Target hasil harus positif'),
  plantedAt: z.string().datetime(),
  expectedHarvestAt: z.string().datetime(),
});

export const updatePlantingSchema = createPlantingSchema.partial().extend({
  status: z.enum(['active', 'finished', 'planned']).optional(),
});

export const generateNotificationSchema = z.object({
  farmerId: z.string().uuid(),
});

export const deliverNotificationSchema = z.object({
  channel: z.enum(['whatsapp', 'sms']),
  forceFail: z.boolean().optional(),
});
