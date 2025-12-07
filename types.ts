
export interface SavedImage {
  id: string;
  data: string; // Base64
  prompt: string;
  timestamp: number;
  model: string;
  type: 'generated' | 'edited';
  cloudUrl?: string; // URL from cloud storage
}

export interface PromptHistory {
  id: string;
  originalImage: string; // Base64 thumbnail
  generatedPrompt: string;
  type: 'image' | 'video';
  timestamp: number;
}

export enum AppView {
  IMAGINABLE = 'Imaginable',
  EDITABLE = 'Editable',
  PROMPTABLE = 'Promptable',
  COLLECTABLE = 'Collectable',
  ANY2TEXT = 'Any2Text',
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type ImageSize = '1K' | '2K' | '4K';

export enum GeminiModel {
  FLASH_IMAGE = 'gemini-2.5-flash-image', // Nano Banana
  PRO_IMAGE = 'gemini-3-pro-image-preview', // Nano Banana Pro
}

export interface GenerationConfig {
  prompt: string;
  model: GeminiModel;
  aspectRatio: AspectRatio;
  imageSize: ImageSize; // Only for Pro
  referenceImages: string[]; // Base64
  count: number;
}

// State Interfaces for View Persistence
export interface ImaginableState {
  prompt: string;
  model: GeminiModel;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  refImages: string[];
  count: number;
  generatedResults: { id: string; data: string; prompt: string; model: GeminiModel }[];
}

export interface EditableState {
  sourceImage: string | null;
  prompt: string;
  resultImage: string | null;
}

export interface PromptableState {
  image: string | null;
  history: PromptHistory[];
}

export interface Any2TextState {
  files: { name: string; type: string; data: string }[];
  result: string;
  isProcessing: boolean;
}
