type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | { readonly [key: string]: JsonValue } | readonly JsonValue[];

interface OpenApiSpec {
  readonly openapi: string;
  readonly info: { readonly title: string; readonly version: string };
  readonly paths: { readonly [path: string]: PathItem };
}

interface PathItem {
  readonly get?: Operation;
  readonly post?: Operation;
  readonly patch?: Operation;
  readonly delete?: Operation;
}

interface Operation {
  readonly summary: string;
  readonly parameters?: readonly Parameter[];
  readonly requestBody?: JsonValue;
  readonly responses: Responses;
}

interface Parameter {
  readonly name: string;
  readonly in: 'path' | 'query';
  readonly required: boolean;
  readonly schema: JsonValue;
  readonly description?: string;
}

interface Responses {
  readonly '200'?: ResponseSpec;
  readonly '201'?: ResponseSpec;
  readonly '204'?: ResponseSpec;
  readonly '400': ResponseSpec;
  readonly '404': ResponseSpec;
  readonly '409': ResponseSpec;
  readonly '422': ResponseSpec;
  readonly '500': ResponseSpec;
}

interface ResponseSpec {
  readonly description: string;
}

const jsonContent = (schemaName: string): JsonValue => ({
  content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } },
});

const idParam = (name: string): Parameter => ({
  name,
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
});

const queryParam = (name: string, required = false): Parameter => ({
  name,
  in: 'query',
  required,
  schema: { type: 'string' },
});

const paginatedParams: readonly Parameter[] = [
  queryParam('page'),
  queryParam('pageSize'),
  queryParam('farmerId'),
  queryParam('plantingId'),
];

const errors = {
  '400': { description: 'Permintaan tidak valid atau parameter query salah' },
  '404': { description: 'Resource dengan id yang diminta tidak ditemukan' },
  '409': { description: 'Konflik data, misalnya resource masih dipakai' },
  '422': { description: 'Validasi gagal; periksa detail field yang dikirim' },
  '500': { description: 'Terjadi kesalahan internal' },
} satisfies Pick<Responses, '400' | '404' | '409' | '422' | '500'>;

const ok = (description: string): Responses => ({ '200': { description }, ...errors });
const created = (description: string): Responses => ({ '201': { description }, ...errors });
const empty = (description: string): Responses => ({ '204': { description }, ...errors });

export const openApiSpec = {
  openapi: '3.1.0',
  info: { title: 'Tanigata API', version: '0.1.0' },
  paths: {
    '/api/health': {
      get: { summary: 'Cek status layanan Tanigata', responses: ok('Layanan sehat') },
    },
    '/api/crops': {
      get: {
        summary: 'Ambil daftar komoditas dan parameter agronomi',
        parameters: [queryParam('q')],
        responses: ok('Daftar crop berhasil diambil'),
      },
    },
    '/api/plots': {
      get: {
        summary: 'Ambil daftar lahan dengan pagination',
        parameters: paginatedParams,
        responses: ok('Daftar lahan berhasil diambil'),
      },
      post: {
        summary: 'Buat lahan baru',
        requestBody: jsonContent('CreatePlotRequest'),
        responses: created('Lahan berhasil dibuat'),
      },
    },
    '/api/plots/{plotId}': {
      get: {
        summary: 'Ambil detail lahan berdasarkan id',
        parameters: [idParam('plotId')],
        responses: ok('Detail lahan berhasil diambil'),
      },
      patch: {
        summary: 'Perbarui data lahan',
        parameters: [idParam('plotId')],
        requestBody: jsonContent('UpdatePlotRequest'),
        responses: ok('Lahan berhasil diperbarui'),
      },
      delete: {
        summary: 'Hapus lahan',
        parameters: [idParam('plotId')],
        responses: empty('Lahan berhasil dihapus'),
      },
    },
    '/api/plantings': {
      get: {
        summary: 'Ambil daftar tanam dengan pagination',
        parameters: paginatedParams,
        responses: ok('Daftar tanam berhasil diambil'),
      },
      post: {
        summary: 'Buat periode tanam baru',
        requestBody: jsonContent('CreatePlantingRequest'),
        responses: created('Periode tanam berhasil dibuat'),
      },
    },
    '/api/plantings/{plantingId}': {
      get: {
        summary: 'Ambil detail tanam berdasarkan id',
        parameters: [idParam('plantingId')],
        responses: ok('Detail tanam berhasil diambil'),
      },
      patch: {
        summary: 'Perbarui data atau status tanam',
        parameters: [idParam('plantingId')],
        requestBody: jsonContent('UpdatePlantingRequest'),
        responses: ok('Periode tanam berhasil diperbarui'),
      },
    },
    '/api/insights/weather': {
      get: {
        summary: 'Ambil insight cuaca dan verdict risiko untuk tanam',
        parameters: [queryParam('plantingId', true)],
        responses: ok('Insight cuaca berhasil diambil'),
      },
    },
    '/api/forecasts/prices': {
      get: {
        summary: 'Ambil prediksi harga dan jendela jual terbaik',
        parameters: [queryParam('plantingId', true)],
        responses: ok('Prediksi harga berhasil diambil'),
      },
    },
    '/api/notifications': {
      get: {
        summary: 'Ambil daftar notifikasi petani',
        parameters: paginatedParams,
        responses: ok('Daftar notifikasi berhasil diambil'),
      },
    },
    '/api/notifications/generate': {
      post: {
        summary: 'Generate notifikasi rekomendasi untuk petani',
        requestBody: jsonContent('GenerateNotificationRequest'),
        responses: created('Notifikasi berhasil dibuat'),
      },
    },
    '/api/notifications/{notificationId}/read': {
      patch: {
        summary: 'Tandai notifikasi sebagai sudah dibaca',
        parameters: [idParam('notificationId')],
        responses: ok('Notifikasi berhasil ditandai sudah dibaca'),
      },
    },
    '/api/notifications/{notificationId}/deliveries': {
      post: {
        summary: 'Kirim notifikasi melalui WhatsApp atau SMS',
        parameters: [idParam('notificationId')],
        requestBody: jsonContent('DeliverNotificationRequest'),
        responses: created('Percobaan pengiriman berhasil dibuat'),
      },
    },
  },
} satisfies OpenApiSpec;
