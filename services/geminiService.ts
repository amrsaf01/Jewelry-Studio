import { GoogleGenAI } from "@google/genai";
import { ANGLES, GeneratedImage, GeneratedVideo, SocialLanguage, ImageAspectRatio } from "../types";

const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
const GEMINI_TEXT_MODEL = 'gemini-2.5-flash';
const VEO_MODEL = 'veo-3.1-fast-generate-preview';

export class GeminiService {

  private getAI() {
    // Always get a fresh instance to capture the latest API key from process.env (which might be updated by window.aistudio selection)
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API Key is missing!");
    }
    return new GoogleGenAI({ apiKey: apiKey || '' });
  }

  async generateShowcase(
    base64Image: string,
    modelDescription: string,
    mimeType: string,
    aspectRatio: ImageAspectRatio = '1:1',
    backgroundBase64?: string,
    backgroundMimeType?: string
  ): Promise<GeneratedImage[]> {

    const ai = this.getAI();

    // We initiate 3 parallel requests for the 3 angles
    // We handle errors individually so that one failure doesn't fail the entire batch
    const promises = ANGLES.map(async (angle): Promise<GeneratedImage | { error: string } | null> => {
      try {
        let prompt = `
          You are a professional jewelry photographer and editor.
          I have uploaded an image of a piece of jewelry.
          
          Task: Generate a photorealistic image of a model wearing this EXACT piece of jewelry.
          Model Description: ${modelDescription}.
          Shot Type: ${angle.promptSuffix}.
        `;

        const parts: any[] = [
          { inlineData: { mimeType: mimeType, data: base64Image } }
        ];

        if (backgroundBase64 && backgroundMimeType) {
          prompt += `
            
            I have also uploaded a background image.
            CONTEXT: The user wants the model to appear in this specific location (e.g. their store or a specific venue).
            
            REQUIREMENTS:
            1. Use the provided background image as the environment/setting for the photoshoot.
            2. Composite the model seamlessly into this background.
            3. CRITICAL: Maintain the perspective, lighting direction, and atmosphere of the background image to ensure REALSIM.
            4. Do not just paste the model; blend shadows and reflections so it looks like the photo was taken there.
            `;
          // Add background image to parts
          parts.push({ inlineData: { mimeType: backgroundMimeType, data: backgroundBase64 } });
        } else {
          prompt += `
            Background: Create a setting that matches the model description (e.g., studio, outdoors, luxury interior).
            `;
        }

        prompt += `
          CRITICAL PRODUCT REQUIREMENTS:
          1. The jewelry in the output MUST look exactly like the provided input jewelry image. Do not alter the design, gems, or metal of the jewelry.
          2. High resolution, professional fashion magazine quality.
        `;

        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
          model: GEMINI_IMAGE_MODEL,
          contents: {
            parts: parts
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio
            }
          }
        });

        // Parse response to find image
        let generatedBase64 = '';
        const partsResponse = response.candidates?.[0]?.content?.parts;

        if (partsResponse) {
          for (const part of partsResponse) {
            if (part.inlineData && part.inlineData.data) {
              generatedBase64 = part.inlineData.data;
              break;
            }
          }
        }

        if (!generatedBase64) {
          // Attempt to extract text error from model if image is missing
          const textPart = partsResponse?.find(p => p.text)?.text;
          const finishReason = response.candidates?.[0]?.finishReason;

          console.warn(`Generation issue for ${angle.label}: Reason=${finishReason}, Text=${textPart?.substring(0, 100)}`);

          if (finishReason === 'SAFETY') {
            throw new Error(`Blocked by safety filters.`);
          }
          if (textPart) {
            throw new Error(`Model returned text instead of image: ${textPart.substring(0, 50)}...`);
          }
          throw new Error(`No image generated.`);
        }

        return {
          id: crypto.randomUUID(),
          originalUrl: `data:image/png;base64,${generatedBase64}`,
          prompt: angle.promptSuffix,
          angle: angle.label
        };

      } catch (error: any) {
        console.error(`Error generating ${angle.label}:`, error);
        return { error: error.message || "Unknown error" };
      }
    });

    const results = await Promise.all(promises);

    // Filter out failed requests
    const successfulImages = results.filter((res): res is GeneratedImage => res !== null && !('error' in res));
    const errors = results.filter((res): res is { error: string } => res !== null && 'error' in res);

    if (successfulImages.length === 0) {
      const uniqueErrors = Array.from(new Set(errors.map(e => e.error))).join(', ');
      throw new Error(`Generation failed: ${uniqueErrors}`);
    }

    return successfulImages;
  }

  async generateVideo(
    base64Image: string,
    prompt: string,
    mimeType: string,
    aspectRatio: '16:9' | '9:16'
  ): Promise<GeneratedVideo> {
    const ai = this.getAI();

    let operation = await ai.models.generateVideos({
      model: VEO_MODEL,
      prompt: prompt || "Cinematic product showcase, elegant camera movement, sparkling lighting",
      image: {
        imageBytes: base64Image,
        mimeType: mimeType
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation failed to return a download link.");
    }

    // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    const videoUrl = URL.createObjectURL(blob);

    return {
      id: crypto.randomUUID(),
      videoUrl: videoUrl,
      prompt: prompt,
      aspectRatio: aspectRatio
    };
  }

  async generateSocialCaption(
    prompt: string,
    storeName: string,
    language: SocialLanguage = 'Hebrew'
  ): Promise<string> {
    const ai = this.getAI();

    const response = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: `
        You are a social media manager for a jewelry brand named "${storeName || 'our brand'}".
        Write a short, engaging, and elegant Instagram caption for a photo with this description:
        "${prompt}"

        Requirements:
        - Language: ${language} (Write ONLY in this language).
        - Tone: Sophisticated, Luxury, Engaging.
        - Include 5 relevant hashtags in the same language.
        - Include call to action (Link in bio).
        - Use emojis sparingly but effectively.
        - KEEP IT UNDER 50 WORDS (excluding hashtags).
      `
    });

    return response.text || "Check out our latest collection! #jewelry #luxury";
  }
}

export const geminiService = new GeminiService();