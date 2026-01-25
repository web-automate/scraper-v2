import axios from 'axios';
import { env } from '../config/env';
import { getPublicImageUrl } from '../helper/cdn-url';
import { promptContent, promptImage } from '../lib/constants/prompt';
import { GenerateStatus } from '../lib/enum/status-response';
import { extractArticleData } from '../lib/helper/article';
import { production } from '../lib/node-env';
import { ArticleRequest, ArticleWebhookResponse } from '../lib/schema/article';
import { ImageRequest, ImageWebhookResponse } from '../lib/schema/image';
import { Tone, TonePrompts } from '../lib/tone';
import { ToneImage, ToneImagePrompts } from '../lib/tone/image';
import { rabbitMQService } from '../service/rabbitmq.service';
import { AiScraperService } from '../service/scraper.service';

const AIService = new AiScraperService();

type JobPayload = (ArticleRequest | ImageRequest) & { type?: 'IMAGE_GENERATION' | 'ARTICLE_GENERATION' };

export const startWorker = async () => {
  console.log('👷 Starting Worker...');

  await rabbitMQService.consume(async (data: JobPayload) => {

    const jobType = data.type || 'ARTICLE_GENERATION';
    let withImages = false;

    console.log(`[Worker] Processing Job Type: ${jobType}`);

    try {
      if (jobType === 'IMAGE_GENERATION') {
        const imgData = data as ImageRequest;
        console.log(`[Worker] Generating Image for prompt: "${imgData.prompt}"`);

        const selectedTone = (imgData.tone as ToneImage) || 'artSchool';
        const toneGuideline = ToneImagePrompts[selectedTone] || ToneImagePrompts.artSchool;

        const prompt = promptImage(imgData, toneGuideline);

        const imagePath = await AIService.generateImage(prompt, imgData.webpFormat, imgData.imageMaxSizeKB);

        const payload: ImageWebhookResponse = {
          type: 'IMAGE',
          imagePath: env.NODE_ENV == production ? getPublicImageUrl(imagePath) : imagePath,
          status: GenerateStatus.COMPLETED,
          articleData: {
            id: imgData.articleData?.id,
            imageIndex: imgData.articleData?.imageIndex || 0,
          }
        };

        if (imgData.webhookUrl) {
          await sendWebhook(imgData.webhookUrl, payload);
        } else {
          console.log(`[Worker] Image generated at: ${imagePath}`);
        }

      } else {
        const artData = data as ArticleRequest;
        withImages = artData.imageCount > 0;
        const selectedTone = (artData.tone as Tone) || 'educational';
        const toneGuideline = TonePrompts[selectedTone] || TonePrompts.educational;

        const prompt = promptContent(artData, toneGuideline);

        console.log(`[Worker] Generating Article: "${artData.topic}" (${selectedTone})`);

        const result = await AIService.generateContent(prompt);
        const { title, cleanContent, imagePrompts } = extractArticleData(result);

        if (artData.webhookUrl) {
          const payload: ArticleWebhookResponse = {
            type: 'ARTICLE',
            topic: artData.topic,
            title: title,
            content: cleanContent,
            articleData: artData.articleData || {},
            status: withImages ? GenerateStatus.WAITING_FOR_IMAGES : GenerateStatus.COMPLETED,
            properties: {
              imageCount: artData.imageCount,
              imagePrompts: imagePrompts,
            }
          }
          await sendWebhook(artData.webhookUrl, payload);
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
          status: GenerateStatus.FAILED
        });
      }
      throw error;
    }
  });
};

async function sendWebhook(url: string, payload: any) {
  console.log(`[Webhook] Sending result to: ${url}`);
  try {
    await axios.post(url, payload, {
      headers: {
        'x-api-key': `${env.API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('[Webhook] Sent successfully.');
  } catch (webhookError) {
    console.error('[Webhook] Failed to send:', webhookError);
  }
}