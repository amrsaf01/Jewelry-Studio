
import React, { useState, useRef } from 'react';
import { X, Layout, Type, Palette, Image as ImageIcon, Check, Upload, Trash2, Plus, Settings, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { CMSConfig, ThemeColor, WatermarkPosition, ExampleImage, AppFont, AppDirection, AppTextAlign } from '../types';
import { Button } from './Button';

interface AdminDashboardProps {
  config: CMSConfig;
  onUpdate: (newConfig: CMSConfig) => void;
  onClose: () => void;
}

type Tab = 'branding' | 'content' | 'features' | 'watermark' | 'examples';

const FONTS: { label: string; value: string; id: AppFont }[] = [
    { label: 'Playfair Display (Serif)', value: '"Playfair Display", serif', id: 'serif' },
    { label: 'Lato (Sans)', value: '"Lato", sans-serif', id: 'sans' },
    { label: 'Rubik (Hebrew/Eng)', value: '"Rubik", sans-serif', id: 'hebrew' },
    { label: 'Cairo (Arabic/Eng)', value: '"Cairo", sans-serif', id: 'arabic' },
];

const THEMES: { id: ThemeColor; color: string; label: string }[] = [
    { id: 'gold', color: 'bg-gold-600', label: 'Luxury Gold' },
    { id: 'rose', color: 'bg-rose-500', label: 'Rose Gold' },
    { id: 'silver', color: 'bg-silver-500', label: 'Sterling Silver' },
    { id: 'stone', color: 'bg-stone-800', label: 'Minimalist Stone' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ config, onUpdate, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('branding');
  const [tempConfig, setTempConfig] = useState<CMSConfig>(JSON.parse(JSON.stringify(config))); // Deep copy

  const logoInputRef = useRef<HTMLInputElement>(null);
  const watermarkLogoInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdate(tempConfig);
    onClose();
  };

  const updateBranding = (updates: Partial<CMSConfig['branding']>) => {
    setTempConfig(prev => ({ ...prev, branding: { ...prev.branding, ...updates } }));
  };

  const updateContent = (updates: Partial<CMSConfig['content']>) => {
    setTempConfig(prev => ({ ...prev, content: { ...prev.content, ...updates } }));
  };
  
  const updateFeatures = (updates: Partial<CMSConfig['features']>) => {
    setTempConfig(prev => ({ ...prev, features: { ...prev.features, ...updates } }));
  };

  const updateWatermark = (updates: Partial<CMSConfig['watermark']>) => {
    setTempConfig(prev => ({ ...prev, watermark: { ...prev.watermark, ...updates } }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'app' | 'watermark') => {
    const file = e.target.files?.[0];
    if (file) {
        const url = URL.createObjectURL(file);
        if (target === 'app') {
            updateBranding({ logoUrl: url });
        } else {
            updateWatermark({ logoUrl: url });
        }
    }
  };

  const addExample = () => {
      setTempConfig(prev => ({
          ...prev,
          examples: [...prev.examples, { label: 'New Item', url: 'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?auto=format&fit=crop&w=600&q=80' }]
      }));
  };

  const removeExample = (index: number) => {
      setTempConfig(prev => ({
          ...prev,
          examples: prev.examples.filter((_, i) => i !== index)
      }));
  };

  const updateExample = (index: number, field: keyof ExampleImage, value: string) => {
      const newExamples = [...tempConfig.examples];
      newExamples[index] = { ...newExamples[index], [field]: value };
      setTempConfig(prev => ({ ...prev, examples: newExamples }));
  };

  const renderSidebarItem = (id: Tab, icon: React.ReactNode, label: string) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === id ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'}`}
      >
          {icon}
          {label}
      </button>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <div className="w-64 bg-stone-50 border-r border-stone-200 p-6 flex flex-col">
            <div className="mb-8 flex items-center gap-2 text-stone-900">
                <Settings className="w-6 h-6" />
                <h2 className="font-serif font-bold text-xl">Admin</h2>
            </div>
            
            <nav className="space-y-2 flex-1">
                {renderSidebarItem('branding', <Palette size={18} />, 'Look & Feel')}
                {renderSidebarItem('content', <Type size={18} />, 'Content & Text')}
                {renderSidebarItem('features', <Layout size={18} />, 'Features')}
                {renderSidebarItem('watermark', <ImageIcon size={18} />, 'Watermark')}
                {renderSidebarItem('examples', <ImageIcon size={18} />, 'Examples')}
            </nav>

            <div className="mt-auto pt-6 border-t border-stone-200">
                <p className="text-xs text-stone-400">CMS Version 1.3</p>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-white">
                <div>
                    <h3 className="text-xl font-bold text-stone-900 capitalize">{activeTab} Settings</h3>
                    <p className="text-sm text-stone-500">Manage your application configuration</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={onClose} className="py-2 px-4 h-auto text-sm">Cancel</Button>
                    <Button variant="secondary" onClick={handleSave} className="py-2 px-4 h-auto text-sm bg-stone-900 text-white hover:bg-black">Save Changes</Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-stone-50/50">
                
                {/* Branding Tab */}
                {activeTab === 'branding' && (
                    <div className="space-y-8 max-w-2xl">
                        <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                            <h4 className="font-bold text-stone-900 mb-4">Identity</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Store Name</label>
                                    <input 
                                        type="text" 
                                        value={tempConfig.branding.storeName}
                                        onChange={(e) => updateBranding({ storeName: e.target.value })}
                                        className="w-full border border-stone-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-stone-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-2">App Logo</label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 bg-stone-100 rounded-lg flex items-center justify-center border border-stone-200 overflow-hidden">
                                            {tempConfig.branding.logoUrl ? (
                                                <img src={tempConfig.branding.logoUrl} className="w-full h-full object-contain" />
                                            ) : <span className="text-stone-300">No Logo</span>}
                                        </div>
                                        <Button variant="outline" onClick={() => logoInputRef.current?.click()} className="text-xs py-2 h-auto">
                                            <Upload size={14} className="mr-2" /> Upload New
                                        </Button>
                                        <input type="file" ref={logoInputRef} onChange={(e) => handleLogoUpload(e, 'app')} className="hidden" accept="image/*" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                            <h4 className="font-bold text-stone-900 mb-4">Styling & Colors</h4>
                            
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Accent Theme</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {THEMES.map(theme => (
                                        <button
                                            key={theme.id}
                                            onClick={() => updateBranding({ theme: theme.id })}
                                            className={`relative p-4 rounded-xl border-2 text-left transition-all ${tempConfig.branding.theme === theme.id ? 'border-stone-900 bg-stone-50' : 'border-stone-100 hover:border-stone-200'}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full ${theme.color} mb-3 shadow-sm`}></div>
                                            <span className="block text-sm font-bold text-stone-900">{theme.label}</span>
                                            {tempConfig.branding.theme === theme.id && (
                                                <div className="absolute top-3 right-3 text-stone-900"><Check size={16} /></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-2">App Background</label>
                                    <div className="flex items-center gap-2 border border-stone-200 rounded-lg p-2 bg-white">
                                        <input 
                                            type="color" 
                                            value={tempConfig.branding.backgroundColor || '#fafaf9'} 
                                            onChange={e => updateBranding({ backgroundColor: e.target.value })} 
                                            className="w-10 h-10 rounded cursor-pointer border-none p-0" 
                                        />
                                        <span className="text-xs text-stone-500 font-mono">{tempConfig.branding.backgroundColor || '#fafaf9'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Primary Text</label>
                                    <div className="flex items-center gap-2 border border-stone-200 rounded-lg p-2 bg-white">
                                        <input 
                                            type="color" 
                                            value={tempConfig.branding.primaryTextColor || '#1c1917'} 
                                            onChange={e => updateBranding({ primaryTextColor: e.target.value })} 
                                            className="w-10 h-10 rounded cursor-pointer border-none p-0" 
                                        />
                                        <span className="text-xs text-stone-500 font-mono">{tempConfig.branding.primaryTextColor || '#1c1917'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Card/Box Background</label>
                                    <div className="flex items-center gap-2 border border-stone-200 rounded-lg p-2 bg-white">
                                        <input 
                                            type="color" 
                                            value={tempConfig.branding.cardBackgroundColor || '#ffffff'} 
                                            onChange={e => updateBranding({ cardBackgroundColor: e.target.value })} 
                                            className="w-10 h-10 rounded cursor-pointer border-none p-0" 
                                        />
                                        <span className="text-xs text-stone-500 font-mono">{tempConfig.branding.cardBackgroundColor || '#ffffff'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Card/Box Text</label>
                                    <div className="flex items-center gap-2 border border-stone-200 rounded-lg p-2 bg-white">
                                        <input 
                                            type="color" 
                                            value={tempConfig.branding.cardTextColor || '#1c1917'} 
                                            onChange={e => updateBranding({ cardTextColor: e.target.value })} 
                                            className="w-10 h-10 rounded cursor-pointer border-none p-0" 
                                        />
                                        <span className="text-xs text-stone-500 font-mono">{tempConfig.branding.cardTextColor || '#1c1917'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-2">App Font</label>
                                    <select 
                                        value={tempConfig.branding.fontFamily} 
                                        onChange={e => updateBranding({ fontFamily: e.target.value as AppFont })} 
                                        className="w-full border border-stone-200 rounded-lg p-3 text-sm bg-white"
                                    >
                                        {FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Text Alignment</label>
                                    <div className="flex bg-stone-100 p-1 rounded-lg border border-stone-200">
                                        {[
                                            { id: 'left', icon: <AlignLeft size={16} /> },
                                            { id: 'center', icon: <AlignCenter size={16} /> },
                                            { id: 'right', icon: <AlignRight size={16} /> },
                                        ].map((align) => (
                                            <button 
                                                key={align.id}
                                                onClick={() => updateBranding({ textAlign: align.id as AppTextAlign })}
                                                className={`flex-1 py-2 flex items-center justify-center rounded-md transition-all ${tempConfig.branding.textAlign === align.id ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                                            >
                                                {align.icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Layout Direction (Header/Body)</label>
                                <div className="flex bg-stone-100 p-1 rounded-lg border border-stone-200 w-fit">
                                    <button 
                                        onClick={() => updateBranding({ direction: 'ltr' })}
                                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${tempConfig.branding.direction === 'ltr' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}
                                    >
                                        <AlignLeft size={16} /> Left to Right
                                    </button>
                                    <button 
                                        onClick={() => updateBranding({ direction: 'rtl' })}
                                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${tempConfig.branding.direction === 'rtl' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}
                                    >
                                        <AlignRight size={16} /> Right to Left
                                    </button>
                                </div>
                                <p className="text-xs text-stone-400 mt-2">Recommended: Use RTL for Hebrew/Arabic.</p>
                            </div>
                        </section>
                    </div>
                )}

                {/* Content Tab */}
                {activeTab === 'content' && (
                    <div className="space-y-8 max-w-2xl">
                         <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                            <h4 className="font-bold text-stone-900 mb-4">Hero Section</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Hero Title</label>
                                    <input 
                                        type="text" 
                                        value={tempConfig.content.heroTitle}
                                        onChange={(e) => updateContent({ heroTitle: e.target.value })}
                                        className="w-full border border-stone-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-stone-200"
                                        dir={tempConfig.branding.direction}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Hero Subtitle</label>
                                    <textarea 
                                        value={tempConfig.content.heroSubtitle}
                                        onChange={(e) => updateContent({ heroSubtitle: e.target.value })}
                                        className="w-full border border-stone-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-stone-200 resize-none h-24"
                                        dir={tempConfig.branding.direction}
                                    />
                                </div>
                            </div>
                        </section>
                        
                         <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                            <h4 className="font-bold text-stone-900 mb-4">Labels</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Photo Mode Label</label>
                                    <input 
                                        type="text" 
                                        value={tempConfig.content.photoModeLabel}
                                        onChange={(e) => updateContent({ photoModeLabel: e.target.value })}
                                        className="w-full border border-stone-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-stone-200"
                                        dir={tempConfig.branding.direction}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Video Mode Label</label>
                                    <input 
                                        type="text" 
                                        value={tempConfig.content.videoModeLabel}
                                        onChange={(e) => updateContent({ videoModeLabel: e.target.value })}
                                        className="w-full border border-stone-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-stone-200"
                                        dir={tempConfig.branding.direction}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* Features Tab */}
                {activeTab === 'features' && (
                    <div className="space-y-6 max-w-2xl">
                         <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                            <h4 className="font-bold text-stone-900 mb-4">Feature Toggles</h4>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between p-4 border border-stone-100 rounded-lg hover:bg-stone-50 cursor-pointer">
                                    <span className="font-medium text-stone-900">Enable Photoshoot Mode</span>
                                    <input 
                                        type="checkbox" 
                                        checked={tempConfig.features.enablePhoto}
                                        onChange={(e) => updateFeatures({ enablePhoto: e.target.checked })}
                                        className="w-5 h-5 text-stone-900 focus:ring-stone-900 rounded border-stone-300"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-4 border border-stone-100 rounded-lg hover:bg-stone-50 cursor-pointer">
                                    <span className="font-medium text-stone-900">Enable Veo Video Mode</span>
                                    <input 
                                        type="checkbox" 
                                        checked={tempConfig.features.enableVideo}
                                        onChange={(e) => updateFeatures({ enableVideo: e.target.checked })}
                                        className="w-5 h-5 text-stone-900 focus:ring-stone-900 rounded border-stone-300"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-4 border border-stone-100 rounded-lg hover:bg-stone-50 cursor-pointer">
                                    <span className="font-medium text-stone-900">Show Example Images</span>
                                    <input 
                                        type="checkbox" 
                                        checked={tempConfig.features.showExamples}
                                        onChange={(e) => updateFeatures({ showExamples: e.target.checked })}
                                        className="w-5 h-5 text-stone-900 focus:ring-stone-900 rounded border-stone-300"
                                    />
                                </label>
                            </div>
                        </section>
                    </div>
                )}
                
                {/* Watermark Tab */}
                {activeTab === 'watermark' && (
                    <div className="space-y-8 max-w-2xl">
                         <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-bold text-stone-900">Watermark Configuration</h4>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={tempConfig.watermark.enabled} onChange={e => updateWatermark({ enabled: e.target.checked })} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
                                </label>
                            </div>

                            {tempConfig.watermark.enabled && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                                    <div className="flex bg-stone-100 p-1 rounded-lg border border-stone-200">
                                        <button onClick={() => updateWatermark({ type: 'text' })} className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${tempConfig.watermark.type === 'text' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}>Text Watermark</button>
                                        <button onClick={() => updateWatermark({ type: 'logo' })} className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${tempConfig.watermark.type === 'logo' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}>Logo Watermark</button>
                                    </div>

                                    {tempConfig.watermark.type === 'text' ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Watermark Text</label>
                                                <input 
                                                    type="text" 
                                                    value={tempConfig.watermark.text || ''} 
                                                    onChange={e => updateWatermark({ text: e.target.value })}
                                                    className="w-full border border-stone-200 rounded-lg p-3 text-sm"
                                                    placeholder="My Brand Name"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Font</label>
                                                    <select 
                                                        value={tempConfig.watermark.textFont} 
                                                        onChange={e => updateWatermark({ textFont: e.target.value })} 
                                                        className="w-full border border-stone-200 rounded-lg p-3 text-sm bg-white"
                                                    >
                                                        {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Color</label>
                                                    <div className="flex items-center gap-2 border border-stone-200 rounded-lg p-2 bg-white">
                                                        <input 
                                                            type="color" 
                                                            value={tempConfig.watermark.textColor} 
                                                            onChange={e => updateWatermark({ textColor: e.target.value })} 
                                                            className="w-8 h-8 rounded cursor-pointer border-none p-0" 
                                                        />
                                                        <span className="text-xs text-stone-500">{tempConfig.watermark.textColor}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div 
                                                onClick={() => watermarkLogoInputRef.current?.click()} 
                                                className="border-2 border-dashed border-stone-300 p-8 text-center rounded-xl cursor-pointer hover:bg-white hover:border-stone-400 transition-all"
                                            >
                                                {tempConfig.watermark.logoUrl ? (
                                                    <img src={tempConfig.watermark.logoUrl} className="h-16 mx-auto object-contain mb-2" />
                                                ) : <Upload size={24} className="mx-auto text-stone-300 mb-2" />}
                                                
                                                <p className="text-sm font-medium text-stone-600">
                                                    {tempConfig.watermark.logoUrl ? 'Click to change logo' : 'Click to upload logo'}
                                                </p>
                                                <input type="file" ref={watermarkLogoInputRef} onChange={(e) => handleLogoUpload(e, 'watermark')} className="hidden" accept="image/*" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Position Control - Shared for both types */}
                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Position</label>
                                        <div className="flex gap-2">
                                            {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map((pos) => (
                                                <button 
                                                    key={pos}
                                                    onClick={() => updateWatermark({ textPosition: pos as any })}
                                                    className={`h-10 w-10 rounded-lg border flex items-center justify-center transition-all ${tempConfig.watermark.textPosition === pos ? 'bg-stone-900 border-stone-900 text-white' : 'bg-white border-stone-200 text-stone-400 hover:border-stone-400'}`}
                                                    title={pos}
                                                >
                                                    <div className={`w-2 h-2 rounded-full bg-current`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* Examples Tab */}
                {activeTab === 'examples' && (
                    <div className="space-y-6 max-w-3xl">
                        <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-bold text-stone-900">Manage Examples</h4>
                                <Button variant="secondary" onClick={addExample} className="text-xs py-2 h-auto">
                                    <Plus size={14} className="mr-2" /> Add Example
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {tempConfig.examples.map((ex, idx) => (
                                    <div key={idx} className="flex gap-4 items-start bg-stone-50 p-4 rounded-lg border border-stone-100">
                                        <div className="w-20 h-20 bg-white rounded-lg border border-stone-200 shrink-0 overflow-hidden">
                                            <img src={ex.url} alt="Example" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Label</label>
                                                <input 
                                                    value={ex.label}
                                                    onChange={(e) => updateExample(idx, 'label', e.target.value)}
                                                    className="w-full text-sm p-2 border border-stone-200 rounded bg-white"
                                                    dir={tempConfig.branding.direction}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Image URL</label>
                                                <input 
                                                    value={ex.url}
                                                    onChange={(e) => updateExample(idx, 'url', e.target.value)}
                                                    className="w-full text-sm p-2 border border-stone-200 rounded bg-white"
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeExample(idx)}
                                            className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                {tempConfig.examples.length === 0 && (
                                    <p className="text-center text-stone-400 text-sm py-4">No examples added.</p>
                                )}
                            </div>
                        </section>
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};
