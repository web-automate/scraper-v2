import { getAspectRatioInstruction } from "../enum/aspect-ratio";
import { ArticleRequest } from "../schema/article";
import { ImageRequest } from "../schema/image";
import { imagePlaceholder, imagePromptGenerator } from "../tone";

export const promptContent = (artData: ArticleRequest, toneGuideline: string) => `
  Generate a detailed article based on the following specifications:

  TASK SPECIFICATION:
  - Topic: ${artData.topic}
  - Keywords: ${artData.keywords?.join(', ') || 'None'}
  - Category: ${artData.category || 'General'}
  
  TONE & STYLE GUIDELINES:
  ${toneGuideline}

  VISUAL ASSETS CONFIGURATION:
  - Total Images Requested: ${artData.imageCount || 0}
  ${artData.imageCount > 0
        ? `
  ${imagePlaceholder.replace('{{IMAGE_COUNT}}', artData.imageCount.toString())}
  ${imagePromptGenerator}
    `.trim()
        : 'No images or placeholders required for this article.'}

  CRITICAL INSTRUCTION:
  Ensure the transition between the article body and the JSON image prompts is seamless using the specified delimiters.
`.trim();

export const promptImage = (imgData: ImageRequest, toneGuideline: string) => `
        Generative Image Prompt Structure
        ---------------------------------

        [SUBJECT / CONTENT]
        ${imgData.prompt.trim()}

        [ARTISTIC STYLE & TONE]
        ${toneGuideline.trim()}

        [COMPOSITION & DIMENSIONS]
        Target Aspect Ratio: ${imgData.aspectRatio}
        Framing Guideline: ${getAspectRatioInstruction(imgData.aspectRatio)}
        Ensure the subject is framed correctly according to this ratio (e.g., don't crop heads in vertical, fill sides in horizontal).

        [OUTPUT CONSTRAINTS]
        CRITICAL: Generate exactly ONE single image frame. Do not create a grid, collage, split-screen, or multiple panels. The final output must be a singular, cohesive composition.

        [SYNTHESIS INSTRUCTIONS]
        Combine the subject content with the artistic tone and composition guidelines seamlessly.
        `.trim();