import { Request, Response, Router } from 'express';
import { queueNames } from '../../lib/constants/queue-name';
import { GenerateStatus } from '../../lib/enum/status-response';
import { ArticleRequest, publicArticleSchema, SuccessArticleResponse } from '../../lib/schema/article';
import { rabbitMQService } from '../../service/rabbitmq.service';

export const articleRouter = Router();

articleRouter.get('/health', (req: Request, res: Response): any => {
  return res.status(200).json({
    success: true,
    message: 'Article Service is healthy',
  });
});

articleRouter.post('/generate', async (req: Request, res: Response): Promise<any> => {
  const validation = publicArticleSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error.message });
  }

  const payload: ArticleRequest = validation.data;

  console.log(`[Route] Received Article Request: ${JSON.stringify(payload)}`);

  try {
    await rabbitMQService.publishToQueue(queueNames.articleGenerator, payload);

    const data: SuccessArticleResponse = {
      success: true,
      message: 'Request accepted and queued for processing.',
      data: {
        status: GenerateStatus.QUEUED,
        webhookUrl: payload.webhookUrl || 'Not provided (Result will be logged only)',
        articleData: payload.articleData || {},
      }
    }

    console.log(`[Route] Generated Article Request: ${JSON.stringify(payload)}`);

    return res.status(202).json(data);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to queue job',
      data: {
        status: GenerateStatus.FAILED,
      }
    });
  }
});