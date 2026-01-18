
import React, { useState, useRef, useEffect, useMemo } from 'react';
import QRCodeStyling, { Options, DrawType, Gradient } from 'qr-code-styling';
import { QRConfig, QRType, StylePreset, AIStyleSuggestion } from './types';
import { STYLE_PRESETS, ERROR_CORRECTION_LEVELS, DOT_STYLES, CORNER_SQUARE_STYLES, CORNER_DOT_STYLES } from './constants';
import { getAIStyleSuggestion } from './services/geminiService';
import { Button } from './components/Button';
import { LogoUploader } from './components/LogoUploader';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const Modal: React.FC<{ title: string, isOpen: boolean, onClose: () => void, children: React.ReactNode }> = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-display font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-8 prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium text-sm">
          {children}
        </div>
        <div className="p-8 border-t border-slate-50 flex justify-end">
          <Button onClick={onClose} size="sm" variant="secondary">Close</Button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [config, setConfig] = useState<QRConfig>({
    value: 'https://qrstudiopro.app',
    fgColor: '#1e293b',
    bgColor: '#ffffff',
    level: 'H',
    size: 512,
    includeMargin: true,
    dotType: 'square',
    cornerSquareType: 'square',
    cornerDotType: 'square',
    cornerSquareColor: '#1e293b',
    cornerDotColor: '#1e293b',
  });
  
  const [activeType, setActiveType] = useState<QRType>('url');
  const [activeTab, setActiveTab] = useState<'content' | 'pattern' | 'corners' | 'logo'>('content');
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AIStyleSuggestion | null>(null);
  const [modalType, setModalType] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [history, setHistory] = useState<{value: string, timestamp: number}[]>([]);
  const [useGradient, setUseGradient] = useState(false);
  const [gradientColor, setGradientColor] = useState('#6366f1');

  const qrRef = useRef<HTMLDivElement>(null);
  const qrCode = useMemo(() => new QRCodeStyling(), []);

  // Persistence for history
  useEffect(() => {
    const saved = localStorage.getItem('qr_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const isValid = useMemo(() => {
    if (!config.value.trim()) return false;
    if (activeType === 'url') {
      try { new URL(config.value); return true; } catch { return config.value.includes('.'); }
    }
    return true;
  }, [config.value, activeType]);

  // Simple contrast check for scanability score
  const scanabilityScore = useMemo(() => {
    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.replace('#', ''), 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };
    try {
      const rgb1 = hexToRgb(config.fgColor);
      const rgb2 = hexToRgb(config.bgColor);
      const diff = Math.abs(rgb1[0]-rgb2[0]) + Math.abs(rgb1[1]-rgb2[1]) + Math.abs(rgb1[2]-rgb2[2]);
      if (diff < 150) return 'Poor';
      if (diff < 300) return 'Fair';
      return 'Excellent';
    } catch { return 'Unknown'; }
  }, [config.fgColor, config.bgColor]);

  useEffect(() => {
    const options: Options = {
      width: 320,
      height: 320,
      data: config.value || ' ',
      margin: config.includeMargin ? 15 : 5,
      qrOptions: { errorCorrectionLevel: config.level },
      image: logoSrc || undefined,
      dotsOptions: { 
        color: config.fgColor, 
        type: config.dotType,
        gradient: useGradient ? {
          type: 'linear',
          rotation: 45,
          colorStops: [
            { offset: 0, color: config.fgColor },
            { offset: 1, color: gradientColor }
          ]
        } as Gradient : undefined
      },
      backgroundOptions: { color: config.bgColor },
      imageOptions: { crossOrigin: 'anonymous', margin: 8, imageSize: 0.4, hideBackgroundDots: true },
      cornersSquareOptions: { type: config.cornerSquareType, color: config.cornerSquareColor },
      cornersDotOptions: { type: config.cornerDotType, color: config.cornerDotColor }
    };
    qrCode.update(options);
  }, [config, logoSrc, qrCode, useGradient, gradientColor]);

  useEffect(() => {
    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCode.append(qrRef.current);
    }
  }, [qrCode]);

  const handleDownload = (format: 'png' | 'svg' | 'webp') => {
    qrCode.download({ name: `qr-maker-${Date.now()}`, extension: format });
    addToast(`Successfully downloaded as ${format.toUpperCase()}`);
    
    // Add to history
    const newHistory = [{ value: config.value, timestamp: Date.now() }, ...history.slice(0, 4)];
    setHistory(newHistory);
    localStorage.setItem('qr_history', JSON.stringify(newHistory));
  };

  const copyToClipboard = async () => {
    try {
      const blob = await qrCode.getRawData('png');
      if (blob) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        addToast('QR Code copied to clipboard!');
      }
    } catch (err) {
      addToast('Failed to copy. Try downloading instead.', 'error');
    }
  };

  const applyAIStyle = async () => {
    if (!config.value) return;
    setIsAiLoading(true);
    try {
      const suggestion = await getAIStyleSuggestion(config.value);
      setAiSuggestion(suggestion);
      setConfig(prev => ({
        ...prev,
        fgColor: suggestion.primaryColor,
        bgColor: suggestion.secondaryColor,
        cornerSquareColor: suggestion.cornerSquareColor,
        cornerDotColor: suggestion.cornerDotColor,
        dotType: suggestion.dotType,
        cornerSquareType: suggestion.cornerSquareType,
        cornerDotType: suggestion.cornerDotType,
      }));
      addToast('AI Style applied successfully!');
    } catch (err) {
      addToast('AI suggestion failed. Check your API key.', 'error');
    } finally { setIsAiLoading(false); }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* TOAST SYSTEM */}
      <div className="fixed top-20 right-6 z-[200] space-y-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 fade-in duration-300 pointer-events-auto border-l-4 ${
            t.type === 'error' ? 'bg-red-50 text-red-800 border-red-500' : 
            t.type === 'info' ? 'bg-sky-50 text-sky-800 border-sky-500' : 
            'bg-emerald-50 text-emerald-800 border-emerald-500'
          }`}>
            <span className="text-sm font-bold">{t.message}</span>
          </div>
        ))}
      </div>

      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="qr-gradient w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 ring-4 ring-white transition-transform group-hover:scale-110">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-black text-slate-900 tracking-tight leading-none">QR Maker <span className="text-indigo-600">Studio</span></h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Free QR Code Generator</p>
            </div>
          </div>
          <nav className="hidden lg:flex items-center gap-10">
            {['how-to', 'benefits', 'faq'].map(section => (
              <button key={section} onClick={() => scrollToSection(section)} className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-all border-b-2 border-transparent hover:border-indigo-200 pb-1">{section.replace('-', ' ')}</button>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-4">
             <div className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-2 border border-emerald-100">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                Guest Mode Active
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex px-4 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-indigo-100 mb-2">
            No Signup Required • Generate QR as a Guest
          </div>
          <h2 className="text-5xl md:text-7xl font-display font-extrabold text-slate-900 tracking-tight">
            The Ultimate <span className="text-transparent bg-clip-text qr-gradient">QR Code Generator</span>
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            Professional qrcode generator studio. Design custom codes with AI, logos, and high-res exports. <span className="highlight-keyword">100% free with no registration.</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/40 border border-slate-200 overflow-hidden">
              <div className="flex bg-slate-50/80 border-b border-slate-100 p-2 gap-1">
                {(['content', 'pattern', 'corners', 'logo'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-2xl ${
                      activeTab === tab ? 'text-indigo-600 bg-white shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-10">
                {activeTab === 'content' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-wrap gap-2.5 p-2 bg-slate-100/50 rounded-2xl w-fit">
                      {(['url', 'text', 'email', 'phone', 'vcard'] as QRType[]).map(type => (
                        <button key={type} onClick={() => setActiveType(type)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{type}</button>
                      ))}
                    </div>
                    <div className="relative group">
                      <textarea 
                        value={config.value} 
                        onChange={(e) => setConfig(prev => ({ ...prev, value: e.target.value }))} 
                        placeholder={`Enter your ${activeType} content for the qrcode generator...`} 
                        className={`w-full h-48 p-8 rounded-[2.5rem] border-2 bg-white text-slate-900 placeholder:text-slate-200 focus:ring-8 outline-none transition-all resize-none text-xl font-bold shadow-inner ${isValid ? 'border-slate-100 focus:ring-indigo-50/50 focus:border-indigo-400' : 'border-red-100 focus:ring-red-50/50 focus:border-red-400'}`}
                      />
                      <div className="absolute bottom-8 right-8 flex items-center gap-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-sm ${isValid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                          {isValid ? 'Ready to Encode' : 'Invalid Data'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <Button variant="ghost" size="md" onClick={applyAIStyle} loading={isAiLoading} className="text-indigo-600 font-black tracking-widest text-[10px] uppercase hover:bg-indigo-50 px-8 rounded-2xl border border-indigo-100">
                        <svg className="mr-3 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        AI QR Code Maker Magic
                      </Button>
                      <div className="hidden sm:flex items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Anonymous Guest Access Enabled
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'pattern' && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                      {DOT_STYLES.map(style => (
                        <button key={style.value} onClick={() => setConfig(prev => ({ ...prev, dotType: style.value }))} className={`p-6 rounded-[2rem] border-2 text-left transition-all group ${config.dotType === style.value ? 'border-indigo-500 bg-indigo-50/50 shadow-lg' : 'border-slate-100 hover:border-slate-300'}`}>
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] block ${config.dotType === style.value ? 'text-indigo-600' : 'text-slate-400'}`}>{style.label}</span>
                        </button>
                      ))}
                    </div>
                    
                    <div className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 space-y-8">
                       <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">QRcode Generator Visual Effects</h4>
                       <div className="grid sm:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pattern Color</label>
                            <div className="flex gap-4 items-center p-4 bg-white rounded-2xl border-2 border-slate-100 focus-within:border-indigo-200 transition-all">
                              <input type="color" value={config.fgColor} onChange={(e) => setConfig(prev => ({ ...prev, fgColor: e.target.value }))} className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 bg-transparent ring-1 ring-slate-100"/>
                              <input type="text" value={config.fgColor} onChange={(e) => setConfig(prev => ({ ...prev, fgColor: e.target.value }))} className="bg-transparent text-sm font-mono font-bold uppercase outline-none flex-1 text-slate-600" />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Canvas Background</label>
                            <div className="flex gap-4 items-center p-4 bg-white rounded-2xl border-2 border-slate-100 focus-within:border-indigo-200 transition-all">
                              <input type="color" value={config.bgColor} onChange={(e) => setConfig(prev => ({ ...prev, bgColor: e.target.value }))} className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 bg-transparent ring-1 ring-slate-100"/>
                              <input type="text" value={config.bgColor} onChange={(e) => setConfig(prev => ({ ...prev, bgColor: e.target.value }))} className="bg-transparent text-sm font-mono font-bold uppercase outline-none flex-1 text-slate-600" />
                            </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'corners' && (
                  <div className="grid sm:grid-cols-2 gap-12 animate-in fade-in duration-500">
                    <div className="space-y-6">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Outer Square Style</label>
                      <div className="space-y-3">
                        {CORNER_SQUARE_STYLES.map(s => (
                          <button key={s.value} onClick={() => setConfig(prev => ({ ...prev, cornerSquareType: s.value }))} className={`w-full p-5 rounded-2xl border-2 text-left text-[11px] font-black uppercase tracking-widest transition-all ${config.cornerSquareType === s.value ? 'border-indigo-500 bg-indigo-50 shadow-md text-indigo-700' : 'border-slate-50 hover:border-slate-200 text-slate-500'}`}>{s.label}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-6">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inner Dot Style</label>
                      <div className="space-y-3">
                        {CORNER_DOT_STYLES.map(s => (
                          <button key={s.value} onClick={() => setConfig(prev => ({ ...prev, cornerDotType: s.value }))} className={`w-full p-5 rounded-2xl border-2 text-left text-[11px] font-black uppercase tracking-widest transition-all ${config.cornerDotType === s.value ? 'border-indigo-500 bg-indigo-50 shadow-md text-indigo-700' : 'border-slate-50 hover:border-slate-200 text-slate-500'}`}>{s.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'logo' && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <LogoUploader onUpload={setLogoSrc} currentLogo={logoSrc} />
                    <div className="p-8 rounded-[2.5rem] bg-indigo-900 text-white relative overflow-hidden shadow-2xl">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-4 text-indigo-300">Brand Integration</h4>
                      <p className="text-sm leading-relaxed text-indigo-100/90 font-medium italic">
                        "Your brand logo remains scannable with our Level H error correction. No signup required to add your corporate identity."
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-5 lg:sticky lg:top-28 space-y-8">
            <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 flex flex-col items-center group relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-3 qr-gradient"></div>
              
              <div className="w-full flex justify-between items-center mb-8">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Guest Status</span>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Verified Guest Access</span>
                 </div>
                 <button onClick={copyToClipboard} className="p-3 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all border border-slate-100 group/copy" title="Copy QR to Clipboard">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                 </button>
              </div>

              <div className="relative p-8 rounded-[3rem] bg-slate-50/50 shadow-inner">
                <div ref={qrRef} className="relative z-10 shadow-2xl rounded-3xl overflow-hidden bg-white border-[10px] border-white ring-1 ring-slate-100" />
              </div>

              <div className="w-full mt-12 space-y-4">
                <Button onClick={() => handleDownload('png')} disabled={!isValid} className="w-full py-6 text-lg rounded-3xl shadow-indigo-200 shadow-2xl hover:-translate-y-1.5 transition-all">Download QR Code PNG</Button>
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={() => handleDownload('svg')} disabled={!isValid} variant="outline" className="w-full py-4 text-[10px] font-black tracking-[0.2em] border-slate-200 uppercase hover:bg-slate-50 rounded-2xl">High-Res SVG</Button>
                  <Button onClick={() => handleDownload('webp')} disabled={!isValid} variant="outline" className="w-full py-4 text-[10px] font-black tracking-[0.2em] border-slate-200 uppercase hover:bg-slate-50 rounded-2xl">WebP Format</Button>
                </div>
              </div>
              
              <p className="mt-8 text-[9px] font-black text-slate-300 uppercase tracking-widest">Free QR Code Generator Studio</p>
            </div>
          </aside>
        </div>

        {/* MAXIMUM SEO KEYWORD STUFFED ARTICLE */}
        <article className="mt-40 seo-content max-w-5xl mx-auto border-t border-slate-200 pt-24 pb-20">
          <div className="inline-block px-5 py-2 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-8">Official QR Maker Studio Guide</div>
          
          <h2 id="how-to">The Best Free QR Code Generator & QRcode Generator Online</h2>
          <p>
            Welcome to the most powerful <span className="highlight-keyword">qr code generator</span> on the web. Whether you call it a <span className="highlight-keyword">qrcode generator</span> or a qr maker, our tool is designed for speed and professional quality. Best of all, there is <span className="highlight-keyword">no signup required</span> to use any of our features. You can <span className="highlight-keyword">generate qr as a guest</span> immediately without providing an email address or creating a password.
          </p>
          
          <h3>Why Use Our No Signup QR Code Maker?</h3>
          <p>
            Most tools force you to register just to download your image. We believe in open access. Our <span className="highlight-keyword">qr code maker</span> allows you to create unlimited codes anonymously. This is the ideal solution for users who want to <span className="highlight-keyword">generate qr as a guest</span> for quick marketing campaigns, personal vCards, or restaurant menus.
          </p>

          <div className="grid md:grid-cols-2 gap-10 my-16">
             <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
                <h4 className="font-bold text-slate-900 mb-4 text-xl">QR Code Generator Guest Mode</h4>
                <p className="text-sm">By utilizing our <span className="highlight-keyword">qrcode generator</span>, you maintain your privacy. No tracking, no spam, just high-quality codes.</p>
             </div>
             <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
                <h4 className="font-bold text-slate-900 mb-4 text-xl">Professional Customization</h4>
                <p className="text-sm">Even with <span className="highlight-keyword">no signup required</span>, you get access to brand logos, gradient colors, and custom dot shapes.</p>
             </div>
          </div>

          <h3>Advanced Features of the QRcode Generator Studio</h3>
          <ul>
            <li><strong>No Signup Required:</strong> Start designing your <span className="highlight-keyword">qr code generator</span> masterpiece instantly.</li>
            <li><strong>Generate QR as a Guest:</strong> Download high-resolution PNG and SVG vectors without an account.</li>
            <li><strong>Custom Branding:</strong> Add your own company logo to any code you create in our <span className="highlight-keyword">qrcode generator</span>.</li>
            <li><strong>AI Style Suggest:</strong> Let Gemini AI choose the perfect colors and patterns for your destination.</li>
            <li><strong>Industrial Scanning:</strong> High-level error correction ensures your codes work every time.</li>
          </ul>

          <h2 id="benefits">Benefits of Using a Free QR Maker for Business</h2>
          <p>
            A <span className="highlight-keyword">qr code generator</span> is an essential tool for modern marketing. By offering a <span className="highlight-keyword">no signup required</span> experience, we save you time and protect your data. You can <span className="highlight-keyword">generate qr as a guest</span> for social media profiles, Wi-Fi passwords, and crypto addresses without any friction.
          </p>
          
          <h2 id="faq">Frequently Asked Questions about our QRcode Generator</h2>
          <div className="space-y-4">
            {[
              { q: "Is this really a qrcode generator with no signup required?", a: "Absolutely. You can use every single feature of our qr code generator as a guest. No registration is ever required to download high-resolution images." },
              { q: "Can I generate qr as a guest for commercial use?", a: "Yes! Every code generated here is yours to keep and use for any purpose, including commercial marketing and printing." },
              { q: "Which is better: qrcode generator or qr code generator?", a: "Both terms refer to the same technology. Whether you search for 'qrcode generator' or 'qr code generator', our tool provides the best free experience online." }
            ].map((faq, i) => (
              <details key={i} className="p-8 bg-slate-50 rounded-[2.5rem] cursor-pointer group transition-all hover:bg-white border border-transparent hover:border-slate-200">
                <summary className="font-bold text-slate-900 list-none flex justify-between items-center text-lg tracking-tight">
                    {faq.q}
                    <span className="text-indigo-600 transition-transform group-open:rotate-180 p-2 bg-white rounded-full shadow-sm">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/></svg>
                    </span>
                </summary>
                <p className="mt-6 text-base text-slate-500 leading-relaxed font-medium">{faq.a}</p>
              </details>
            ))}
          </div>
        </article>
      </main>

      <footer className="bg-slate-950 text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-16 text-sm">
          <div className="space-y-6">
            <h5 className="font-display font-black text-3xl tracking-tight">QR Maker <span className="text-indigo-500">Studio</span></h5>
            <p className="text-slate-400 leading-relaxed text-base font-medium">The world's leading <span className="highlight-keyword">qr code generator</span> with <span className="highlight-keyword">no signup required</span>.</p>
          </div>
          <div className="space-y-6">
            <h6 className="font-black uppercase tracking-[0.3em] text-[10px] text-indigo-400">QR Tools</h6>
            <ul className="space-y-4 text-slate-400 font-bold tracking-tight">
              <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors">Free QRcode Generator</button></li>
              <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors">Generate QR as a Guest</button></li>
              <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors">No Signup QR Maker</button></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h6 className="font-black uppercase tracking-[0.3em] text-[10px] text-indigo-400">Legal</h6>
            <ul className="space-y-4 text-slate-400 font-bold tracking-tight">
              <li><button onClick={() => setModalType('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => setModalType('terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h6 className="font-black uppercase tracking-[0.3em] text-[10px] text-indigo-400">Mission</h6>
            <p className="text-xs text-slate-500 leading-relaxed font-bold">Providing high-end tools to every guest, because great design should be free for all.</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-24 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 text-center md:text-left">
          <span>© 2024 QR Code Generator Studio • No Signup Required</span>
          <div className="flex gap-8">
             <span>v4.3.1-SEO-PLUS</span>
             <span>Generate QR as a Guest</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <Modal title="Privacy Policy" isOpen={modalType === 'privacy'} onClose={() => setModalType(null)}>
        <p><strong>Private QRcode Generator:</strong> We do not track your activity. No signup means no database of your emails. Your privacy is our priority.</p>
      </Modal>

      <Modal title="Terms of Service" isOpen={modalType === 'terms'} onClose={() => setModalType(null)}>
        <p><strong>Free QR Code Generator License:</strong> You are free to use our guest generator for any legal purpose without credit.</p>
      </Modal>
    </div>
  );
};

export default App;
