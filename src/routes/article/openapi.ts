import { z } from 'zod';
import { registry } from '../../lib/openapi.registry';
import { publicArticleSchema } from '../../lib/schema';

const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    topic: z.string(),
    status: z.string(),
    title: z.string(),
    content: z.string(),
    articleData: z.object({
      id: z.string().optional().openapi({ description: 'ID Artikel di Database', example: 'article_12345' }),
    }).optional().openapi({ description: 'Data tambahan untuk artikel', example: { id: 'article_12345' } }),
  })
});

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
          schema: SuccessResponseSchema,
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