import { Router, Request, Response } from 'express';
import { rabbitMQService } from '../../service/rabbitmq.service';
import { ArticleRequest, publicArticleSchema } from '../../lib/schema';
import { rateLimit } from '../../middleware/rate-limit';

export const articleRouter = Router();

articleRouter.get('/status', async (req: Request, res: Response): Promise<any> => {
  return res.status(200).json({ success: true, message: 'Status OK' });
});

articleRouter.post('/generate', rateLimit({ windowMs: 60_000, max: 3 }), async (req: Request, res: Response): Promise<any> => {
  const validation = publicArticleSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error.message });
  }

  const payload: ArticleRequest = validation.data;

  try {
    await rabbitMQService.publishToQueue(payload);

    return res.status(202).json({
      success: true,
      message: 'Request accepted and queued for processing.',
      data: {
        topic: payload.topic,
        status: 'queued',
        webhookUrl: payload.webhookUrl || 'Not provided (Result will be logged only)'
      }
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Failed to queue job' });
  }
});