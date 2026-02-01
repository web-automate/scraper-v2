import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import z from "zod";
import { GenerateStatus } from "../lib/enum/status-response";
import { registry } from "../lib/openapi.registry";

registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Enter your JWT token here (without the "Bearer " prefix, just the token itself)'
});

registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Check Server Health',
  description: 'This endpoint checks whether the server is running properly.',
  responses: {
    200: {
      description: 'Server is running properly',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal('true'),
            message: z.string().default("Server is running properly"),
            timestamp: z.date().default(() => new Date()),
          }),
        },
      },
    },
  },
})

extendZodWithOpenApi(z);

export const GenerateStatusSchema = z.enum([
  GenerateStatus.PENDING,
  GenerateStatus.GENERATING,
  GenerateStatus.WAITING_FOR_IMAGES,
  GenerateStatus.COMPLETED,
  GenerateStatus.FAILED_CONTENT,
  GenerateStatus.FAILED_IMAGES,
  GenerateStatus.FAILED,
  GenerateStatus.DRAFT,
  GenerateStatus.PUBLISHED,
]).openapi('WebHookStatus');

export const WebhookResponseSchema = z.object({
  type: z.string().openapi({ example: 'ARTICLE' }),
  status: GenerateStatusSchema.openapi({ example: GenerateStatus.COMPLETED }),
  error: z.string().optional().openapi({ example: 'Error message' }),
  topic: z.string().optional().openapi({ example: 'topic' }),
  title: z.string().optional().openapi({ example: 'Article Title' }),
  content: z.string().optional().openapi({ example: 'Article Content' }),
  articleData: z.object({
    id: z.string().optional().openapi({ description: 'Article ID in Database', example: 'article_12345' }),
  }).optional().openapi({ description: 'Additional article data', example: { id: 'article_12345' } }),
}).openapi('WebhookResponse');

export type WebhookResponse = z.infer<typeof WebhookResponseSchema>;
export type WebHookStatus = z.infer<typeof GenerateStatusSchema>;

registry.register('webhookResponse', WebhookResponseSchema);
registry.register('webHookStatus', GenerateStatusSchema);
