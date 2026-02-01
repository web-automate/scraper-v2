import { z } from 'zod';
import { registry } from '../../lib/openapi.registry';
import { GenerateSecretRequestSchema, GenerateSecretResponseSchema } from '../../lib/schema/auth';

registry.register('GenerateSecretRequest', GenerateSecretRequestSchema);
registry.register('GenerateSecretResponse', GenerateSecretResponseSchema);

registry.registerPath({
  method: 'post',
  path: '/api/auth/secret',
  tags: ['Auth'],
  summary: 'Generate Access Token (JWT)',
  description: 'Exchange the Master API Key and Email with a JWT Token to access other endpoints.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: GenerateSecretRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successfully created token',
      content: {
        'application/json': {
          schema: GenerateSecretResponseSchema,
        },
      },
    },
    400: {
      description: 'Input Validation Failed',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean(), error: z.any() }),
        },
      },
    },
    401: {
      description: 'Invalid Master API Key',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean(), error: z.string() }),
        },
      },
    },
  },
});