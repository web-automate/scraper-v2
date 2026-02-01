// src/lib/schema/auth.ts
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const GenerateSecretRequestSchema = z.object({
  email: z.email().openapi({ 
    example: 'dev@misbakhul.my.id', 
    description: 'User email to be embedded in the token' 
  }),
}).openapi('GenerateSecretRequest');

export const GenerateSecretResponseSchema = z.object({
  success: z.boolean(),
  token: z.string().openapi({ description: 'Generated JWT Token' }),
  expiresIn: z.string().openapi({ example: '1h', description: 'Token expiration time' })
}).openapi('GenerateSecretResponse');

export type GenerateSecretRequest = z.infer<typeof GenerateSecretRequestSchema>;