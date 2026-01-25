import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import z from "zod";
import { GenerateStatus } from "../lib/enum/status-response";
import { registry } from "../lib/openapi.registry";

registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Cek Kesehatan Server',
  description: 'Endpoint ini memeriksa apakah server berjalan dengan baik.',
  responses: {
    200: {
      description: 'Server Berjalan dengan Baik',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal('true'),
            message: z.string().default("Server Berjalan dengan Baik"),
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
  title: z.string().optional().openapi({ example: 'Judul Artikel' }),
  content: z.string().optional().openapi({ example: 'Isi Artikel' }),
  articleData: z.object({
    id: z.string().optional().openapi({ description: 'ID Artikel di Database', example: 'article_12345' }),
  }).optional().openapi({ description: 'Data tambahan untuk artikel', example: { id: 'article_12345' } }),
}).openapi('WebhookResponse');

export type WebhookResponse = z.infer<typeof WebhookResponseSchema>;
export type WebHookStatus = z.infer<typeof GenerateStatusSchema>;

registry.register('webhookResponse', WebhookResponseSchema);
registry.register('webHookStatus', GenerateStatusSchema);
