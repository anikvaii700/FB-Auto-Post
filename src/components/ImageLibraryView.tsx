import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Sparkles,
  Trash2,
  Download,
  Copy,
  Plus,
  Palette,
  CheckCircle2,
  X,
} from 'lucide-react';
import { LibraryImage } from '../types.ts';
import { api } from '../services/api.ts';

interface Props {
  images: LibraryImage[];
  lang: 'en' | 'bn';
  onRefresh: () => void;
}

export const ImageLibraryView: React.FC<Props> = ({ images, lang, onRefresh }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'ai' | 'preset' | 'upload'>('all');
  const [showCardGenerator, setShowCardGenerator] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCat, setUploadCat] = useState('General');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Card Generator states
  const [cardQuote, setCardQuote] = useState('যে ব্যক্তি আল্লাহর ওপর ভরসা করে, আল্লাহই তার জন্য যথেষ্ট।');
  const [cardSource, setCardSource] = useState('— সূরা আত-ত্বালাক্ব: ৩');
  const [cardBg, setCardBg] = useState('/src/assets/images/social_islamic_bg_1794224545916.jpg');
  const [cardColorTheme, setCardColorTheme] = useState<'dark' | 'emerald' | 'amber'>('dark');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const filtered = images.filter((img) => {
    if (activeFilter === 'all') return true;
    return img.type === activeFilter;
  });

  const handleDelete = async (id: string) => {
    if (confirm(lang === 'bn' ? 'আপনি কি ছবিটি মুছে ফেলতে চান?' : 'Delete this image from library?')) {
      await api.deleteImage(id);
      onRefresh();
    }
  };

  const handleManualUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl) return;
    await api.saveImage({
      url: uploadUrl,
      title: uploadTitle || 'Uploaded Image',
      aspectRatio: '16:9',
      category: uploadCat,
      type: 'upload',
    });
    setUploadUrl('');
    setUploadTitle('');
    setShowUploadModal(false);
    onRefresh();
  };

  // Generate downloadable canvas card
  const handleExportCard = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630; // Perfect Facebook landscape share aspect ratio
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw background
      ctx.drawImage(img, 0, 0, 1200, 630);

      // Dark Overlay Scrim
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, 0, 1200, 630);

      // Border frame
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 1140, 570);

      // Logo / Brand mark
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MoSaFa AI Auto Poster', 600, 90);

      // Quote Text (Bengali wrap)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 38px "Hind Siliguri", "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';

      const words = cardQuote.split(' ');
      let line = '';
      let y = 280;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 950 && n > 0) {
          ctx.fillText(line, 600, y);
          line = words[n] + ' ';
          y += 55;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 600, y);

      // Source / Reference
      ctx.fillStyle = '#94A3B8';
      ctx.font = '500 24px "Hind Siliguri", sans-serif';
      ctx.fillText(cardSource, 600, y + 65);

      // Save to library
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      api.saveImage({
        url: dataUrl,
        title: cardQuote.substring(0, 30) + '...',
        aspectRatio: '16:9',
        category: 'Islamic',
        type: 'card',
      }).then(() => {
        onRefresh();
        alert(lang === 'bn' ? 'কার্ড তৈরি হয়ে লাইব্রেরিতে যুক্ত হয়েছে!' : 'Quote card generated and saved to library!');
        setShowCardGenerator(false);
      });
    };
    img.src = cardBg;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-500" />
            <span>{lang === 'bn' ? 'ব্যক্তিগত ইমেজ ও মিডিয়া লাইব্রেরি' : 'Media & Visual Asset Library'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'এআই জেনারেটেড ছবি, ফেসবুক পোস্ট ব্যানার এবং বাংলা উক্তি কার্ড প্রস্তুত ও পরিচালনা করুন।'
              : 'Manage AI generated images, Facebook landscape banners, and create branded Bengali quote cards.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowCardGenerator(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Palette className="w-4 h-4 text-amber-400" />
            <span>{lang === 'bn' ? 'উক্তি কার্ড তৈরি করুন' : 'Generate Quote Card'}</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ছবি যুক্ত করুন' : 'Add Image URL'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
        {(['all', 'preset', 'ai', 'upload'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer capitalize ${
              activeFilter === filter
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {filter === 'all'
              ? lang === 'bn' ? 'সকল ছবি' : 'All Media'
              : filter === 'preset'
              ? lang === 'bn' ? 'প্রিসেট ব্যানার' : 'Presets'
              : filter === 'ai'
              ? 'AI Generated'
              : lang === 'bn' ? 'আপলোডকৃত' : 'Uploaded'}
          </button>
        ))}
      </div>

      {/* Media Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((img) => (
          <div
            key={img.id}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src={img.url}
                  alt={img.title || 'Media asset'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-mono text-white">
                  {img.aspectRatio || '16:9'}
                </span>
                <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-semibold text-emerald-400">
                  {img.category || 'Visual'}
                </span>
              </div>

              <div className="p-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {img.title || 'MoSaFa Graphic Asset'}
                </h3>
                {img.prompt && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    "{img.prompt}"
                  </p>
                )}
              </div>
            </div>

            <div className="px-4 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono text-[11px]">
                {new Date(img.createdAt).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(img.url);
                    alert('Image URL copied!');
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Copy URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {img.type !== 'preset' && (
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Delete image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quote Card Generator Modal */}
      {showCardGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'বাংলা ইসলামিক ও মোটিভেশনাল উক্তি কার্ড জেনারেটর' : 'Bengali Quote Card Canvas Studio'}
                </h2>
              </div>
              <button
                onClick={() => setShowCardGenerator(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  উক্তি বা আয়াত (Quote Text):
                </label>
                <textarea
                  rows={2}
                  value={cardQuote}
                  onChange={(e) => setCardQuote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  সূত্র বা লেখক (Source Reference):
                </label>
                <input
                  type="text"
                  value={cardSource}
                  onChange={(e) => setCardSource(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  পটভূমির ছবি নির্বাচন (Background Theme):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div
                    onClick={() => setCardBg('/assets/aistudio/image_0add04d7.png')}
                    className={`p-1.5 rounded-lg border-2 cursor-pointer transition-all ${
                      cardBg.includes('image_0add04d7') ? 'border-magenta-500 ring-2 ring-fuchsia-500/30' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <img
                      src="/assets/aistudio/image_0add04d7.png"
                      alt="Magenta Wave"
                      className="w-full h-14 object-cover rounded"
                    />
                    <span className="block text-center mt-1 text-[10px] font-medium truncate">Magenta Wave</span>
                  </div>
                  <div
                    onClick={() => setCardBg('/src/assets/images/social_islamic_bg_1794224545916.jpg')}
                    className={`p-1.5 rounded-lg border-2 cursor-pointer transition-all ${
                      cardBg.includes('islamic') ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <img
                      src="/src/assets/images/social_islamic_bg_1794224545916.jpg"
                      alt="Islamic"
                      className="w-full h-14 object-cover rounded"
                    />
                    <span className="block text-center mt-1 text-[10px] font-medium truncate">Islamic</span>
                  </div>
                  <div
                    onClick={() => setCardBg('/src/assets/images/social_nature_bg_1794224545379.jpg')}
                    className={`p-1.5 rounded-lg border-2 cursor-pointer transition-all ${
                      cardBg.includes('nature') ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <img
                      src="/src/assets/images/social_nature_bg_1794224545379.jpg"
                      alt="Nature"
                      className="w-full h-14 object-cover rounded"
                    />
                    <span className="block text-center mt-1 text-[10px] font-medium truncate">Nature</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCardGenerator(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExportCard}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{lang === 'bn' ? 'কার্ড তৈরি ও সংরক্ষণ করুন' : 'Render & Save Card'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              {lang === 'bn' ? 'ইমেজ লিঙ্ক যুক্ত করুন' : 'Add Image via URL'}
            </h2>
            <form onSubmit={handleManualUpload} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Image URL *</label>
                <input
                  type="url"
                  required
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Istighfar reminder card"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Save Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
