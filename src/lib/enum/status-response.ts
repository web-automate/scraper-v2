export const GenerateStatus = {
  PENDING: 'pending',
  GENERATING: 'generating',
  WAITING_FOR_IMAGES: 'waiting_for_images',
  COMPLETED: 'completed',
  FAILED_CONTENT: 'failed_content',
  FAILED_IMAGES: 'failed_images', 
  FAILED: 'failed',
  DRAFT: 'draft',
  PUBLISHED: 'published' 
} as const;

export type GenerateStatusType = typeof GenerateStatus[keyof typeof GenerateStatus];
