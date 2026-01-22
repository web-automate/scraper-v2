import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from '../lib/openapi.registry';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { env } from './env';
import { production } from '../lib/node-env';

async function generateOpenAPI() {
  console.log('🔍 Scanning for OpenAPI definitions...');

  const routeFiles = await glob('src/routes/**/openapi.ts', { 
    cwd: process.cwd(), 
    absolute: true    
  });

  const serverUrl = env.NODE_ENV === production
  ? `https://${env.PROD_HOST}`
  : `http://${env.HOST}:${env.PORT}`;

  if (routeFiles.length === 0) {
    console.warn('⚠️ No .openapi.ts files found in src/routes!');
  }

  for (const filePath of routeFiles) {
    await import(filePath); 
    console.log(`   - Loaded: ${path.relative(process.cwd(), filePath)}`); 
  }

  console.log('📝 Generating JSON Document...');

  const generator = new OpenApiGeneratorV3(registry.definitions);

  const document = generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'AI Scraper API (Zod Powered)',
      version: '1.0.0',
      description: 'Dokumentasi otomatis dari Zod Schema',
    },
    servers: [{ 
      url: serverUrl,
      description: env.NODE_ENV === production ? 'Production server' : 'Development server',
     }],
  });

  const outputPath = path.join(process.cwd(), 'data', 'swagger', 'swagger-output.json');
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`✅ OpenAPI JSON generated successfully at: ${outputPath}`);
}

generateOpenAPI().catch((err) => {
  console.error('❌ Failed to generate OpenAPI docs:', err);
  process.exit(1);
});