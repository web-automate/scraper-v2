import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import { randomUUID } from 'crypto';
import FormData from 'form-data';
import * as fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import s3Client from '../helper/aws-client';
import { getPublicImageUrl } from '../helper/cdn-url';
import { promptContent, promptEditImage, promptImage } from '../lib/constants/prompt';
import { queueNames } from '../lib/constants/queue-name';
import { GenerateStatus } from '../lib/enum/status-response';
import { extractArticleData } from '../lib/helper/article';
import { production } from '../lib/node-env';
import { ArticleRequest, ArticleWebhookResponse } from '../lib/schema/article';
import { ImageRequest, ImageWebhookResponse } from '../lib/schema/image';
import { Tone, TonePrompts } from '../lib/tone';
import { ToneImage, ToneImagePrompts } from '../lib/tone/image';
import { WebhookResponse } from '../routes/openapi';
import { rabbitMQService } from '../service/rabbitmq.service';
import { AiScraperService } from '../service/scraper.service';
import { EditImageQueuePayload } from './types';

const AIService = new AiScraperService();

export const startWorker = async () => {
  console.log('👷 Starting Workers...');

  await Promise.all([
    rabbitMQService.consume(queueNames.articleGenerator, processArticleJob),
    rabbitMQService.consume(queueNames.imageGenerator, processImageJob),
    rabbitMQService.consume(queueNames.editImage, processEditImageJob),
  ]);
};

async function processArticleJob(data: ArticleRequest) {
  console.log(`[Worker] Processing Article Job: ${data.topic}`);

  const payloadJob: WebhookResponse = {
    type: 'ARTICLE',
    status: GenerateStatus.GENERATING,
    articleData: data.articleData || {},
  };

  if (data.webhookUrl) {
    await sendWebhook(data.webhookUrl, payloadJob);
  }

  try {
    const withImages = (data.imageCount || 0) > 0;
    const selectedTone = (data.tone as Tone) || 'educational';
    const toneGuideline = TonePrompts[selectedTone];

    const prompt = promptContent(data, toneGuideline);

    const result = await AIService.generateContent(prompt);
    const { title, cleanContent, imagePrompts } = extractArticleData(result);

    if (data.webhookUrl) {
      const payload: ArticleWebhookResponse = {
        type: 'ARTICLE',
        topic: data.topic,
        title: title,
        content: cleanContent,
        articleData: data.articleData || {},
        status: withImages ? GenerateStatus.WAITING_FOR_IMAGES : GenerateStatus.COMPLETED,
        properties: {
          imageCount: data.imageCount || 0,
          imagePrompts: imagePrompts,
        },
      };
      await sendWebhook(data.webhookUrl, payload);
    } else {
      console.log('Snippet:', result.substring(0, 50) + '...');
    }
  } catch (error: any) {
    console.error(`[Worker] Article Processing failed: ${error.message}`);
    if (data.webhookUrl) {
      await sendWebhook(data.webhookUrl, {
        type: 'ARTICLE',
        error: error.message,
        status: GenerateStatus.FAILED,
      });
    }
  }
}

async function processImageJob(data: ImageRequest) {
  console.log(`[Worker] Processing Image Job: "${data.prompt}"`);

  const payloadJob: WebhookResponse = {
    type: 'IMAGE',
    status: GenerateStatus.GENERATING,
    articleData: data.articleData || {},
  };

  if (data.webhookUrl) {
    await sendWebhook(data.webhookUrl, payloadJob);
  }

  try {
    const selectedTone = (data.tone as ToneImage) || 'artSchool';
    const toneGuideline = ToneImagePrompts[selectedTone];

    const prompt = promptImage(data, toneGuideline);

    const imagePath = await AIService.generateImage(prompt, data.webpFormat, data.imageMaxSizeKB);

    const payload: ImageWebhookResponse = {
      type: 'IMAGE',
      imagePath: env.NODE_ENV == production ? getPublicImageUrl(imagePath) : imagePath,
      status: GenerateStatus.COMPLETED,
      articleData: {
        id: data.articleData?.id,
        imageIndex: data.articleData?.imageIndex || 0,
      },
    };

    if (data.webhookUrl) {
      await sendWebhook(data.webhookUrl, payload);
    } else {
      console.log(`[Worker] Image generated at: ${imagePath}`);
    }
  } catch (error: any) {
    console.error(`[Worker] Image Processing failed: ${error.message}`);
    if (data.webhookUrl) {
      await sendWebhook(data.webhookUrl, {
        type: 'IMAGE',
        error: error.message,
        status: GenerateStatus.FAILED,
      });
    }
  }
}

