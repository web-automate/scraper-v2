import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { GenerateStatus } from '../enum/status-response';
import { registry } from '../openapi.registry';
import { ToneEnum } from '../tone';
import { ToneImageEnum } from '../tone/image';

extendZodWithOpenApi(z);

export const publicArticleSchema = z.object({
  topic: z.string()
    .min(5)
    .openapi({
      description: 'Topik utama artikel',
      example: 'Pola Pikir dan Nilai-Nilai Generasi Z'
    }),
  keywords: z.array(z.string())
    .optional()
    .openapi({
      description: 'List keyword SEO',
      example: ['Digital Native', 'Mental Health', 'Work-Life Balance']
    }),
  category: z.string()
    .optional()
    .default('General')
    .openapi({
      description: 'Kategori Artikel',
      example: 'Sociology'
    }),
  tone: z.enum(ToneEnum)
    .optional()
    .default(ToneEnum.educational)
    .openapi({
      description: 'Gaya Bahasa',
      example: 'professional'
    }),
  webhookUrl: z.url()
    .optional()
    .openapi({
      description: 'URL Callback',
      example: 'https://webhook.site/33cd8820-26dc-4e40-b3e5-a6b2fdfe3401'
    }),
  imageCount: z.number()
    .int()
    .min(0)
    .max(5)
    .optional()
    .openapi({
      description: 'Jumlah gambar yang diinginkan',
      example: 3
    }),
  articleData: z.object({
    id: z.string().optional().openapi({ description: 'ID Artikel di Database', example: 'article_12345' }),
  }).optional().openapi({ description: 'Data tambahan untuk artikel', example: { id: 'article_12345' } }),
}).openapi('ArticleRequest'); // <-- PENTING: Beri nama Component Schema di sini

export const SuccessArticleResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    status: z.enum(GenerateStatus),
    webhookUrl: z.url().optional().openapi({
      description: 'URL Callback',
      example: 'https://webhook.site/33cd8820-26dc-4e40-b3e5-a6b2fdfe3401'
    }),
    articleData: z.object({
      id: z.string().optional().openapi({ description: 'ID Artikel di Database', example: 'article_12345' }),
    }).optional().openapi({ description: 'Data tambahan untuk artikel', example: { id: 'article_12345' } }),
  })
}).openapi('SuccessArticleResponse');

export const ArticleWebhookResponseSchema = z.object({
  type: z.string().default('ARTICLE'),
  topic: z.string(),
  title: z.string(),
  content: z.string(),
  articleData: z.object({
    id: z.string().optional().openapi({ description: 'ID Artikel di Database', example: 'article_12345' }),
  }).optional().openapi({ description: 'Data tambahan untuk artikel', example: { id: 'article_12345' } }),
  status: z.nativeEnum(GenerateStatus),
  properties: z.object({
    imageCount: z.number().int().min(0).max(5).default(0),
    imagePrompts: z.array(
      z.object({
        index: z.number().int().openapi({ example: 1 }),
        tone: z.enum(ToneImageEnum).openapi({ example: ToneImageEnum.artSchool }),
        prompt: z.string().openapi({ example: 'A professional workspace with neon lighting, 8k' }),
      })
    ).optional().openapi({ 
      description: 'Daftar prompt gambar hasil ekstraksi AI',
    }),
  }).optional().openapi({
    description: 'Metadata tambahan untuk pemrosesan gambar',
    example: { 
      imageCount: 2,
      imagePrompts: [
        { index: 1, tone: ToneImageEnum.artSchool, prompt: "Digital native illustration..." },
        { index: 2, tone: ToneImageEnum.artSchool, prompt: "Mental health awareness icon..." }
      ]
    }
  }),
}).openapi('ArticleWebhookResponse');

export type SuccessArticleResponse = z.infer<typeof SuccessArticleResponseSchema>;
export type ArticleRequest = z.infer<typeof publicArticleSchema>;
export type ArticleWebhookResponse = z.infer<typeof ArticleWebhookResponseSchema>;

registry.register('ArticleRequest', publicArticleSchema);
registry.register('SuccessArticleResponse', SuccessArticleResponseSchema);
registry.register('ArticleWebhookResponse', ArticleWebhookResponseSchema);