import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import z from "zod";
import { AspectRatio } from "../enum/aspect-ratio";
import { GenerateStatus } from "../enum/status-response";
import { registry } from "../openapi.registry";
import { ToneImageEnum } from "../tone/image";

extendZodWithOpenApi(z);

export const imageRequestSchema = z.object({
  prompt: z.string()
    .min(3)
    .openapi({
      description: 'Deskripsi detail gambar yang ingin dibuat',
      example: 'Seekor kucing cyberpunk memakai kacamata neon di tengah kota futuristik, realistic style, 8k'
    }),
  tone: z.enum(ToneImageEnum)
    .optional()
    .default(ToneImageEnum.artSchool)
    .openapi({
      description: 'Gaya Gambar',
      example: 'artSchool'
    }),
  aspectRatio: z.enum(AspectRatio)
    .optional()
    .default(AspectRatio.LANDSCAPE)
    .openapi({
      description: 'Rasio Aspek Gambar',
      example: '16:9'
    }),
  webhookUrl: z.url()
    .optional()
    .openapi({
      description: 'URL Callback untuk menerima hasil (URL Gambar/Path)',
      example: 'https://webhook.site/your-unique-id'
    }),
  webpFormat: z.boolean()
    .optional()
    .default(true)
    .openapi({
      description: 'Apakah format gambar harus dalam format WebP?',
      example: true
    }),
  imageMaxSizeKB: z.number()
    .optional()
    .default(100)
    .openapi({
      description: 'Ukuran maksimum gambar dalam KB (100 KB default)',
      example: 100
    }),
  articleData: z.object({
    id: z.string().optional().openapi({ description: 'ID Artikel di Database', example: 'article_12345' }),
    imageIndex: z.number().int().openapi({ example: 1 }),
  }).optional().openapi({ description: 'Data tambahan untuk artikel', example: { id: 'article_12345' } }),
}).openapi('ImageRequest');

export const SuccessImageResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    prompt: z.string().openapi({ example: 'Seekor kucing cyberpunk memakai kacamata neon di tengah kota futuristik, realistic style, 8k' }),
    status: z.enum(GenerateStatus),
    webhookUrl: z.string().optional().openapi({ example: 'https://webhook.site/your-unique-id' }),
  })
}).openapi('SuccessImageResponse');

export const ImageWebhookResponseSchema = z.object({
  type: z.string().openapi({ example: 'ARTICLE' }),
  status: z.string().openapi({ example: GenerateStatus.COMPLETED }),
  error: z.string().optional().openapi({ example: 'Error message' }),
  imagePath: z.url().openapi({ example: 'https://example.com/image.webp' }),
  articleData: z.object({
    id: z.string().optional().openapi({ description: 'ID Artikel di Database', example: 'article_12345' }),
    imageIndex: z.number().int().openapi({ example: 1 }),
  }).optional().openapi({ description: 'Data tambahan untuk artikel', example: { id: 'article_12345' } }),
}).openapi('ImageWebhookResponse');

export type ImageRequest = z.infer<typeof imageRequestSchema>;
export type SuccessImageResponseType = z.infer<typeof SuccessImageResponse>;
export type ImageWebhookResponse = z.infer<typeof ImageWebhookResponseSchema>;

registry.register('ImageRequest', imageRequestSchema);
registry.register('SuccessImageResponse', SuccessImageResponse);
registry.register('ImageWebhookResponse', ImageWebhookResponseSchema);