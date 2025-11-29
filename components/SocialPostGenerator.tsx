

import React, { useState } from 'react';
import { MessageCircle, Copy, Check, Wand2, Globe, Share2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { SocialLanguage } from '../types';

interface SocialPostGeneratorProps {
  imagePrompt: string;
  storeName: string;
  imageUrl?: string;
}

export const SocialPostGenerator: React.FC<SocialPostGeneratorProps> = ({ imagePrompt, storeName, imageUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState<SocialLanguage>('Hebrew');

  const generate = async () => {
    setIsLoading(true);
    try {
      const text = await geminiService.generateSocialCaption(imagePrompt, storeName, language);
      setCaption(text);
    } catch (e) {
      console.error(e);
      setCaption("Could not generate caption. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!imageUrl || !caption) return;
    
    try {
        // Convert Base64 URL to File for sharing
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "jewelry_showcase.png", { type: "image/png" });

        if (navigator.share) {
            await navigator.share({
                title: storeName,
                text: caption,
                files: [file]
            });
        } else {
            alert("Sharing is not supported on this device/browser. Please download the image and copy the caption manually.");
        }
    } catch (e) {
        console.error("Error sharing:", e);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => {
          setIsOpen(true);
          if (!caption) generate();
        }}
        className="flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-gold-600 transition-colors"
      >
        <MessageCircle size={14} />
        Write Post
      </button>
    );
  }

  return (
    <div className="mt-4 bg-stone-50 rounded-lg p-3 border border-stone-200 animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-stone-500 uppercase">Social Media Caption</span>
        <div className="flex gap-2 items-center">
            
            <div className="relative group">
                <button className="p-1.5 hover:bg-white rounded-full text-stone-500 hover:text-gold-600 transition-colors flex items-center gap-1">
                    <Globe size={12} /> <span className="text-[10px] uppercase font-bold">{language.substring(0,2)}</span>
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white border border-stone-100 shadow-lg rounded-lg p-1 hidden group-hover:block z-10 w-24">
                    {['Hebrew', 'Arabic', 'English'].map(lang => (
                        <button 
                            key={lang}
                            onClick={() => { setLanguage(lang as SocialLanguage); generate(); }}
                            className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-stone-50 ${language === lang ? 'font-bold text-gold-600' : 'text-stone-600'}`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>

            <button 
                onClick={generate}
                disabled={isLoading}
                className="p-1.5 hover:bg-white rounded-full text-stone-500 hover:text-gold-600 transition-colors"
                title="Regenerate"
            >
                <Wand2 size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button 
                onClick={() => setIsOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-xs"
            >
                Close
            </button>
        </div>
      </div>
      
      {isLoading && !caption ? (
        <div className="h-16 flex items-center justify-center text-stone-400 text-xs">
          <Wand2 size={14} className="animate-spin mr-2" />
          Writing magic in {language}...
        </div>
      ) : (
        <div className="relative">
            <textarea 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                dir={language === 'English' ? 'ltr' : 'rtl'}
                className="w-full text-sm bg-white border border-stone-200 rounded p-2 text-stone-700 focus:outline-none focus:border-gold-400 resize-none h-24 mb-1"
            />
            <div className="flex justify-between items-center pt-1">
                <button 
                    onClick={handleShare}
                    className="flex items-center gap-1 text-xs font-bold text-gold-600 hover:text-gold-700"
                    title="Share to Apps"
                >
                    <Share2 size={14} /> Share
                </button>
                <button 
                    onClick={handleCopy}
                    className={`flex items-center gap-1 text-xs font-bold transition-colors ${copied ? 'text-green-600' : 'text-stone-400 hover:text-stone-600'}`}
                    title="Copy Text"
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};