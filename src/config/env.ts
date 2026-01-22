import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: process.env.HOST || 'localhost',
  PORT: process.env.PORT || '3000',
  PROD_HOST: process.env.PROD_HOST,
  CDN_BASE_URL: process.env.CDN_BASE_URL,
  AI_PROVIDER: process.env.AI_PROVIDER || 'chatgpt', 
  DEBUG_PORT: process.env.DEBUG_PORT || '9222',
  CONTENT_DIR: process.env.CONTENT_DIR,
  RABBITMQ_HOST: process.env.RABBITMQ_HOST || 'localhost',
  RABBITMQ_PORT: process.env.RABBITMQ_PORT || '5672',
  RABBITMQ_USER: process.env.RABBITMQ_USER || 'guest',
  RABBITMQ_PASSWORD: process.env.RABBITMQ_PASSWORD || 'guest',
}