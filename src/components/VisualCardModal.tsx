import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Sparkles, Download, Check, Palette, Image as ImageIcon, Type, Layout } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAttachImage: (dataUrl: string) => void;
  initialTitle?: string;
  initialBody?: string;
  categoryName?: string;
  lang: 'en' | 'bn';
}

const BACKGROUND_OPTIONS = [
  {
    id: 'islamic_arch',
    name: 'Islamic Golden Arch & Lantern',
    nameBn: 'ইসলামিক সোনালী খিলান ও লণ্ঠন',
    url: '/src/assets/images/social_islamic_bg_1794224545916.jpg',
    theme: 'islamic',
  },
  {
    id: 'nature_lake',
    name: 'Serene Nature Sunset',
    nameBn: 'প্রাকৃতিক সূর্যাস্ত ও নদী',
    url: '/src/assets/images/social_nature_bg_1794224545379.jpg',
    theme: 'nature',
  },
  {
    id: 'magenta_wave',
    name: 'Modern Magenta Wave',
    nameBn: 'ম্যাজেন্টা নিয়ন ওয়েভ',
    url: '/src/assets/images/user_bg_magenta_wave.png',
    theme: 'modern',
  },
  {
    id: 'grad_emerald',
    name: 'Royal Emerald Gradient',
    nameBn: 'রয়েল পান্না গ্রেডিয়েন্ট',
    gradient: ['#064e3b', '#022c22', '#041e16'],
    theme: 'dark',
  },
  {
    id: 'grad_sapphire',
    name: 'Midnight Sapphire Gradient',
    nameBn: 'নীলকান্তমণি গ্রেডিয়েন্ট',
    gradient: ['#1e1b4b', '#0f172a', '#020617'],
    theme: 'dark',
  },
  {
    id: 'grad_crimson',
    name: 'Deep Crimson & Gold',
    nameBn: 'রক্তিম ও সোনালী আভা',
    gradient: ['#4c0519', '#1f040d', '#0f0206'],
    theme: 'dark',
  },
];

