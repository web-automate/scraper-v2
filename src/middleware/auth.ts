import { Request, Response, NextFunction } from 'express';

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY;

  if (!validKey) {
    console.error('API_KEY is not defined in environment variables');
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error: Security misconfiguration'
    });
  }

  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing API Key'
    });
  }

  next();
};