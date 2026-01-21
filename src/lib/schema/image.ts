import z from "zod";
import { registry } from "../openapi.registry";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { ToneImageEnum } from "../tone/image";
import { AspectRatio } from "../enum/aspect-ratio";

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
}).openapi('ImageRequest');

export type ImageRequest = z.infer<typeof imageRequestSchema>;

registry.register('ImageRequest', imageRequestSchema);