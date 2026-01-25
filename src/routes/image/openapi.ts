import { z } from 'zod';
import { registry } from '../../lib/openapi.registry';
import { imageRequestSchema, SuccessImageResponse, } from '../../lib/schema/image';

registry.registerPath({
  method: 'post',
  path: '/api/image/generate',
  tags: ['Image'],
  summary: 'Generate Gambar via AI',
  description: 'Endpoint ini mengirim instruksi prompt ke browser automation untuk membuat gambar.',
  request: {
    headers: z.object({
      'x-api-key': z.string().describe('API Key untuk autentikasi'),
    }),
    body: {
      content: {
        'application/json': {
          schema: imageRequestSchema,
        },
      },
    },
  },
  responses: {
    202: {
      description: 'Request diterima dan masuk antrian',
      content: {
        'application/json': {
          schema: SuccessImageResponse,
        },
      },
    },
    400: {
      description: 'Validasi Gagal',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
    },
  },
});