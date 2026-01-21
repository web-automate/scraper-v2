import axios from 'axios';
import { rabbitMQService } from '../service/rabbitmq.service';
import { ArticleRequest } from '../lib/schema';
import { AiScraperService } from '../service/scraper.service';
import { TonePrompts, Tone } from '../lib/tone'; 

const AIService = new AiScraperService();

export const startWorker = async () => {
  console.log('Starting Worker...');

  await rabbitMQService.consume(async (data: ArticleRequest) => {
    
    const selectedTone = (data.tone as Tone) || 'educational';
    const toneGuideline = TonePrompts[selectedTone] || TonePrompts.educational;

    const prompt = `
      Generate a detailed article based on the following specifications:
      TASK SPECIFICATION:
      Topic: ${data.topic}
      Keywords: ${data.keywords?.join(', ') || 'None'}
      Category: ${data.category || 'General'}
      ${toneGuideline}
          `.trim();

    try {
      console.log(`[Worker] Processing topic: "${data.topic}" with tone: "${selectedTone}"`);

      const result = await AIService.generateContent(prompt);

      if (data.webhookUrl) {
        console.log(`Sending result to webhook: ${data.webhookUrl}`);
        try {
          await axios.post(data.webhookUrl, {
            topic: data.topic,
            content: result,
            status: 'completed'
          });
        } catch (webhookError) {
          console.error('Webhook failed:', webhookError);
        }
      } else {
        console.log('No webhook URL provided. Result generated but nowhere to send.');
        console.log('Snippet:', result.substring(0, 50) + '...');
      }

    } catch (error: any) {
      console.error('Worker processing failed:', error.message);
      
      if (data.webhookUrl) {
        try {
          await axios.post(data.webhookUrl, {
            topic: data.topic,
            error: error.message,
            status: 'failed'
          });
        } catch (_) {}
      }
      throw error; 
    }
  });
};