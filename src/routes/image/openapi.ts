import { registry } from '../../lib/openapi.registry';
import { z } from 'zod';
import { imageRequestSchema } from '../../lib/schema/image';

const SuccessImageResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    jobId: z.uuid().optional(),
    status: z.string(),
    prompt: z.string(),
  })
});

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