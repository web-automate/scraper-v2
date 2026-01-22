import { env } from '../config/env'; 

export const getPublicImageUrl = (filename: string): string => {
  const cleanName = filename.replace(/^.*[\\\/]/, '');
  return `${env.CDN_BASE_URL}/images/${cleanName}`;
};