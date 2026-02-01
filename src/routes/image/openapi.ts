import { z } from 'zod';
import { registry } from '../../lib/openapi.registry';
import { imageRequestSchema, SuccessImageResponse, } from '../../lib/schema/image';

registry.registerPath({
  method: 'post',
  path: '/api/image/generate',
  security: [
    {
      BearerAuth: [], 
    },
  ],
  tags: ['Image'],
  summary: 'Generate Image via AI',
  description: 'This endpoint sends prompt instructions to browser automation to create images.',
  request: {
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
      description: 'Request accepted and queued for processing',
      content: {
        'application/json': {
          schema: SuccessImageResponse,
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
  },
});