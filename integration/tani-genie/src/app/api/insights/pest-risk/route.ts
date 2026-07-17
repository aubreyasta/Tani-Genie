import { NextResponse } from 'next/server';
import { z } from 'zod';

import { fetchPestRisk, PestRiskServiceError } from '@/modules/integrations/pest-risk-client';

const dailyRecordSchema = z.object({
  date: z.iso.date(),
  temp_avg_c: z.number().nullable().optional(),
  temp_max_c: z.number().nullable().optional(),
  temp_min_c: z.number().nullable().optional(),
  relative_humidity_pct: z.number().min(0).max(100).nullable().optional(),
  rainfall_mm: z.number().min(0).nullable().optional(),
  wind_speed_ms: z.number().min(0).nullable().optional(),
  estimated_wet_hours: z.number().min(0).max(24).nullable().optional(),
  root_zone_soil_moisture_raw: z.number().nullable().optional(),
  surface_soil_moisture_raw: z.number().nullable().optional(),
  ndvi: z.number().min(-1).max(1).nullable().optional(),
});

const requestSchema = z.object({
  crop: z.string().min(1),
  province: z.string().min(1),
  prediction_date: z.iso.date().optional(),
  weather_history: z.array(dailyRecordSchema).min(1).max(400),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_REQUEST', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await fetchPestRisk(parsed.data));
  } catch (error) {
    if (error instanceof PestRiskServiceError) {
      return NextResponse.json(
        { error: 'PEST_RISK_UNAVAILABLE', message: error.message },
        { status: error.status && error.status < 500 ? error.status : 503 },
      );
    }
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
