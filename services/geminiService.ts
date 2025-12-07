
import { GoogleGenAI, Part } from "@google/genai";
import { GeminiModel, ImageSize, AspectRatio } from "../types";

// Helper to ensure key selection for Pro models
export const ensureApiKey = async (model: string): Promise<void> => {
  if (model === GeminiModel.PRO_IMAGE) {
    // @ts-ignore - aistudio is injected in this specific runtime environment
    if (window.aistudio && window.aistudio.hasSelectedApiKey && window.aistudio.openSelectKey) {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
    }
  }
};

const getAiClient = () => {
  // Always create new instance to pick up potentially new key from environment
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateImages = async (
  prompt: string,
  model: GeminiModel,
  config: { aspectRatio: AspectRatio; imageSize: ImageSize; referenceImages: string[] }
): Promise<string[]> => {
  await ensureApiKey(model);
  const ai = getAiClient();

  const parts: Part[] = [];
  
  // Add reference images if any
  config.referenceImages.forEach(base64 => {
    parts.push({
      inlineData: {
        mimeType: 'image/png', // Assuming PNG for simplicity in base64 handling
        data: base64
      }
    });
  });

  parts.push({ text: prompt });

  const requestConfig: any = {
    imageConfig: {
      aspectRatio: config.aspectRatio,
    }
  };

  if (model === GeminiModel.PRO_IMAGE) {
    requestConfig.imageConfig.imageSize = config.imageSize;
    // Pro image might support tools like google_search, but we stick to base generation here
  }

  // Nano Banana series returns generateContent with image parts
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: requestConfig
    });

    const images: string[] = [];
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          images.push(part.inlineData.data);
        }
      }
    }
    return images;
  } catch (error) {
    console.error("Generation failed", error);
    throw error;
  }
};

export const editImage = async (
  base64Image: string,
  prompt: string
): Promise<string[]> => {
  const ai = getAiClient();
  
  // Using Flash Image for editing as requested ("Nano banana powered app")
  const model = GeminiModel.FLASH_IMAGE;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/png'
            }
          },
          { text: prompt }
        ]
      }
    });

    const images: string[] = [];
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          images.push(part.inlineData.data);
        }
      }
    }
    return images;
  } catch (error) {
    console.error("Editing failed", error);
    throw error;
  }
};

export const enhancePrompt = async (originalPrompt: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Improve this image generation prompt to be more detailed, artistic, and descriptive. Keep it under 50 words. \n\nPrompt: "${originalPrompt}"`,
    });
    return response.text || originalPrompt;
  } catch (e) {
    return originalPrompt;
  }
};

export const analyzeImageForPrompt = async (
  base64Image: string,
  type: 'image' | 'video',
  aspectRatio?: string
): Promise<string> => {
  const ai = getAiClient();
  // Using Pro for complex analysis
  const model = 'gemini-3-pro-preview'; 

  let instruction = type === 'video' 
    ? "Analyze this image and write a high-quality prompt for a video generation model (like Veo) to animate this scene. Describe motion, camera angles, and lighting."
    : "Analyze this image and write a detailed prompt that could be used to re-generate a similar image using an AI model. Focus on style, subject, composition, and lighting.";

  if (aspectRatio) {
    instruction += ` The target output aspect ratio for the generated content should be ${aspectRatio}. Include this parameter in the prompt description where appropriate (e.g. --ar ${aspectRatio}).`;
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: instruction }
        ]
      }
    });
    return response.text || "Failed to generate prompt.";
  } catch (error) {
    console.error("Analysis failed", error);
    throw error;
  }
};

export const convertMediaToText = async (
  files: { mimeType: string; data: string }[]
): Promise<string> => {
  const ai = getAiClient();
  const model = 'gemini-3-pro-preview'; // Strong multimodal model

  const parts: Part[] = [];
  
  files.forEach(file => {
      parts.push({
          inlineData: {
              mimeType: file.mimeType,
              data: file.data
          }
      });
  });

  parts.push({ text: "Analyze these files. Convert any audio/video speech to text, extract text from images/documents, and provide a comprehensive description/transcription of the content. Organize the output clearly." });

  try {
      const response = await ai.models.generateContent({
          model: model,
          contents: { parts }
      });
      return response.text || "No text extracted.";
  } catch (error) {
      console.error("Conversion failed", error);
      throw error;
  }
};
