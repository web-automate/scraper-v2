import { z } from 'zod';
import { GenerateStatus } from '../../lib/enum/status-response';
import { registry } from '../../lib/openapi.registry';
import { publicArticleSchema, SuccessArticleResponseSchema } from '../../lib/schema/article';

registry.registerPath({
  method: 'get',
  path: '/api/article/health',
  security: [
    {
      BearerAuth: [], 
    },
  ],
  tags: ['Article'],
  summary: 'Check Article Service Health',
  description: 'This endpoint checks the health status of the Article Service.',
  responses: {
    200: {
      description: 'Article Service is healthy',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/article/generate',
  security: [
    {
      BearerAuth: [], 
    },
  ],
  tags: ['Article'],
  summary: 'Generate Article via AI',
  description: 'This endpoint validates the input using Zod and sends a task to RabbitMQ.',
  request: {
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
      description: 'Request accepted and added to queue',
      content: {
        'application/json': {
          schema: SuccessArticleResponseSchema,
        },
      },
    },
    400: {
      description: 'Validation Failed',
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