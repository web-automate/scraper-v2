import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Request, Response, Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { env } from 'node:process';
import s3Client from '../../helper/aws-client';
import { queueNames } from '../../lib/constants/queue-name';
import { GenerateStatus } from '../../lib/enum/status-response';
import { editImageRequestSchema, ImageRequest, imageRequestSchema, SuccessImageResponseType } from '../../lib/schema/image';
import { rabbitMQService } from '../../service/rabbitmq.service';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

export const imageRouter = Router();

imageRouter.post('/generate', async (req: Request, res: Response): Promise<any> => {
  const validation = imageRequestSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error.message });
  }

  const payload: ImageRequest = validation.data;
  const queueCount = await rabbitMQService.getQueueCount(queueNames.imageGenerator);

  try {
    const queuePayload = {
      ...payload,
      type: 'IMAGE_GENERATION',
      createdAt: new Date(),
      queueCount: queueCount + 1
    };

    await rabbitMQService.publishToQueue(queueNames.imageGenerator, queuePayload);

    const data: SuccessImageResponseType = {
      success: true,
      message: 'Image generation request queued.',
      data: {
        queue: queueCount + 1,
        prompt: payload.prompt,
        status: GenerateStatus.QUEUED,
        webhookUrl: payload.webhookUrl || 'Not provided'
      }
    }

    return res.status(202).json(data);

  } catch (error: any) {
    console.error('[ImageRoute] Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to queue image job' });
  }
});

imageRouter.post('/edit', upload.single('image'), async (req: Request, res: Response): Promise<any> => {
  if (!req.file) {
    return res.status(400).json({ error: "Image file is required." });
  }

  const rawData = {
    ...req.body,
    image: req.file
  };

  const validation = editImageRequestSchema.safeParse(rawData);

  if (!validation.success) {
    return res.status(400).json({ 
        error: "Validation Error", 
        details: validation.error.message 
    });
  }

  const payload = validation.data as any; 
  const queueCount = await rabbitMQService.getQueueCount(queueNames.editImage);

  const randomSuffix = randomUUID();
  const originalName = payload.image.originalname || 'image.png'; 
  const fileExtension = originalName.split('.').pop();
  const newFileName = `edit-${randomSuffix}.${fileExtension}`;

  try {
    const client = s3Client;
    
    const putCommand = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: newFileName,
      Body: payload.image.buffer,
      ContentType: payload.image.mimetype, 
    });

    await client.send(putCommand);

    const getCommand = new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: newFileName,
    });

    const signedUrl = await getSignedUrl(client, getCommand, { 
      expiresIn: 3600,
    });

    const queuePayload = {
      prompt: payload.prompt,
      tone: payload.tone,
      aspectRatio: payload.aspectRatio,
      webpFormat: payload.webpFormat,
      imageMaxSizeKB: payload.imageMaxSizeKB,
      imagePath: signedUrl,
      s3Path: newFileName,
      webhookUrl: payload.webhookUrl || 'Not provided',
      articleData: payload.articleData, 
      type: 'IMAGE_EDIT',
      createdAt: new Date(),
      queueCount: queueCount + 1
    };

    await rabbitMQService.publishToQueue(queueNames.editImage, queuePayload);

    const data: SuccessImageResponseType = {
      success: true,
      message: 'Image edit request queued.',
      data: {
        queue: queueCount + 1,
        prompt: payload.prompt,
        status: GenerateStatus.QUEUED,
        webhookUrl: payload.webhookUrl || 'Not provided'
      }
    }

    return res.status(202).json(data);

  } catch (error: any) {
    console.error('[ImageRoute] Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to queue image edit job' });
  }
});