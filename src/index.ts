import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import { Server } from 'http';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { apiKeyAuth } from './middleware/auth';
import { rateLimit } from './middleware/rate-limit';
import { articleRouter } from './routes/article/route';
import { authRouter } from './routes/auth/route';
import { imageRouter } from './routes/image/route';
import { browserService } from './service/browser.service';
import { rabbitMQService } from './service/rabbitmq.service';
import { sessionMonitor } from './service/session-monitor.service';
import { startWorker } from './worker/scraper.worker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const CHROME_DATA_DIR = path.join(process.cwd(), 'chrome_data_prod');

const swaggerPath = path.join(process.cwd(), './data/swagger/swagger-output.json');
let swaggerFile: any;

if (fs.existsSync(swaggerPath)) {
  const fileContent = fs.readFileSync(swaggerPath, 'utf-8');
  swaggerFile = JSON.parse(fileContent);
}

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

const whitelistArray = (env.RATE_LIMIT_WHITELIST || '')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  whitelist: whitelistArray,
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

if (swaggerFile) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
    app.use('/api/docs.json', (req: Request, res: Response) => {
      res.json(swaggerFile);
    });
    console.log('✅ Swagger UI available at /api/docs');
} else {
  console.log('⚠️ Swagger documentation file not found. Swagger UI will not be available.');
}

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'src/lib/html/index.html'));
});
app.get('/favicon.ico', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'src/lib/html/assets/favicon.ico'));
});
app.get('/robots.txt', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'src/lib/html/robots.txt'));
});
app.get('/sitemap.xml', (req: Request, res: Response) => {
  res.header('Content-Type', 'application/xml'); // Penting biar browser tau ini XML
  res.sendFile(path.join(process.cwd(), 'src/lib/html/sitemap.xml'));
});
app.get('/manifest.json', (req: Request, res: Response) => {
  res.header('Content-Type', 'application/json');
  res.sendFile(path.join(process.cwd(), 'src/lib/html/assets/manifest.json'));
});
app.get('/og-image.png', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'src/lib/html/assets/og-image.png'));
});
app.get('/css/style.css', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'src/lib/html/assets/css/style.css'));
});
app.get('/css/style.css', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'src/lib/html/assets/css/style.css'));
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    success: true, 
    message: 'System Healthy', 
    timestamp: new Date().toISOString() 
  });
});

app.use('/api/auth', limiter, authRouter);
app.use('/api/article', limiter, apiKeyAuth, articleRouter);
app.use('/api/image', limiter, apiKeyAuth, imageRouter);
app.use('/api/auth', limiter, authRouter);
app.use('/api/article', limiter, apiKeyAuth, articleRouter);
app.use('/api/image', limiter, apiKeyAuth, imageRouter);
app.use('/api/auth', limiter, authRouter);
app.use('/api/article', limiter, apiKeyAuth, articleRouter);
app.use('/api/image', limiter, apiKeyAuth, imageRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

let server: Server;

const startApp = async () => {
  try {
    console.log('\n--- 🚀 STARTING SERVICES ---\n');
    console.log(`\n--- ${env.AI_PROVIDER.toUpperCase()} ---\n`);
    
    console.log('[1/4] 🌐 Launching Browser Service...');
    await browserService.launch();
    await browserService.initSession(`session-${env.AI_PROVIDER}`);
    await browserService.launch();
    await browserService.initSession(`session-${env.AI_PROVIDER}`);
    console.log('      ✅ Browser Ready');

    sessionMonitor.start();

    console.log('[2/4] 🐰 Connecting to RabbitMQ...');
    try {
      await rabbitMQService.connect();
      console.log('      ✅ RabbitMQ Connected');
    } catch (e) {
      console.error('      ❌ RabbitMQ Connection Failed. Ensure RabbitMQ is running.');
      throw e;
    }

    console.log('[3/4] 👷 Starting Background Worker...');
    await startWorker();
    console.log('      ✅ Worker Started');

    console.log('[4/4] 🔌 Starting API Server...');
    server = app.listen(PORT, () => {
      console.log(`\n✅ SYSTEM READY!`);
      console.log(`--------------------------------------------------`);
      console.log(`📡 API Server   : http://localhost:${PORT}`);
      console.log(`📑 Swagger Docs : http://localhost:${PORT}/api/docs`); 
      console.log(`💓 Health Check : http://localhost:${PORT}/health`);
      console.log(`📝 Generate     : POST http://localhost:${PORT}/api/article/generate`);
      console.log(`--------------------------------------------------\n`);
    });

  } catch (err) {
    console.error('\n❌ CRITICAL STARTUP ERROR:', err);
    await gracefulShutdown('STARTUP_FAILURE');
  }
};

const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  if (server) {
    console.log('Stopping HTTP Server...');
    server.close(() => console.log('HTTP Server closed.'));
  }

  console.log('Closing Browser...');
  try {
    browserService.kill();
    console.log('Browser process terminated.');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (e) {
    console.error('Error closing browser:', e);
  }

  console.log('Cleaning up Chrome Data...');
  try {
    if (fs.existsSync(CHROME_DATA_DIR)) {
      fs.rmSync(CHROME_DATA_DIR, { recursive: true, force: true });
      console.log(`✅ Deleted: ${CHROME_DATA_DIR}`);
    } else {
      console.log(`ℹ️ Directory not found: ${CHROME_DATA_DIR}`);
    }
  } catch (e) {
    console.error(`❌ Failed to delete ${CHROME_DATA_DIR}:`, e);
  }
  process.exit(signal === 'STARTUP_FAILURE' ? 1 : 0);
};

startApp();

process.on('SIGINT', () => gracefulShutdown('SIGINT'));  
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));