export const VisualCardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAttachImage,
  initialTitle = '',
  initialBody = '',
  categoryName = 'The Mosafa',
  lang,
}) => {
  if (!isOpen) return null;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedBg, setSelectedBg] = useState(BACKGROUND_OPTIONS[0]);
  const [cardTitle, setCardTitle] = useState(initialTitle || 'জীবন ও বিশ্বাসের সুন্দর শিক্ষা');
  const [cardBody, setCardBody] = useState(
    initialBody
      ? initialBody.replace(/[\n\r]+/g, ' ').substring(0, 220) + (initialBody.length > 220 ? '...' : '')
      : 'ধৈর্য ও সালাতের মাধ্যমে নিজের পথ খুঁজুন। নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সাথে আছেন।'
  );
  const [pageBranding, setPageBranding] = useState('The Mosafa Official');
  const [overlayOpacity, setOverlayOpacity] = useState(0.45);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9'>('1:1');
  const [fontSize, setFontSize] = useState(36);
  const [generating, setGenerating] = useState(false);
  const [applied, setApplied] = useState(false);

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = aspectRatio === '1:1' ? 1080 : 608;
    canvas.width = width;
    canvas.height = height;

    const drawContent = () => {
      // 1. Dark Vignette / Overlay
      ctx.fillStyle = `rgba(5, 7, 18, ${overlayOpacity})`;
      ctx.fillRect(0, 0, width, height);

      // Subtle gradient overlay for extra legibility
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Elegant Border & Golden Ornaments
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.55)'; // Amber/gold
      ctx.lineWidth = 4;
      ctx.strokeRect(36, 36, width - 72, height - 72);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(48, 48, width - 96, height - 96);

      // Corner flourishes
      const cornerSize = 24;
      ctx.fillStyle = '#f59e0b';
      // Top-left
      ctx.fillRect(34, 34, cornerSize, 6);
      ctx.fillRect(34, 34, 6, cornerSize);
      // Top-right
      ctx.fillRect(width - 34 - cornerSize, 34, cornerSize, 6);
      ctx.fillRect(width - 40, 34, 6, cornerSize);
      // Bottom-left
      ctx.fillRect(34, height - 40, cornerSize, 6);
      ctx.fillRect(34, height - 34 - cornerSize, 6, cornerSize);
      // Bottom-right
      ctx.fillRect(width - 34 - cornerSize, height - 40, cornerSize, 6);
      ctx.fillRect(width - 40, height - 34 - cornerSize, 6, cornerSize);

      // 3. Category Badge (Top Center)
      const badgeText = `✦  ${categoryName || 'ISLAMIC REFLECTION'}  ✦`;
      ctx.font = '600 22px "Hind Siliguri", sans-serif';
      ctx.fillStyle = '#fef08a'; // Yellow 200
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, width / 2, 90);

      // Decorative divider under badge
      ctx.fillStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.fillRect(width / 2 - 80, 108, 160, 2);

      // 4. Title / Hook
      if (cardTitle.trim()) {
        ctx.font = 'bold 44px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        // Wrap title
        const cleanTitle = cardTitle.replace(/^[【「『\[★\s]+|[】」』\]★\s]+$/g, '');
        ctx.fillText(`❝ ${cleanTitle} ❞`, width / 2, height > 800 ? 220 : 180);
        ctx.shadowBlur = 0;
      }

      // 5. Body / Quote Content
      if (cardBody.trim()) {
        ctx.font = `500 ${fontSize}px "Hind Siliguri", sans-serif`;
        ctx.fillStyle = '#f8fafc'; // Slate 50
        ctx.textAlign = 'center';

        const maxWidth = width - 180;
        const lineHeight = fontSize * 1.55;
        const words = cardBody.split(' ');
        let line = '';
        const lines: string[] = [];

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line.trim());

        const totalTextHeight = lines.length * lineHeight;
        const startY = height / 2 - totalTextHeight / 2 + (height > 800 ? 50 : 25);

        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], width / 2, startY + i * lineHeight);
        }
      }

      // 6. Watermark & Branding (Bottom)
      const bottomY = height - 75;

      // Small star divider
      ctx.fillStyle = '#f59e0b';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❖  ❖  ❖', width / 2, bottomY - 30);

      // Page Name
      ctx.font = 'bold 26px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`🌟 ${pageBranding} 🌟`, width / 2, bottomY);
    };

    if (selectedBg.url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Draw background image cover
        const imgRatio = img.width / img.height;
        const targetRatio = width / height;
        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;

        if (imgRatio > targetRatio) {
          sWidth = img.height * targetRatio;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / targetRatio;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);
        drawContent();
      };
      img.onerror = () => {
        // Fallback to gradient if image fails to load
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        drawContent();
      };
      img.src = selectedBg.url;
    } else if (selectedBg.gradient) {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, selectedBg.gradient[0]);
      grad.addColorStop(0.5, selectedBg.gradient[1]);
      grad.addColorStop(1, selectedBg.gradient[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      drawContent();
    }
  }, [aspectRatio, selectedBg, cardTitle, cardBody, pageBranding, overlayOpacity, fontSize, categoryName]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const handleAttach = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setGenerating(true);
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onAttachImage(dataUrl);
      setApplied(true);
      setTimeout(() => {
        setApplied(false);
        onClose();
      }, 700);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `TheMosafa_Card_${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 my-auto flex flex-col max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-xl text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {lang === 'bn' ? 'ফেসবুক ভিজ্যুয়াল ব্যাকগ্রাউন্ড কার্ড ও পোস্টার জেনারেটর' : 'Facebook Visual Card & Poster Generator'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'আপনার পোস্টের জন্য আকর্ষণীয় ব্যাকগ্রাউন্ড ইমেজ ও ফন্ট দিয়ে এইচডি সোশ্যাল ব্যানার তৈরি করুন।'
                  : 'Generate a high-definition social visual card for Facebook with aesthetic typography.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
          {/* Controls (Left 6 cols) */}
          <div className="lg:col-span-6 space-y-4 text-xs">
            {/* Background Style Picker */}
            <div>
              <label className="block font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'bn' ? 'ব্যাকগ্রাউন্ড নির্বাচন করুন:' : 'Choose Background Style:'}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BACKGROUND_OPTIONS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setSelectedBg(bg)}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedBg.id === bg.id
                        ? 'border-amber-400 bg-amber-500/10 text-white ring-1 ring-amber-400'
                        : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-[11px] truncate">{lang === 'bn' ? bg.nameBn : bg.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title / Hook Input */}
            <div>
              <label className="block font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-blue-400" />
                <span>{lang === 'bn' ? 'কার্ডের শিরোনাম / হুক:' : 'Card Title / Hook:'}</span>
              </label>
              <input
                type="text"
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                placeholder="যেমন: ইস্তিগফারের অলৌকিক রহমত"
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-sans text-xs"
              />
            </div>

            {/* Body Quote Input */}
            <div>
              <label className="block font-semibold text-slate-200 mb-1">
                {lang === 'bn' ? 'মূল বাণী বা কোট (কার্ডে প্রদর্শনের জন্য):' : 'Main Quote / Text for Card:'}
              </label>
              <textarea
                rows={3}
                value={cardBody}
                onChange={(e) => setCardBody(e.target.value)}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs leading-relaxed"
              />
            </div>

            {/* Slider Settings: Overlay & Font Size */}
            <div className="grid grid-cols-2 gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
              <div>
                <label className="block text-slate-300 text-[11px] mb-1">
                  {lang === 'bn' ? 'ব্যাকগ্রাউন্ড ডার্কনেস:' : 'Background Darkness:'} {Math.round(overlayOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.85"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-[11px] mb-1">
                  {lang === 'bn' ? 'ফন্ট সাইজ:' : 'Font Size:'} {fontSize}px
                </label>
                <input
                  type="range"
                  min="26"
                  max="46"
                  step="2"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Page Branding & Aspect Ratio */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  {lang === 'bn' ? 'পেজ ব্রান্ডিং / ওয়াটারমার্ক:' : 'Page Watermark:'}
                </label>
                <input
                  type="text"
                  value={pageBranding}
                  onChange={(e) => setPageBranding(e.target.value)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  {lang === 'bn' ? 'সাইজ ফরম্যাট:' : 'Aspect Ratio:'}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('1:1')}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                      aspectRatio === '1:1'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-slate-700 bg-slate-800 text-slate-300'
                    }`}
                  >
                    1:1 Square
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                      aspectRatio === '16:9'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-slate-700 bg-slate-800 text-slate-300'
                    }`}
                  >
                    16:9 Banner
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview (Right 6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'bn' ? 'লাইভ এইচডি পোস্টার প্রিভিউ:' : 'HD Social Poster Live Preview:'}</span>
            </p>

            <div className="w-full flex items-center justify-center overflow-hidden rounded-xl shadow-xl max-h-[360px]">
              <canvas
                ref={canvasRef}
                className="w-full h-auto max-h-[350px] object-contain rounded-xl border border-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'bn' ? 'এইচডি ইমেজ ডাউনলোড করুন' : 'Download HD Image'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs cursor-pointer font-medium"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleAttach}
              disabled={generating}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950"
            >
              {applied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>{lang === 'bn' ? 'কার্ড যুক্ত হয়েছে!' : 'Card Attached!'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{lang === 'bn' ? 'পোস্টে ব্যাকগ্রাউন্ড হিসেবে সেভ করুন' : 'Attach to Post as Background Photo'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
