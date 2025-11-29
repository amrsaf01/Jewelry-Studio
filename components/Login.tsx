
import React, { useState } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { CMSConfig } from '../types';

interface LoginProps {
  onLogin: () => void;
  branding: CMSConfig['branding'];
}

export const Login: React.FC<LoginProps> = ({ onLogin, branding }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock authentication - In a real app this would verify against a backend
    // Accepting 'GEMINI' or any non-empty string for demo purposes if user didn't set a specific one
    if (code.length > 0) {
      onLogin();
    } else {
      setError(true);
    }
  };

  const getFontFamily = () => {
    switch (branding.fontFamily) {
        case 'serif': return 'font-serif';
        case 'sans': return 'font-sans';
        case 'hebrew': return 'font-hebrew';
        case 'arabic': return 'font-arabic';
        default: return 'font-serif';
    }
  };

  const getThemeClass = (type: 'bg' | 'ring' | 'text') => {
    const t = branding.theme;
    if (type === 'bg') return t === 'gold' ? 'bg-gold-600' : t === 'rose' ? 'bg-rose-500' : t === 'silver' ? 'bg-silver-500' : 'bg-stone-800';
    if (type === 'ring') return t === 'gold' ? 'focus:ring-gold-400' : t === 'rose' ? 'focus:ring-rose-300' : t === 'silver' ? 'focus:ring-silver-300' : 'focus:ring-stone-400';
    if (type === 'text') return t === 'gold' ? 'text-gold-600' : t === 'rose' ? 'text-rose-500' : t === 'silver' ? 'text-silver-500' : 'text-stone-800';
    return '';
  };

  return (
    <div 
        className={`min-h-screen flex items-center justify-center p-4 ${getFontFamily()}`}
        style={{ 
            backgroundColor: branding.backgroundColor || '#1c1917',
            color: branding.primaryTextColor || '#ffffff'
        }}
        dir={branding.direction}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in duration-300">
        <div className="text-center mb-8">
            {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="h-16 mx-auto mb-4 object-contain" />
            ) : (
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 text-white shadow-lg ${getThemeClass('bg')}`}>
                    <Sparkles size={32} />
                </div>
            )}
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Welcome Back</h1>
          <p className="text-stone-500">Please enter your access code to enter the studio.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 text-left rtl:text-right">Access Code</label>
            <div className="relative">
              <Lock className={`absolute ${branding.direction === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
              <input 
                type="password" 
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(false);
                }}
                className={`w-full py-3 bg-stone-50 border rounded-lg outline-none focus:ring-2 transition-all ${branding.direction === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} ${error ? 'border-red-300 focus:ring-red-100' : `border-stone-200 ${getThemeClass('ring')} border-stone-200`} text-stone-900`}
                placeholder="Enter code..."
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-xs mt-2 text-left rtl:text-right">Please enter an access code.</p>}
          </div>

          <button 
            type="submit"
            className={`w-full text-white py-3 rounded-lg font-bold transition-all transform hover:scale-[1.02] shadow-lg ${branding.theme === 'gold' ? 'bg-stone-900 hover:bg-black' : getThemeClass('bg')}`}
          >
            Enter Studio
          </button>
        </form>
        
        <p className="text-center text-xs text-stone-400 mt-6">
          Powered by Gemini 2.5 & Veo
        </p>
      </div>
    </div>
  );
};
