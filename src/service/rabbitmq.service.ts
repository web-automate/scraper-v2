import amqp, { Channel, Connection, ConsumeMessage } from 'amqplib';
import { env } from '../config/env';

const QUEUE_NAME = 'scraping_queue';
const RABBITMQ_URL = `amqp://${env.RABBITMQ_USER}:${env.RABBITMQ_PASSWORD}@${env.RABBITMQ_HOST}:${env.RABBITMQ_PORT}/`; 

export class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  async connect() {
    try {
      console.log('🔌 Connecting to RabbitMQ...');
      this.connection = await amqp.connect(RABBITMQ_URL) as unknown as amqp.Connection;
      
      this.connection.on('error', (err: unknown) => {
        console.error('❌ RabbitMQ connection error:', err instanceof Error ? err.message : String(err));
      });

      this.connection.on('close', () => {
        console.warn('⚠️ RabbitMQ connection closed');
        this.channel = null;
      });

      this.channel = await (this.connection as any).createChannel() as amqp.ConfirmChannel;
      
      if (!this.channel) {
        throw new Error('Channel is null');
      }
      
      await this.channel.assertQueue(QUEUE_NAME, { durable: true });
      
      await this.channel.prefetch(1);
      
      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      process.exit(1);
    }
  }

  async publishToQueue(data: any) {
    if (!this.channel) throw new Error('Channel not initialized');
    
    const buffer = Buffer.from(JSON.stringify(data));
    this.channel.sendToQueue(QUEUE_NAME, buffer, { persistent: true });
    console.log(`[Producer] Job sent to queue: ${data.type || 'UNKNOWN_TYPE'}`);
  }

  async consume(workerHandler: (data: any) => Promise<void>) {
    if (!this.channel) throw new Error('Channel not initialized');

    this.channel.consume(QUEUE_NAME, async (msg: ConsumeMessage | null) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          console.log(`[Consumer] Processing job...`);
          
          await workerHandler(content);
          
          this.channel?.ack(msg);
          console.log(`[Consumer] Job Done & Acked`);
        } catch (error) {
          console.error(`[Consumer] Job Failed:`, error);
          this.channel?.ack(msg); 
        }
      }
    });
  }
}

export const rabbitMQService = new RabbitMQService();