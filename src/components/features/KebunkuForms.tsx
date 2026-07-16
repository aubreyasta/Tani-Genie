'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Form } from '@/components/ui/Form';
import type { CropDto } from '@/types/api';

function field(data: Record<string, FormDataEntryValue>, name: string): string {
  return String(data[name]);
}

export function AddPlotPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="stack">
      <Button variant="primary" onDone={() => setOpen(true)}>
        Tambah Lahan
      </Button>
      {open ? (
        <Card>
          <h2 className="form-title">Tambah lahan</h2>
          <Form action="/api/plots" submitLabel="Simpan Lahan" onSuccess={() => setOpen(false)}>
            <label className="field">
              Nama lahan
              <input name="name" required placeholder="Contoh: Petak Utara" />
            </label>
            <div className="form-grid two">
              <label className="field">
                Luas (m²)
                <input name="areaM2" type="number" min="1" required />
              </label>
              <label className="field">
                Latitude
                <input name="latitude" type="number" step="0.000001" required defaultValue="-6.2" />
              </label>
              <label className="field">
                Longitude
                <input
                  name="longitude"
                  type="number"
                  step="0.000001"
                  required
                  defaultValue="106.8"
                />
              </label>
            </div>
          </Form>
        </Card>
      ) : null}
    </div>
  );
}

export function AddPlantingPanel({ plotId, crops }: { plotId: string; crops: readonly CropDto[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="stack">
      <Button variant="secondary" onDone={() => setOpen(true)}>
        Tambah Tanaman
      </Button>
      {open ? (
        <Card className="card-muted">
          <Form
            action="/api/plantings"
            submitLabel="Simpan Tanaman"
            onSuccess={() => setOpen(false)}
            transform={(data) => ({
              plotId,
              cropId: field(data, 'cropId'),
              seedName: field(data, 'seedName'),
              targetYieldKg: Number(field(data, 'targetYieldKg')),
              plantedAt: `${field(data, 'plantedAt')}T00:00:00.000Z`,
              expectedHarvestAt: `${field(data, 'expectedHarvestAt')}T00:00:00.000Z`,
            })}
          >
            <label className="field">
              Komoditas
              <select name="cropId" required>
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Nama benih
              <input name="seedName" required placeholder="Contoh: Benih lokal" />
            </label>
            <div className="form-grid two">
              <label className="field">
                Target panen (kg)
                <input name="targetYieldKg" type="number" min="1" required />
              </label>
              <label className="field">
                Tanggal tanam
                <input name="plantedAt" type="date" required />
              </label>
              <label className="field">
                Perkiraan panen
                <input name="expectedHarvestAt" type="date" required />
              </label>
            </div>
          </Form>
        </Card>
      ) : null}
    </div>
  );
}