async function processEditImageJob(data: EditImageQueuePayload) {
  console.log(`[Worker] Processing Edit Image Job`);

  const payloadJob: WebhookResponse = {
    type: 'EDIT_IMAGE',
    status: GenerateStatus.GENERATING,
    articleData: data.articleData || {},
  };

  if (data.webhookUrl) {
    await sendWebhook(data.webhookUrl, payloadJob);
  }

  try {
    const selectedTone = (data.tone as ToneImage) || 'artSchool';
    const toneGuideline = ToneImagePrompts[selectedTone];
    const localFilePath = await handleDownloadFileS3(data.imagePath);
    console.log(`[Worker] Local file path: ${localFilePath}`);

    const prompt = promptEditImage(data, toneGuideline);

    const generatedImagePath = await AIService.generateEditImage(prompt, data.webpFormat, data.imageMaxSizeKB, localFilePath);

    const payload = {
      type: 'IMAGE',
      imagePath: generatedImagePath,
      status: GenerateStatus.COMPLETED,
      articleData: {
        id: data.articleData?.id,
        imageIndex: data.articleData?.imageIndex || 0,
      },
    };

    if (data.webhookUrl) {
      await sendWebhook(data.webhookUrl, payload, true);
    } else {
      console.log(`[Worker] Image generated at: ${generatedImagePath}`);
    }

    if (generatedImagePath && fs.existsSync(generatedImagePath)) {
      try {
        fs.rmSync(generatedImagePath, { force: true });
        console.log(`[Worker] Cleaned up source file: ${generatedImagePath}`);
      } catch (e) {
        console.error(`[Worker] Failed to cleanup source file: ${e}`);
      }
    }
  } catch (error: any) {
    console.error(`[Worker] Image Processing failed: ${error.message}`);
    if (data.webhookUrl) {
      await sendWebhook(data.webhookUrl, {
        type: 'IMAGE',
        error: error.message,
        status: GenerateStatus.FAILED,
      });
    }
  } finally {
    const client = s3Client;
    const deleteCommand = new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: data.s3Path,
    });
    try {
      await client.send(deleteCommand);
    } catch (error) {
      console.error(`[Worker] Failed to delete image from S3: ${(error as Error).message}`);
    }
    console.log(`[Worker] Image deleted from S3: ${data.s3Path}`);
  }
}

async function handleDownloadFileS3(s3SignedUrl: string): Promise<string> {
  const downloadDir = path.join(process.cwd(), 'downloads');

  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  const urlObj = new URL(s3SignedUrl);
  console.log(`[Worker] Downloading file from S3: ${s3SignedUrl}`);
  const fileName = `${randomUUID()}.png`;

  const localFilePath = path.join(downloadDir, fileName);

  try {
    const response = await axios.get(s3SignedUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });

    const writer = fs.createWriteStream(localFilePath);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', (err) => {
        writer.close();
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
        reject(err);
      });
    });

    console.log(`✅ File downloaded to: ${localFilePath}`);
    return localFilePath;

  } catch (error) {
    console.error('❌ Download failed:', error);
    throw error;
  }
}

async function sendWebhook(url: string, payload: any, withImage: boolean = false) {
  console.log(`[Webhook] Sending result to: ${url}`);
  try {
    if (withImage) {
      const form = new FormData();

      for (const [key, value] of Object.entries(payload)) {
        if (key === 'imagePath' && typeof value === 'string' && fs.existsSync(value)) {
          form.append('file', fs.createReadStream(value));
        } else if (typeof value === 'object') {
          form.append(key, JSON.stringify(value));
        } else {
          form.append(key, String(value));
        }
      }

      await axios.post(url, form, {
        headers: {
          ...form.getHeaders(),
          'x-api-key': `${env.API_KEY}`,
        },
      });
    } else {
      await axios.post(url, payload, {
        headers: {
          'x-api-key': `${env.API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
    }
    console.log('[Webhook] Sent successfully.');
  } catch (webhookError) {
    console.error('[Webhook] Failed to send:', webhookError);
  }
}