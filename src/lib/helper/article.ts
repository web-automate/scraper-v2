import { ToneImageEnum } from "../tone/image";

export interface ImagePrompt {
  index: number;
  tone: ToneImageEnum;
  prompt: string;
}

export interface ExtractedArticle {
  title: string;
  cleanContent: string;
  imagePrompts: ImagePrompt[];
}

export const extractArticleData = (content: string): ExtractedArticle => {
  let workingContent = content.trim();
  let imagePrompts: ImagePrompt[] = [];

  const startMarker = "---START_IMAGE_JSON---";
  const endMarker = "---END_IMAGE_JSON---";
  
  const startIndex = workingContent.indexOf(startMarker);
  const endIndex = workingContent.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    try {
      const jsonString = workingContent
        .substring(startIndex + startMarker.length, endIndex)
        .trim();
      
      console.log("[Parser] JSON String length:", jsonString.length);
      console.log("[Parser] JSON String:", jsonString);
      
      const parsed = JSON.parse(jsonString);
      imagePrompts = parsed.images || [];
      
      console.log("[Parser] Berhasil parse:", imagePrompts.length, "images");
    } catch (e) {
      console.error("[Parser] Gagal memproses JSON image prompts:", e);
      
      const jsonString = workingContent
        .substring(startIndex + startMarker.length, endIndex)
        .trim();
      
      console.error("[Parser] Raw JSON (first 200 chars):", jsonString.substring(0, 200));
      console.error("[Parser] Raw JSON (last 200 chars):", jsonString.substring(Math.max(0, jsonString.length - 200)));
    }
    
    workingContent = 
      workingContent.substring(0, startIndex) + 
      workingContent.substring(endIndex + endMarker.length);
    workingContent = workingContent.trim();
  }

  const lines = workingContent.split('\n');
  
  if (lines.length === 0 || !workingContent) {
    return { title: '', cleanContent: '', imagePrompts: [] };
  }

  const rawTitle = lines[0];
  const title = rawTitle.replace(/^[#* \t]+|[#* \t]+$/g, '').trim();
  const cleanContent = lines.slice(1).join('\n').trim();

  return { title, cleanContent, imagePrompts };
};