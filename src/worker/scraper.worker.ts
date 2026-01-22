import axios from 'axios';
import { rabbitMQService } from '../service/rabbitmq.service';
import { AiScraperService } from '../service/scraper.service';
import { TonePrompts, Tone } from '../lib/tone'; 
import { ArticleRequest } from '../lib/schema';
import { ImageRequest } from '../lib/schema/image';
import { ToneImage, ToneImagePrompts } from '../lib/tone/image';
import { getAspectRatioInstruction } from '../lib/enum/aspect-ratio';
import { getPublicImageUrl } from '../helper/cdn-url';
import { env } from '../config/env';
import { production } from '../lib/node-env';

const AIService = new AiScraperService();

type JobPayload = (ArticleRequest | ImageRequest) & { type?: 'IMAGE_GENERATION' | 'ARTICLE_GENERATION' };

export const startWorker = async () => {
  console.log('👷 Starting Worker...');

  await rabbitMQService.consume(async (data: JobPayload) => {
    
    const jobType = data.type || 'ARTICLE_GENERATION';

    console.log(`[Worker] Processing Job Type: ${jobType}`);

    try {
      if (jobType === 'IMAGE_GENERATION') {
        const imgData = data as ImageRequest;
        console.log(`[Worker] Generating Image for prompt: "${imgData.prompt}"`);

        const selectedTone = (imgData.tone as ToneImage) || 'artSchool';
        const toneGuideline = ToneImagePrompts[selectedTone] || ToneImagePrompts.artSchool;

        const prompt = `
        Generative Image Prompt Structure
        ---------------------------------

        [SUBJECT / CONTENT]
        ${imgData.prompt.trim()}

        [ARTISTIC STYLE & TONE]
        ${toneGuideline.trim()}

        [COMPOSITION & DIMENSIONS]
        Target Aspect Ratio: ${imgData.aspectRatio}
        Framing Guideline: ${getAspectRatioInstruction(imgData.aspectRatio)}
        Ensure the subject is framed correctly according to this ratio (e.g., don't crop heads in vertical, fill sides in horizontal).

        [OUTPUT CONSTRAINTS]
        CRITICAL: Generate exactly ONE single image frame. Do not create a grid, collage, split-screen, or multiple panels. The final output must be a singular, cohesive composition.

        [SYNTHESIS INSTRUCTIONS]
        Combine the subject content with the artistic tone and composition guidelines seamlessly.
        `.trim();

        const imagePath = await AIService.generateImage(prompt, imgData.webpFormat, imgData.imageMaxSizeKB);

        if (imgData.webhookUrl) {
          await sendWebhook(imgData.webhookUrl, {
            type: 'IMAGE',
            prompt: imgData.prompt,
            imagePath: env.NODE_ENV == production ? getPublicImageUrl(imagePath) : imagePath, 
            status: 'completed'
          });
        } else {
          console.log(`[Worker] Image generated at: ${imagePath}`);
        }

      } else {
        const artData = data as ArticleRequest;
        const selectedTone = (artData.tone as Tone) || 'educational';
        const toneGuideline = TonePrompts[selectedTone] || TonePrompts.educational;

        const prompt = `
          Generate a detailed article based on the following specifications:
          TASK SPECIFICATION:
          Topic: ${artData.topic}
          Keywords: ${artData.keywords?.join(', ') || 'None'}
          Category: ${artData.category || 'General'}
          ${toneGuideline}
        `.trim();

        console.log(`[Worker] Generating Article: "${artData.topic}" (${selectedTone})`);

        const result = await AIService.generateContent(prompt);

        if (artData.webhookUrl) {
          await sendWebhook(artData.webhookUrl, {
            type: 'ARTICLE',
            topic: artData.topic,
            content: result,
            status: 'completed'
          });
        } else {
          console.log('Snippet:', result.substring(0, 50) + '...');
        }
      }

    } catch (error: any) {
      console.error(`[Worker] Processing failed: ${error.message}`);
      
      if (data.webhookUrl) {
        await sendWebhook(data.webhookUrl, {
          type: jobType === 'IMAGE_GENERATION' ? 'IMAGE' : 'ARTICLE',
          error: error.message,
          status: 'failed'
        });
      }
      throw error;
    }
  });
};

async function sendWebhook(url: string, payload: any) {
  console.log(`[Webhook] Sending result to: ${url}`);
  try {
    await axios.post(url, payload);
    console.log('[Webhook] Sent successfully.');
  } catch (webhookError) {
    console.error('[Webhook] Failed to send:', webhookError);
  }
}