import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: process.env.HOST || 'localhost',
  PORT: process.env.PORT || '3000',
  PROD_HOST: process.env.PROD_HOST,
  API_KEY: process.env.API_KEY,
  CDN_BASE_URL: process.env.CDN_BASE_URL,
  AI_PROVIDER: process.env.AI_PROVIDER || 'chatgpt', 
  DEBUG_PORT: process.env.DEBUG_PORT || '9222',
  CONTENT_DIR: process.env.CONTENT_DIR,
  RABBITMQ_HOST: process.env.RABBITMQ_HOST || 'localhost',
  RABBITMQ_PORT: process.env.RABBITMQ_PORT || '5672',
  RABBITMQ_USER: process.env.RABBITMQ_USER || 'guest',
  RABBITMQ_PASSWORD: process.env.RABBITMQ_PASSWORD || 'guest',
  RATE_LIMIT_WHITELIST: process.env.RATE_LIMIT_WHITELIST || '',
}