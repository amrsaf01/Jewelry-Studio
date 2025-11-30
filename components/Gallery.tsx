import React, { useState, useEffect } from 'react';
import { GeneratedImage, WatermarkSettings } from '../types';
import { Download, RefreshCw, X } from 'lucide-react';
import { addWatermark } from '../utils/imageUtils';
import { SocialPostGenerator } from './SocialPostGenerator';

interface GalleryProps {
  images: GeneratedImage[];
  watermarkSettings: WatermarkSettings;
  storeName: string;
  onRegenerate: () => void;
}

export const Gallery: React.FC<GalleryProps> = ({ images, watermarkSettings, storeName, onRegenerate }) => {
  const [processedImages, setProcessedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  useEffect(() => {
    const processImages = async () => {
      if (!watermarkSettings.enabled ||
        (watermarkSettings.type === 'text' && !watermarkSettings.text?.trim()) ||
        (watermarkSettings.type === 'logo' && !watermarkSettings.logoUrl)
      ) {
        setProcessedImages(images);
        return;
      }

      const updated = await Promise.all(images.map(async (img) => {
        try {
          const watermarked = await addWatermark(img.originalUrl, watermarkSettings);
          return { ...img, watermarkedUrl: watermarked };
        } catch (e) {
          console.error("Watermark error", e);
          return img;
        }
      }));
      setProcessedImages(updated);
    };

    processImages();
  }, [images, watermarkSettings]);

  const handleDownload = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = watermarkSettings.enabled && img.watermarkedUrl ? img.watermarkedUrl : img.originalUrl;
    link.download = `jewelry-showcase-${img.angle}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-end items-end border-b border-stone-200 pb-4">
        <button
          onClick={onRegenerate}
          className="text-stone-500 hover:text-gold-600 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <RefreshCw size={16} />
          Generate New Set
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {processedImages.map((img) => (
          <div key={img.id} className="group flex flex-col">
            <div
              className="relative bg-white rounded-xl shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 transition-transform hover:-translate-y-1 duration-300 cursor-pointer"
              onClick={() => setSelectedImage(img)}
            >
              <div className="aspect-[3/4] overflow-hidden bg-stone-100 relative">
                <img
                  src={watermarkSettings.enabled && img.watermarkedUrl ? img.watermarkedUrl : img.originalUrl}
                  alt={img.angle}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div className="w-full">
                    <p className="text-white font-serif text-lg">{img.angle}</p>
                    <p className="text-white/80 text-xs line-clamp-2">{img.prompt}</p>
                    <p className="text-white/60 text-[10px] mt-2 uppercase tracking-widest">Click to Expand</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white flex justify-between items-center border-t border-stone-50">
                <span className="text-xs font-bold tracking-wider text-stone-400 uppercase">
                  {watermarkSettings.enabled ? 'Branded' : 'Raw Image'}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload(img); }}
                  className="p-2 rounded-full bg-gold-50 text-gold-600 hover:bg-gold-600 hover:text-white transition-colors"
                  title="Download"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>

            {/* Social Post Integration */}
            <div className="mt-2 px-2">
              <SocialPostGenerator
                imagePrompt={img.prompt}
                storeName={storeName}
                imageUrl={watermarkSettings.enabled && img.watermarkedUrl ? img.watermarkedUrl : img.originalUrl}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img
              src={watermarkSettings.enabled && selectedImage.watermarkedUrl ? selectedImage.watermarkedUrl : selectedImage.originalUrl}
              alt={selectedImage.angle}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />

            <div className="absolute top-4 right-4 flex gap-3">
              <button
                onClick={() => handleDownload(selectedImage)}
                className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-colors"
                title="Download"
              >
                <Download size={24} />
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-white/80 font-serif text-xl">{selectedImage.angle}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};