import { Router, Request, Response } from 'express';
import { rabbitMQService } from '../../service/rabbitmq.service';
import { ImageRequest, imageRequestSchema } from '../../lib/schema/image';
import { rateLimit } from '../../middleware/rate-limit';

export const imageRouter = Router();

imageRouter.post('/generate', rateLimit({ windowMs: 60_000, max: 3 }), async (req: Request, res: Response): Promise<any> => {
  const validation = imageRequestSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error.message });
  }

  const payload: ImageRequest = validation.data;

  try {
    const queuePayload = {
      ...payload,
      type: 'IMAGE_GENERATION', 
      createdAt: new Date()
    };

    await rabbitMQService.publishToQueue(queuePayload);

    return res.status(202).json({ 
      success: true, 
      message: 'Image generation request queued.',
      data: {
        prompt: payload.prompt,
        status: 'queued',
        webhookUrl: payload.webhookUrl || 'Not provided'
      }
    });

  } catch (error: any) {
    console.error('[ImageRoute] Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to queue image job' });
  }
});