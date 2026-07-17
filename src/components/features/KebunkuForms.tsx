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
  const [latitude, setLatitude] = useState(-7.7956);
  const [longitude, setLongitude] = useState(110.3695);
  const [locationMessage, setLocationMessage] = useState('Lokasi awal: Yogyakarta');

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationMessage('Perangkat tidak mendukung lokasi. Lokasi Yogyakarta tetap digunakan.');
      return;
    }
    setLocationMessage('Mencari lokasi...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationMessage('Lokasi perangkat berhasil digunakan.');
      },
      () => setLocationMessage('Izin lokasi tidak diberikan. Lokasi Yogyakarta tetap digunakan.'),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }
  return (
    <div className="stack">
      <Button variant="primary" onDone={() => setOpen(true)}>
        Tambah Lahan
      </Button>
      {open ? (
        <Card>
          <h2 className="form-title">Tambah lahan</h2>
          <Form
            action="/api/plots"
            submitLabel="Simpan Lahan"
            onSuccess={() => setOpen(false)}
            transform={(data) => ({
              name: field(data, 'name'),
              areaM2: Number(field(data, 'areaM2')),
              latitude: Number(field(data, 'latitude')),
              longitude: Number(field(data, 'longitude')),
            })}
          >
            <label className="field">
              Nama lahan
              <input name="name" required placeholder="Contoh: Petak Utara" />
            </label>
            <div className="form-grid two">
              <label className="field">
                Luas (m²)
                <input name="areaM2" type="number" min="1" required />
              </label>
            </div>
            <input name="latitude" type="hidden" value={latitude} />
            <input name="longitude" type="hidden" value={longitude} />
            <button type="button" className="button button-secondary" onClick={useCurrentLocation}>
              Gunakan lokasi saya
            </button>
            <p className="muted flush" role="status">
              {locationMessage}
            </p>
          </Form>
        </Card>
      ) : null}
    </div>
  );
}

export function AddPlantingPanel({ plotId, crops }: { plotId: string; crops: readonly CropDto[] }) {
  const [open, setOpen] = useState(false);
  const [temperatureSource, setTemperatureSource] = useState<'api' | 'iot'>('api');
  if (crops.length === 0) {
    return (
      <div className="stack compact-stack">
        <Button variant="secondary" disabled>
          Tambah Komoditas
        </Button>
        <p className="muted flush">Daftar komoditas belum tersedia. Muat ulang halaman.</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <Button variant="secondary" onDone={() => setOpen(true)}>
        Tambah Komoditas
      </Button>
      {open ? (
        <Card className="card-muted">
          <h3 className="form-title">Tambah komoditas ke lahan</h3>
          <Form
            action="/api/plantings"
            submitLabel="Simpan Komoditas"
            onSuccess={() => {
              setOpen(false);
              setTemperatureSource('api');
            }}
            transform={(data) => ({
              plotId,
              cropId: field(data, 'cropId'),
              seedName: field(data, 'seedName'),
              targetYieldKg: Number(field(data, 'targetYieldKg')),
              plantedAt: `${field(data, 'plantedAt')}T00:00:00.000Z`,
              expectedHarvestAt: `${field(data, 'expectedHarvestAt')}T00:00:00.000Z`,
              dataPoints: {
                temp: field(data, 'temp'),
                humidity: field(data, 'humidity'),
                rainfall: field(data, 'rainfall'),
                soil_moisture: field(data, 'soil_moisture'),
                nutrients_ph: field(data, 'nutrients_ph'),
              },
            })}
          >
            <label className="field">
              Komoditas
              <select name="cropId" required defaultValue="">
                <option value="" disabled>
                  Pilih komoditas
                </option>
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
            <fieldset className="data-points">
              <legend>Sumber data point</legend>
              <div className="temperature-source">
                <input name="temp" type="hidden" value={temperatureSource} />
                <div>
                  <strong>Suhu otomatis dari API cuaca</strong>
                  <p className="muted flush" role="status">
                    {temperatureSource === 'api'
                      ? 'Aktif — suhu mengikuti lokasi lahan secara otomatis.'
                      : 'IoT dipilih — data suhu akan menggunakan perangkat milik petani.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="button button-secondary"
                  aria-pressed={temperatureSource === 'iot'}
                  onClick={() =>
                    setTemperatureSource((source) => (source === 'api' ? 'iot' : 'api'))
                  }
                >
                  {temperatureSource === 'api' ? 'Gunakan IoT sendiri' : 'Gunakan API cuaca'}
                </button>
              </div>
              {[
                ['humidity', 'Kelembapan'],
                ['rainfall', 'Curah hujan'],
                ['soil_moisture', 'Kelembapan tanah'],
                ['nutrients_ph', 'Nutrisi / pH'],
              ].map(([name, label]) => (
                <label className="field" key={name}>
                  {label}
                  <select name={name} defaultValue="api">
                    <option value="api">API</option>
                    <option value="iot">IoT</option>
                  </select>
                </label>
              ))}
            </fieldset>
          </Form>
        </Card>
      ) : null}
    </div>
  );
}
