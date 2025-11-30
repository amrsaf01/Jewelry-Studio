import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Sparkles, AlertCircle, ShoppingBag, Video, Film, Trash2, X, MapPin, Settings, LogOut, LayoutDashboard, Instagram, Smartphone, Monitor, Shield } from 'lucide-react';
import { Button } from './components/Button';
import { Gallery } from './components/Gallery';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { geminiService } from './services/geminiService';
import { AppState, GeneratedImage, GeneratedVideo, GenerationMode, CMSConfig, ThemeColor, ImageAspectRatio, UserRole, UserPermissions } from './types';
import { fileToBase64, urlToFile } from './utils/imageUtils';
import { supabase } from './services/supabaseClient';

const DEFAULT_CONFIG: CMSConfig = {
  branding: {
    storeName: 'Gemini Jewelry Studio',
    theme: 'gold',
    backgroundColor: '#fafaf9',
    primaryTextColor: '#1c1917',
    cardBackgroundColor: '#ffffff',
    cardTextColor: '#1c1917',
    fontFamily: 'serif',
    direction: 'ltr',
    textAlign: 'left'
  },
  content: {
    heroTitle: 'Create Professional Model Photos',
    heroSubtitle: 'Upload your product, describe the look, and get magazine-quality shots in seconds.',
    photoModeLabel: 'Photoshoot',
    videoModeLabel: 'Animate (Veo)',
  },
  features: {
    enablePhoto: true,
    enableVideo: true,
    showExamples: true,
  },
  watermark: {
    enabled: true,
    type: 'text',
    text: 'My Jewelry Store',
    textSize: 50,
    textPosition: 'bottom-right',
    textColor: '#ffffff',
    textFont: '"Playfair Display", serif'
  },
  examples: [
    {
      label: "Diamond Ring",
      url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80"
    },
    {
      label: "Gold Necklace",
      url: "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?auto=format&fit=crop&w=600&q=80"
    },
    {
      label: "Luxury Watch",
      url: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80"
    }
  ]
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [permissions, setPermissions] = useState<UserPermissions>({ can_use_photo: true, can_use_video: true, max_credits: 10 });
  const [isExpired, setIsExpired] = useState(false);

  // CMS Configuration State
  const [config, setConfig] = useState<CMSConfig>(() => {
    try {
      const saved = localStorage.getItem('geminiJewelryAppConfig');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          branding: { ...DEFAULT_CONFIG.branding, ...(parsed?.branding || {}) },
          content: { ...DEFAULT_CONFIG.content, ...(parsed?.content || {}) },
          features: { ...DEFAULT_CONFIG.features, ...(parsed?.features || {}) },
          watermark: { ...DEFAULT_CONFIG.watermark, ...(parsed?.watermark || {}) },
          examples: Array.isArray(parsed?.examples) ? parsed.examples : DEFAULT_CONFIG.examples
        };
      }
    } catch (e) {
      console.warn("Failed to load config from local storage, resetting to default.", e);
      localStorage.removeItem('geminiJewelryAppConfig');
    }
    return DEFAULT_CONFIG;
  });

  const [showAdmin, setShowAdmin] = useState(false);
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);

  const [mode, setMode] = useState<GenerationMode>(GenerationMode.PHOTO);
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Photo Config
  const [modelDescription, setModelDescription] = useState<string>('A stunning fashion model, elegant evening wear, studio lighting');
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreviewUrl, setBgPreviewUrl] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<ImageAspectRatio>('1:1');

  // Video Config
  const [videoPrompt, setVideoPrompt] = useState<string>('Cinematic slow motion pan, sparkling light reflections, elegant movement');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  // Results
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const fetchUserProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('role, permissions, expires_at').eq('id', uid).single();
    if (data) {
      setUserRole(data.role as UserRole);
      if (data.permissions) setPermissions(data.permissions);

      // Check expiration
      if (data.expires_at) {
        const expiryDate = new Date(data.expires_at);
        if (new Date() > expiryDate) {
          setIsExpired(true);
        }
      }
    }
  };

  // Persistence effect
  useEffect(() => {
    localStorage.setItem('geminiJewelryAppConfig', JSON.stringify(config));
    document.title = config.branding.storeName;
  }, [config]);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
      setUserEmail(session?.user?.email || null);
      if (session?.user?.id) fetchUserProfile(session.user.id);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserId(session?.user?.id || null);
      setUserEmail(session?.user?.email || null);
      if (session?.user?.id) fetchUserProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Supabase Sync
  useEffect(() => {
    if (!userId) return; // Only sync if user is logged in

    const loadCloudConfig = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

        if (data) {
          console.log("Loaded cloud config:", data);

          if (data.config) {
            setConfig(prev => ({
              ...DEFAULT_CONFIG,
              ...data.config,
              branding: { ...DEFAULT_CONFIG.branding, ...(data.config.branding || {}) }
            }));
          } else {
            // Legacy fallback
            setConfig(prev => ({
              ...prev,
              branding: {
                ...prev.branding,
                storeName: data.store_name || prev.branding.storeName,
                theme: data.theme || prev.branding.theme,
                logoUrl: data.logo_url || prev.branding.logoUrl
              }
            }));
          }
        } else {
          console.log("No profile found, creating default...");
          const { error: insertError } = await supabase.from('profiles').insert({
            id: userId,
            config: DEFAULT_CONFIG,
            store_name: DEFAULT_CONFIG.branding.storeName,
            theme: DEFAULT_CONFIG.branding.theme
          });

          if (!insertError) {
            setConfig(DEFAULT_CONFIG);
            localStorage.removeItem('geminiJewelryAppConfig');
          } else {
            console.error("Failed to create default profile", insertError);
          }
        }
      } catch (e) {
        console.error("Failed to load cloud config", e);
      }
    };
    loadCloudConfig();

    // Real-time subscription
    const subscription = supabase
      .channel(`profiles:${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, payload => {
        console.log("Received real-time update:", payload);
        const newData = payload.new;

        if (newData.config) {
          setConfig(prev => ({
            ...prev,
            ...newData.config
          }));
        } else {
          // Legacy fallback
          setConfig(prev => ({
            ...prev,
            branding: {
              ...prev.branding,
              storeName: newData.store_name || prev.branding.storeName,
              theme: newData.theme || prev.branding.theme,
              logoUrl: newData.logo_url || prev.branding.logoUrl
            }
          }));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const handleConfigUpdate = async (newConfig: CMSConfig) => {
    setConfig(newConfig); // Optimistic local update

    if (!userId) return;
    try {
      // Update Supabase
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        config: newConfig, // Save full config to JSONB
        // Keep legacy columns in sync for now
        store_name: newConfig.branding.storeName,
        theme: newConfig.branding.theme,
        logo_url: newConfig.branding.logoUrl
      });

      if (error) throw error;
    } catch (e) {
      console.error("Failed to sync to cloud", e);
    }
  };

  const checkApiKey = async () => {
    try {
      const aistudio = (window as any).aistudio;
      if (aistudio && aistudio.hasSelectedApiKey) {
        const hasKey = await aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        setHasApiKey(true);
      }
    } catch (e) {
      console.warn("Could not check API key status", e);
      setHasApiKey(false);
    }
  };

  useEffect(() => {
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      const aistudio = (window as any).aistudio;
      if (aistudio && aistudio.openSelectKey) {
        await aistudio.openSelectKey();
        setTimeout(checkApiKey, 1000);
        setHasApiKey(true);
      }
    } catch (e) {
      console.error("Failed to open key selector", e);
      setError("Could not open API key selector.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) return;
      setBgFile(file);
      setBgPreviewUrl(URL.createObjectURL(file));
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setState(AppState.IDLE);
    setGeneratedImages([]);
    setGeneratedVideo(null);
  };

  const loadExample = async (example: { url: string; label: string }) => {
    try {
      setState(AppState.IDLE);
      const file = await urlToFile(example.url, `${example.label.replace(' ', '_')}.jpg`);
      processFile(file);
    } catch (e) {
      setError("Failed to load example image.");
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;
    if (mode === GenerationMode.VIDEO && !hasApiKey) {
      setError("Please connect your Google Cloud Project to use Veo.");
      return;
    }

    // Check credits
    if (permissions.max_credits <= 0) {
      setError("You have run out of credits. Please contact support to purchase more.");
      return;
    }

    setState(AppState.GENERATING);
    setError(null);

    try {
      const base64 = await fileToBase64(selectedFile);

      if (mode === GenerationMode.PHOTO) {
        let bgBase64 = undefined;
        if (bgFile) {
          bgBase64 = await fileToBase64(bgFile);
        }
        const images = await geminiService.generateShowcase(
          base64,
          modelDescription,
          selectedFile.type,
          imageAspectRatio,
          bgBase64,
          bgFile?.type
        );
        setGeneratedImages(images);
      } else {
        const video = await geminiService.generateVideo(
          base64,
          videoPrompt,
          selectedFile.type,
          videoAspectRatio
        );
        setGeneratedVideo(video);
      }

      // Deduct credit
      if (userId) {
        const newCredits = permissions.max_credits - 1;
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ permissions: { ...permissions, max_credits: newCredits } })
          .eq('id', userId);

        if (updateError) {
          console.error("Failed to deduct credit", updateError);
        } else {
          setPermissions(prev => ({ ...prev, max_credits: newCredits }));
        }
      }

      setState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate. Please try again.");
      setState(AppState.ERROR);
    }
  };

  const reset = () => {
    setState(AppState.IDLE);
    setSelectedFile(null);
    setPreviewUrl(null);
    setGeneratedImages([]);
    setGeneratedVideo(null);
    setError(null);
  };

  // Derived style based on theme
  const getThemeClass = (type: 'text' | 'bg' | 'border' | 'ring') => {
    const t = config.branding.theme;
    if (type === 'text') return t === 'gold' ? 'text-gold-600' : t === 'rose' ? 'text-rose-600' : t === 'silver' ? 'text-silver-600' : 'text-stone-800';
    if (type === 'bg') return t === 'gold' ? 'bg-gold-600' : t === 'rose' ? 'bg-rose-500' : t === 'silver' ? 'bg-silver-500' : 'bg-stone-800';
    if (type === 'border') return t === 'gold' ? 'border-gold-400' : t === 'rose' ? 'border-rose-300' : t === 'silver' ? 'border-silver-300' : 'border-stone-600';
    if (type === 'ring') return t === 'gold' ? 'ring-gold-400' : t === 'rose' ? 'ring-rose-300' : t === 'silver' ? 'ring-silver-300' : 'ring-stone-400';
    return '';
  };

  const getFontFamily = () => {
    switch (config.branding.fontFamily) {
      case 'serif': return 'font-serif';
      case 'sans': return 'font-sans';
      case 'hebrew': return 'font-hebrew';
      default: return 'font-sans';
    }
  };

  const cardStyle = {
    backgroundColor: config.branding.cardBackgroundColor || '#ffffff',
    color: config.branding.cardTextColor || '#1c1917'
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} branding={config.branding} />;
  }

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center space-y-4">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h2 className="text-2xl font-bold text-stone-900">Trial Period Ended</h2>
          <p className="text-stone-600">Your access to the Jewelry Studio has expired. Please contact support to renew your subscription.</p>
          <Button onClick={() => supabase.auth.signOut()} variant="outline">Sign Out</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${getFontFamily()}`}
      style={{
        backgroundColor: config.branding.backgroundColor
      }}
      dir={config.branding.direction}
    >

      {/* Admin Dashboard */}
      {showAdmin && (
        <AdminDashboard
          config={config}
          onUpdate={handleConfigUpdate}
          onClose={() => setShowAdmin(false)}
        />
      )}

      {/* Super Admin Dashboard */}
      {showSuperAdmin && (
        <SuperAdminDashboard
          onClose={() => setShowSuperAdmin(false)}
        />
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50 text-left">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.branding.logoUrl ? (
              <img src={config.branding.logoUrl} alt="Logo" className="h-10 max-w-[150px] object-contain" />
            ) : (
              <div className={`${getThemeClass('bg')} text-white p-2 rounded-lg shadow-sm`}>
                <Sparkles size={24} />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">{config.branding.storeName}</h1>
              <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">v1.3-JEWELRY</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="text-xs text-stone-400 font-medium hidden md:inline-block">
                {userEmail}
              </span>
            )}
            {userRole === 'admin' && (
              <button
                onClick={() => setShowSuperAdmin(true)}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors flex items-center gap-2"
                title="Super Admin"
              >
                <Shield size={20} />
                <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Super Admin</span>
              </button>
            )}
            <button
              onClick={() => setShowAdmin(true)}
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors flex items-center gap-2"
              title="Management System"
            >
              <LayoutDashboard size={20} />
              <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Admin</span>
            </button>
            <button onClick={() => supabase.auth.signOut()} className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        {state === AppState.SUCCESS ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {mode === GenerationMode.PHOTO ? (
              <Gallery
                images={generatedImages}
                watermarkSettings={config.watermark}
                storeName={config.branding.storeName}
                onRegenerate={() => setState(AppState.IDLE)}
              />
            ) : (
              <div className="w-full max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-end border-b border-stone-200 pb-4">
                  <div>
                    <h2 className="text-3xl font-bold" style={{ color: config.branding.primaryTextColor }}>Your Video Showcase</h2>
                    <p className="text-stone-500 mt-1">Generated by Veo 3.1</p>
                  </div>
                  <Button onClick={() => setState(AppState.IDLE)} variant="outline">
                    <Sparkles size={16} className={config.branding.direction === 'rtl' ? "ml-2" : "mr-2"} />
                    Create Another
                  </Button>
                </div>

                {generatedVideo && (
                  <div className="bg-black rounded-xl overflow-hidden shadow-2xl relative group">
                    <video
                      src={generatedVideo.videoUrl}
                      controls
                      autoPlay
                      loop
                      className={`w-full max-h-[80vh] mx-auto ${generatedVideo.aspectRatio === '9:16' ? 'aspect-[9/16] max-w-md' : 'aspect-video'}`}
                    />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={generatedVideo.videoUrl}
                        download={`veo-jewelry-${Date.now()}.mp4`}
                        className="bg-white/90 hover:bg-white text-stone-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg"
                      >
                        <Film size={16} /> Download MP4
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl p-8 border border-stone-100 shadow-sm flex items-center justify-between" style={cardStyle}>
              <div style={{ textAlign: config.branding.textAlign }}>
                <h3 className="font-bold text-xl mb-2" style={{ color: 'inherit' }}>Want to try another piece?</h3>
                <p className="opacity-70">Start a new session with a different product.</p>
              </div>
              <Button onClick={reset} variant="secondary">Start New Session</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Inputs */}
            <div className="lg:col-span-5 space-y-8">

              <div className="space-y-2">
                {(config.features.enablePhoto || config.features.enableVideo) && (
                  <div className={`flex bg-stone-200/50 p-1 rounded-lg w-fit mb-4 ${config.branding.textAlign === 'center' ? 'mx-auto' : config.branding.textAlign === 'right' ? 'ml-auto' : ''}`}>
                    {config.features.enablePhoto && permissions.can_use_photo && (
                      <button
                        onClick={() => setMode(GenerationMode.PHOTO)}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${mode === GenerationMode.PHOTO ? `bg-white shadow-sm ${getThemeClass('text')}` : 'text-stone-500 hover:text-stone-700'}`}
                      >
                        <ImageIcon size={16} /> {config.content.photoModeLabel}
                      </button>
                    )}
                    {config.features.enableVideo && permissions.can_use_video && (
                      <button
                        onClick={() => setMode(GenerationMode.VIDEO)}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${mode === GenerationMode.VIDEO ? `bg-white shadow-sm ${getThemeClass('text')}` : 'text-stone-500 hover:text-stone-700'}`}
                      >
                        <Video size={16} /> {config.content.videoModeLabel}
                      </button>
                    )}
                  </div>
                )}

                <h2 className="text-4xl font-bold leading-tight" style={{ color: config.branding.primaryTextColor }}>
                  {config.content.heroTitle}
                </h2>
                <p className="text-lg opacity-80" style={{ color: config.branding.primaryTextColor }}>
                  {config.content.heroSubtitle}
                </p>
              </div>

              {/* Examples Section */}
              {!selectedFile && config.features.showExamples && config.examples.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider" style={{ textAlign: config.branding.textAlign }}>Try an Example</p>
                  <div className="grid grid-cols-3 gap-3">
                    {config.examples.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => loadExample(ex)}
                        className={`group relative aspect-square rounded-lg overflow-hidden border border-stone-200 hover:${getThemeClass('border')} transition-all focus:outline-none focus:ring-2 ${getThemeClass('ring')}`}
                      >
                        <img src={ex.url} alt={ex.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-bold shadow-sm">{ex.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Section */}
              <div className="p-6 rounded-2xl shadow-sm border border-stone-100" style={cardStyle}>
                <label className={`block text-sm font-bold mb-4 flex items-center gap-2 ${config.branding.textAlign === 'center' ? 'justify-center' : config.branding.textAlign === 'right' ? 'flex-row-reverse' : ''}`} style={{ color: 'inherit' }}>
                  <ShoppingBag size={18} className={getThemeClass('text')} />
                  1. Upload Jewelry Product
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                      cursor-pointer border-2 border-dashed rounded-xl p-8 transition-all duration-300 flex flex-col items-center justify-center text-center gap-4 group
                      ${previewUrl ? `${getThemeClass('border')} ${config.branding.theme === 'gold' ? 'bg-gold-50/30' : 'bg-stone-50'}` : `border-stone-300 hover:${getThemeClass('border')} hover:bg-stone-50`}
                    `}
                >
                  {previewUrl ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden shadow-md">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold">Change</span>
                      </div>
                    </div>
                  ) : (
                    <div className={`bg-stone-100 p-4 rounded-full group-hover:bg-opacity-80 transition-colors`}>
                      <Upload size={24} className={`text-stone-400 group-hover:${getThemeClass('text')}`} />
                    </div>
                  )}

                  <div>
                    <p className="font-medium text-stone-900">{selectedFile ? selectedFile.name : "Click to upload image"}</p>
                    <p className="text-xs text-stone-500 mt-1">Supports PNG, JPG (Max 5MB)</p>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Configuration Section */}
              <div className="p-6 rounded-2xl shadow-sm border border-stone-100 space-y-6" style={cardStyle}>

                {mode === GenerationMode.PHOTO ? (
                  /* Photo Mode Config */
                  <>
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${config.branding.textAlign === 'center' ? 'justify-center' : config.branding.textAlign === 'right' ? 'flex-row-reverse' : ''}`} style={{ color: 'inherit' }}>
                        <ImageIcon size={18} className={getThemeClass('text')} />
                        2. Describe the Model & Vibe
                      </label>
                      <textarea
                        value={modelDescription}
                        onChange={(e) => setModelDescription(e.target.value)}
                        className={`w-full border border-stone-200 rounded-lg p-3 text-sm focus:ring-2 ${getThemeClass('ring')} ${getThemeClass('border')} outline-none transition-all resize-none h-24 mb-4`}
                        placeholder="E.g., A blonde woman in a silk red dress, warm sunset lighting, outdoor garden setting..."
                      />

                      {/* Custom Background Upload */}
                      <div className="border border-stone-200 rounded-lg p-3 bg-stone-50">
                        <label className={`block text-xs font-bold text-stone-600 mb-2 flex items-center gap-1.5 ${config.branding.textAlign === 'center' ? 'justify-center' : config.branding.textAlign === 'right' ? 'flex-row-reverse' : ''}`}>
                          <MapPin size={14} />
                          Environment / Custom Background (Optional)
                        </label>

                        {bgPreviewUrl ? (
                          <div className="relative w-full h-24 rounded-md overflow-hidden group">
                            <img src={bgPreviewUrl} alt="Background Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                              <button
                                onClick={() => bgInputRef.current?.click()}
                                className="text-white text-xs font-bold hover:underline"
                              >
                                Change
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setBgFile(null); setBgPreviewUrl(null); }}
                                className="text-white text-xs font-bold hover:text-red-300"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => bgInputRef.current?.click()}
                            className="border border-dashed border-stone-300 rounded-md p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-white transition-colors"
                          >
                            <Upload size={14} className="text-stone-400" />
                            <span className="text-xs text-stone-500">Upload background (e.g., store photo)</span>
                          </div>
                        )}
                        <input
                          type="file"
                          ref={bgInputRef}
                          onChange={handleBgChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Aspect Ratio Selector */}
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ textAlign: config.branding.textAlign, color: 'inherit' }}>
                        Output Size
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: '1:1', label: 'Square', icon: <Instagram size={14} /> },
                          { id: '3:4', label: 'Portrait', icon: <Smartphone size={14} /> },
                          { id: '9:16', label: 'Story', icon: <Smartphone size={14} /> },
                          { id: '16:9', label: 'Land', icon: <Monitor size={14} /> }
                        ].map((ratio) => (
                          <button
                            key={ratio.id}
                            onClick={() => setImageAspectRatio(ratio.id as ImageAspectRatio)}
                            className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all ${imageAspectRatio === ratio.id ? `${getThemeClass('border')} ${config.branding.theme === 'gold' ? 'bg-gold-50' : 'bg-stone-50'} ${getThemeClass('text')}` : 'border-stone-200 hover:border-stone-300 text-stone-500'}`}
                          >
                            {ratio.icon}
                            {ratio.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Video Mode Config */
                  <>
                    <div>
                      <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${config.branding.textAlign === 'center' ? 'justify-center' : config.branding.textAlign === 'right' ? 'flex-row-reverse' : ''}`} style={{ color: 'inherit' }}>
                        <Film size={18} className={getThemeClass('text')} />
                        2. Video Prompt (Optional)
                      </label>
                      <textarea
                        value={videoPrompt}
                        onChange={(e) => setVideoPrompt(e.target.value)}
                        className={`w-full border border-stone-200 rounded-lg p-3 text-sm focus:ring-2 ${getThemeClass('ring')} ${getThemeClass('border')} outline-none transition-all resize-none h-24`}
                        placeholder="E.g., Cinematic product showcase, elegant camera movement..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ textAlign: config.branding.textAlign, color: 'inherit' }}>
                        Aspect Ratio
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setVideoAspectRatio('9:16')}
                          className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${videoAspectRatio === '9:16' ? `${getThemeClass('border')} ${config.branding.theme === 'gold' ? 'bg-gold-50' : 'bg-stone-50'} ${getThemeClass('text')}` : 'border-stone-200 hover:border-stone-300'}`}
                        >
                          <div className="w-3 h-5 border-2 border-current rounded-sm"></div>
                          Portrait (9:16)
                        </button>
                        <button
                          onClick={() => setVideoAspectRatio('16:9')}
                          className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${videoAspectRatio === '16:9' ? `${getThemeClass('border')} ${config.branding.theme === 'gold' ? 'bg-gold-50' : 'bg-stone-50'} ${getThemeClass('text')}` : 'border-stone-200 hover:border-stone-300'}`}
                        >
                          <div className="w-5 h-3 border-2 border-current rounded-sm"></div>
                          Landscape (16:9)
                        </button>
                      </div>
                    </div>

                    {!hasApiKey && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4" style={{ textAlign: 'left' }}>
                        <h4 className="text-amber-800 font-bold text-sm mb-1 flex items-center gap-2">
                          <AlertCircle size={16} />
                          Action Required for Veo
                        </h4>
                        <p className="text-amber-700 text-xs mb-3">
                          To use the Veo video model, you must connect a Google Cloud project with billing enabled.
                          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline ml-1">Learn more</a>
                        </p>
                        <Button onClick={handleSelectKey} variant="secondary" className="w-full text-xs py-2 h-auto">
                          Connect Google Cloud Project
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3 text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleGenerate}
                className={`w-full text-lg shadow-xl shadow-stone-200/50 ${getThemeClass('bg')} hover:opacity-90`}
                disabled={!selectedFile || (mode === GenerationMode.VIDEO && !hasApiKey)}
                isLoading={state === AppState.GENERATING}
              >
                {mode === GenerationMode.PHOTO ? 'Generate Photoshoot' : 'Generate Video'}
              </Button>

            </div>

            {/* Right Column: Visual Preview / Placeholder */}
            <div className="lg:col-span-7 hidden lg:flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-stone-100/50 to-white/50 rounded-3xl -z-10 transform rotate-1 border border-stone-100"></div>

              {state === AppState.GENERATING ? (
                <div className="text-center space-y-6 max-w-md">
                  <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 border-4 border-stone-200 rounded-full"></div>
                    <div className={`absolute inset-0 border-4 rounded-full border-t-transparent animate-spin ${config.branding.theme === 'gold' ? 'border-gold-600' : 'border-stone-800'}`}></div>
                    {mode === GenerationMode.VIDEO ? <Film className={`absolute inset-0 m-auto animate-pulse ${getThemeClass('text')}`} size={32} /> : <Sparkles className={`absolute inset-0 m-auto animate-pulse ${getThemeClass('text')}`} size={32} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-stone-900 mb-2">
                      {mode === GenerationMode.VIDEO ? 'Rendering Video...' : 'Creating Magic...'}
                    </h3>
                    <p className="text-stone-500">
                      {mode === GenerationMode.VIDEO
                        ? "Veo is animating your product. This typically takes about 1-2 minutes."
                        : "Our AI is analyzing your jewelry and setting up the virtual studio."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-stone-200 rounded-3xl">
                  <div className="bg-white p-6 rounded-full shadow-lg mb-6">
                    {mode === GenerationMode.VIDEO ? <Film size={48} className="text-stone-300" /> : <ImageIcon size={48} className="text-stone-300" />}
                  </div>
                  <h3 className="text-xl font-bold text-stone-400 mb-2">Preview Area</h3>
                  <p className="text-stone-400 max-w-xs">
                    {mode === GenerationMode.VIDEO
                      ? "Your Veo generated video will play here once complete."
                      : "Your generated photoshoot images will appear here."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;