

export interface GeneratedImage {
  id: string;
  originalUrl: string; // Base64 or Blob URL
  watermarkedUrl?: string;
  prompt: string;
  angle: string;
}

export interface GeneratedVideo {
  id: string;
  videoUrl: string;
  prompt: string;
  aspectRatio: string;
}

export interface GenerationConfig {
  storeName: string;
  modelDescription: string;
  useWatermark: boolean;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum GenerationMode {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO'
}

export type WatermarkType = 'text' | 'logo';

export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export interface WatermarkSettings {
  enabled: boolean;
  type: WatermarkType;
  text?: string;
  logoUrl?: string;
  // Customization options for text
  textColor?: string;
  textFont?: string;
  textPosition?: WatermarkPosition; // Used for both Text and Logo positioning
  textSize?: number; // Scale factor (e.g., 50 = 5% of width)
}

export const ANGLES = [
  { id: 'portrait', label: 'Close-up Portrait', promptSuffix: 'Close-up portrait shot, high fashion photography, sharp focus on the jewelry.' },
  { id: 'waist-up', label: 'Waist-Up Editorial', promptSuffix: 'Waist-up fashion editorial shot, natural pose, elegant lighting.' },
  { id: 'side', label: 'Side Profile', promptSuffix: 'Artistic side profile angle, dramatic lighting, showcasing the jewelry silhouette.' }
];

export type ThemeColor = 'gold' | 'rose' | 'silver' | 'stone';
export type AppDirection = 'ltr' | 'rtl';
export type AppFont = 'serif' | 'sans' | 'hebrew' | 'arabic';
export type AppTextAlign = 'left' | 'center' | 'right';
export type SocialLanguage = 'Hebrew' | 'Arabic' | 'English';

export type ImageAspectRatio = '1:1' | '3:4' | '9:16' | '16:9';

export interface SocialPost {
  platform: 'Instagram' | 'Facebook' | 'TikTok';
  caption: string;
  hashtags: string[];
}

// CMS / Admin Definitions

export interface AppContent {
  heroTitle: string;
  heroSubtitle: string;
  photoModeLabel: string;
  videoModeLabel: string;
}

export interface AppFeatures {
  enablePhoto: boolean;
  enableVideo: boolean;
  showExamples: boolean;
}

export interface ExampleImage {
  label: string;
  url: string;
}

export interface CMSConfig {
  branding: {
    storeName: string;
    logoUrl?: string;
    theme: ThemeColor;
    backgroundColor: string; // Global background color
    primaryTextColor: string; // Global text color
    cardBackgroundColor: string; // Card/Box background color
    cardTextColor: string; // Card/Box text color
    fontFamily: AppFont;
    direction: AppDirection;
    textAlign: AppTextAlign;
  };
  content: AppContent;
  features: AppFeatures;
  watermark: WatermarkSettings;
  examples: ExampleImage[];
}