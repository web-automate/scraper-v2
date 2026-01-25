import { z } from 'zod';
import { GenerateStatus } from '../../lib/enum/status-response';
import { registry } from '../../lib/openapi.registry';
import { publicArticleSchema, SuccessArticleResponseSchema } from '../../lib/schema/article';

registry.registerPath({
  method: 'post',
  path: '/api/article/generate',
  tags: ['Article'],
  summary: 'Generate Artikel via AI',
  description: 'Endpoint ini memvalidasi input menggunakan Zod dan mengirim task ke RabbitMQ.',
  request: {
    headers: z.object({
      'x-api-key': z.string().describe('API Key untuk autentikasi'),
    }),
    body: {
      content: {
        'application/json': {
          schema: publicArticleSchema, 
        },
      },
    },
  },
  responses: {
    202: {
      description: 'Request diterima dan masuk antrian',
      content: {
        'application/json': {
          schema: SuccessArticleResponseSchema,
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
    500: {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: z.object({ 
            success: z.boolean(),
            error: z.string(),
            data: z.object({
              status: z.enum(GenerateStatus),
            })
          }),
        },
      },
    },
  },
});