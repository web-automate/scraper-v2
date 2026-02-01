import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
dotenv.config();

interface JwtPayload {
  email: string;
  apiKey: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-access-token'] as string || req.headers['x-api-key'] as string || req.headers['authorization']?.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined in environment variables');
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error: Security misconfiguration'
    });
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing Access Token'
    });
  }

  if (token === process.env.API_KEY) {
    req.user = {
      email: 'admin@system',
      apiKey: process.env.API_KEY || ''
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (decoded.apiKey !== process.env.API_KEY) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: The API Key signature in this token is no longer valid'
      });
    }

    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or Expired Token'
    });
  }
};