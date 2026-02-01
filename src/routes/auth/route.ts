// src/routes/auth.route.ts
import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { GenerateSecretRequest, GenerateSecretRequestSchema } from '../../lib/schema/auth';

export const authRouter = Router();

authRouter.post('/secret', async (req: Request, res: Response): Promise<any> => {
  const validation = GenerateSecretRequestSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ success: false, error: validation.error.message });
  }

  const payload: GenerateSecretRequest = validation.data;
  const validMasterKey = process.env.API_KEY;
  const jwtSecret = process.env.JWT_SECRET;

  if (!validMasterKey || !jwtSecret) {
    return res.status(500).json({ success: false, error: 'Server misconfiguration' });
  }

  const token = jwt.sign(
    { email: payload.email, apiKey: validMasterKey },
    jwtSecret,
    { expiresIn: '24h' }
  );

  return res.status(200).json({
    success: true,
    message: 'Secret token generated successfully',
    token: token,
    expiresIn: '24h'
  });
});