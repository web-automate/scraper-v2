import { Request, Response, Router } from 'express';
import { GenerateStatus } from '../../lib/enum/status-response';
import { ArticleRequest, publicArticleSchema, SuccessArticleResponse } from '../../lib/schema/article';
import { apiKeyAuth } from '../../middleware/auth';
import { rabbitMQService } from '../../service/rabbitmq.service';

export const articleRouter = Router();

articleRouter.post('/generate', apiKeyAuth, async (req: Request, res: Response): Promise<any> => {
  const validation = publicArticleSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error.message });
  }

  const payload: ArticleRequest = validation.data;

  try {
    await rabbitMQService.publishToQueue(payload);

    const data: SuccessArticleResponse = {
      success: true,
      message: 'Request accepted and queued for processing.',
      data: {
        status: GenerateStatus.GENERATING,
        webhookUrl: payload.webhookUrl || 'Not provided (Result will be logged only)',
        articleData: payload.articleData || {},
      }
    }

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