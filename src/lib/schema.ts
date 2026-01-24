import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { registry } from './openapi.registry';
import { ToneEnum } from './tone';

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
  articleData: z.object({
    id: z.string().optional().openapi({ description: 'ID Artikel di Database', example: 'article_12345' }),
  }).optional().openapi({ description: 'Data tambahan untuk artikel', example: { id: 'article_12345' } }),
}).openapi('ArticleRequest'); // <-- PENTING: Beri nama Component Schema di sini

export type ArticleRequest = z.infer<typeof publicArticleSchema>;

registry.register('ArticleRequest', publicArticleSchema);