import { AspectRatio } from "../lib/enum/aspect-ratio";
import { ToneImage } from "../lib/tone/image";

export type EditImageQueuePayload = {
  type: 'IMAGE_EDIT';
  prompt: string;
  tone?: ToneImage;
  aspectRatio?: AspectRatio;
  webpFormat?: boolean;
  imageMaxSizeKB?: number;
  imagePath: string; // Signed URL
  s3Path: string;
  webhookUrl: string;
  articleData?: {
    id: string;
    imageIndex: number;
  };
  createdAt: Date;
  queueCount: number;
};