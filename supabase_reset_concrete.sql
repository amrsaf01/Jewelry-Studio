-- FORCE RESET TO CONCRETEFLOW
-- Run this to make the database match the "ConcreteFlow" branding

UPDATE public.profiles
SET 
  store_name = 'CONCRETEFLOW',
  theme = 'silver',
  logo_url = null,
  config = '{
    "branding": {
      "storeName": "CONCRETEFLOW",
      "theme": "silver",
      "backgroundColor": "#f5f5f5",
      "primaryTextColor": "#1c1917",
      "cardBackgroundColor": "#ffffff",
      "cardTextColor": "#1c1917",
      "fontFamily": "sans",
      "direction": "rtl",
      "textAlign": "right"
    },
    "content": {
      "heroTitle": "אוטומציה לבטון",
      "heroSubtitle": "מערכת ניהול מתקדמת למפעל הבטון",
      "photoModeLabel": "צילום שטח",
      "videoModeLabel": "הדמיה (Veo)"
    },
    "features": {
      "enablePhoto": true,
      "enableVideo": true,
      "showExamples": true
    },
    "watermark": {
      "enabled": true,
      "type": "text",
      "text": "CONCRETEFLOW",
      "textSize": 50,
      "textPosition": "bottom-right",
      "textColor": "#ffffff",
      "textFont": "\"Inter\", sans-serif"
    },
    "examples": [
      {
        "label": "יציקת בטון",
        "url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"
      },
      {
        "label": "מערבל בטון",
        "url": "https://images.unsplash.com/photo-1581094794329-cd1361ddee2d?auto=format&fit=crop&w=600&q=80"
      },
      {
        "label": "אתר בנייה",
        "url": "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80"
      }
    ]
  }'::jsonb;
