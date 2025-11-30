-- FORCE RESET TO JEWELRY STORE
-- Run this in Supabase SQL Editor to reset everything to the Jewelry Store defaults

UPDATE public.profiles
SET 
  store_name = 'Gemini Jewelry Studio',
  theme = 'gold',
  logo_url = null,
  config = '{
    "branding": {
      "storeName": "Gemini Jewelry Studio",
      "theme": "gold",
      "backgroundColor": "#fafaf9",
      "primaryTextColor": "#1c1917",
      "cardBackgroundColor": "#ffffff",
      "cardTextColor": "#1c1917",
      "fontFamily": "serif",
      "direction": "ltr",
      "textAlign": "left"
    },
    "content": {
      "heroTitle": "Create Professional Model Photos",
      "heroSubtitle": "Upload your product, describe the look, and get magazine-quality shots in seconds.",
      "photoModeLabel": "Photoshoot",
      "videoModeLabel": "Animate (Veo)"
    },
    "features": {
      "enablePhoto": true,
      "enableVideo": true,
      "showExamples": true
    },
    "watermark": {
      "enabled": true,
      "type": "text",
      "text": "My Jewelry Store",
      "textSize": 50,
      "textPosition": "bottom-right",
      "textColor": "#ffffff",
      "textFont": "\"Playfair Display\", serif"
    },
    "examples": [
      {
        "label": "Diamond Ring",
        "url": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80"
      },
      {
        "label": "Gold Necklace",
        "url": "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?auto=format&fit=crop&w=600&q=80"
      },
      {
        "label": "Luxury Watch",
        "url": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80"
      }
    ]
  }'::jsonb;
