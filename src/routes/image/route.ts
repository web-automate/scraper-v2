import { Request, Response, Router } from 'express';
import { GenerateStatus } from '../../lib/enum/status-response';
import { ImageRequest, imageRequestSchema, SuccessImageResponseType } from '../../lib/schema/image';
import { rabbitMQService } from '../../service/rabbitmq.service';

export const imageRouter = Router();

imageRouter.post('/generate', async (req: Request, res: Response): Promise<any> => {
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

    const data: SuccessImageResponseType = {
      success: true,
      message: 'Image generation request queued.',
      data: {
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