import React, { useState } from 'react';
import {
  UploadCloud,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  Image as ImageIcon,
  ArrowRight,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { LibraryImage, PostItem } from '../types.ts';

interface Props {
  lang: 'en' | 'bn';
  libraryImages: LibraryImage[];
  onPostsScheduled: () => void;
  onNavigateToQueue: () => void;
}

interface PhotoBatchItem {
  id: string;
  imageUrl: string;
  file?: File;
  previewUrl: string;
  title: string;
  caption: string;
  hashtags: string[];
  scheduledTime: string; // ISO string or local display
  isGeneratingCaption?: boolean;
}

export const BatchPhotoPosterView: React.FC<Props> = ({
  lang,
  libraryImages,
  onPostsScheduled,
  onNavigateToQueue,
}) => {
  const [items, setItems] = useState<PhotoBatchItem[]>([]);
  const [intervalHours, setIntervalHours] = useState<number>(3);
  const [startDelayMinutes, setStartDelayMinutes] = useState<number>(30);
  const [preferredTheme, setPreferredTheme] = useState<string>('Islamic & Inspirational');
  const [preferredTone, setPreferredTone] = useState<string>('Heart-touching, gentle & inspiring');
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);
  const [isScheduling, setIsScheduling] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Recalculate scheduled times for all items based on interval
  const recalculateTimes = (batchList: PhotoBatchItem[], interval: number, delayMins: number) => {
    const base = Date.now() + delayMins * 60 * 1000;
    return batchList.map((item, idx) => {
      const scheduledDate = new Date(base + idx * interval * 60 * 60 * 1000);
      return {
        ...item,
        scheduledTime: scheduledDate.toISOString(),
      };
    });
  };

  // Handle file uploads (multiple images)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: PhotoBatchItem[] = [];

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newItem: PhotoBatchItem = {
          id: `upload_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
          imageUrl: dataUrl,
          file,
          previewUrl: dataUrl,
          title: `ছবি #${items.length + newItems.length + 1}`,
          caption: '',
          hashtags: ['#TheMosafa', '#ছবি_পোস্ট', '#Inspiration'],
          scheduledTime: new Date().toISOString(),
        };

        setItems((prev) => {
          const updated = [...prev, newItem];
          return recalculateTimes(updated, intervalHours, startDelayMinutes);
        });

        // Auto-generate caption for this uploaded item
        generateCaptionForItem(newItem);
      };
      reader.readAsDataURL(file);
    });
  };

  // Add from existing library presets
  const handleAddFromLibrary = (img: LibraryImage) => {
    const newItem: PhotoBatchItem = {
      id: `lib_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      imageUrl: img.url,
      previewUrl: img.url,
      title: img.title || 'লাইব্রেরি ছবি',
      caption: '',
      hashtags: ['#TheMosafa', '#IslamicReminder', '#Nature'],
      scheduledTime: new Date().toISOString(),
    };

    setItems((prev) => {
      const updated = [...prev, newItem];
      return recalculateTimes(updated, intervalHours, startDelayMinutes);
    });

    generateCaptionForItem(newItem, img.prompt);
  };

  // Generate caption for a single item using Gemini
  const generateCaptionForItem = async (item: PhotoBatchItem, promptHint?: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isGeneratingCaption: true } : i))
    );

    try {
      const res = await api.generateImageCaption({
        imageBase64: item.previewUrl.startsWith('data:image/') ? item.previewUrl : undefined,
        imagePrompt: promptHint || item.title,
        theme: preferredTheme,
        preferredTone: preferredTone,
      });

      if (res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  title: res.title || i.title,
                  caption: res.caption,
                  hashtags: res.hashtags || i.hashtags,
                  isGeneratingCaption: false,
                }
              : i
          )
        );
      }
    } catch (err) {
      console.warn('Caption generation error:', err);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isGeneratingCaption: false } : i))
      );
    }
  };

  // Generate captions for all items
  const handleGenerateAllCaptions = async () => {
    if (items.length === 0) return;
    setIsProcessingAll(true);
    setStatusMessage(null);

    for (const item of items) {
      await generateCaptionForItem(item);
    }

    setIsProcessingAll(false);
    setStatusMessage({
      type: 'success',
      text: lang === 'bn' ? '✓ সব ছবির জন্য সুন্দর ছোট ক্যাপশন তৈরি সম্পন্ন হয়েছে!' : '✓ Captions generated for all images!',
    });
  };

  // Schedule all items to the background publishing queue
  const handleScheduleAll = async () => {
    if (items.length === 0) return;

    setIsScheduling(true);
    setStatusMessage(null);

    try {
      const res = await api.createBatchImagePosts({
        items: items.map((item) => ({
          imageUrl: item.imageUrl,
          title: item.title,
          caption: item.caption || 'আলহামদুলিল্লাহ আলা কুল্লি হাল। 🌿✨',
          hashtags: item.hashtags,
          scheduledAt: item.scheduledTime,
          categoryName: 'ছবি ও অটো ক্যাপশন',
        })),
        scheduleIntervalHours: intervalHours,
        startDelayMinutes,
      });

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: lang === 'bn'
            ? `আলহামদুলিল্লাহ! ${res.count}টি ছবি ও ক্যাপশন শিডিউল কিউতে যুক্ত হয়েছে। নির্ধারিত সময়ে স্বয়ংক্রিয়ভাবে ফেসবুক পেজে পোস্ট হবে!`
            : `Success! ${res.count} photo posts scheduled to the queue!`,
        });
        setItems([]);
        onPostsScheduled();
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'শিডিউল করতে সমস্যা হয়েছে',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Network error scheduling batch posts',
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      return recalculateTimes(filtered, intervalHours, startDelayMinutes);
    });
  };

  const handleUpdateItemCaption = (id: string, caption: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, caption } : i)));
  };

  const handleUpdateItemTitle = (id: string, title: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, title } : i)));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 text-white shadow-lg">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{lang === 'bn' ? 'স্বয়ংক্রিয় ছবি ও ক্যাপশন শিডিউলার' : 'Batch Photo Caption & Auto Scheduler'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {lang === 'bn'
              ? 'অনেকগুলো ছবি আপলোড করুন ➔ AI মিলিয়ে ক্যাপশন লিখবে ➔ আপনার নির্ধারিত টাইমে পোস্ট হবে'
              : 'Upload Multiple Photos ➔ AI Generates Matching Captions ➔ Auto-Publishes on Schedule'}
          </h1>
          <p className="mt-2 text-sm text-emerald-100 leading-relaxed">
            {lang === 'bn'
              ? 'আপনার ফোনের বা কম্পিউটারের ১০-২০টি ছবি একসাথে দিন। Gemini AI প্রতিটি ছবির দৃশ্য ও মেজাজ বুঝে ছোট, আকর্ষক বাংলা ক্যাপশন তৈরি করে দেবে এবং আপনি যে বিরতিতে চাইবেন (যেমন প্রতি ২ বা ৩ ঘণ্টা পর পর) স্বয়ংক্রিয়ভাবে ফেসবুক পেজে পাবলিশ করে দেবে।'
              : 'Upload multiple images at once. Gemini AI analyzes each image, writes a concise aesthetic caption, and schedules them at your chosen frequency.'}
          </p>
        </div>
      </div>

      {/* Main Grid: Upload & Schedule Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Upload Zone & Schedule Settings */}
        <div className="lg:col-span-5 space-y-5">
          {/* File Upload Dropzone */}
          <div className="rounded-2xl border-2 border-dashed border-emerald-400/60 dark:border-emerald-600/40 bg-white dark:bg-slate-900 p-6 text-center shadow-xs hover:border-emerald-500 transition-colors">
            <input
              type="file"
              id="batch-photo-upload"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="batch-photo-upload"
              className="cursor-pointer flex flex-col items-center justify-center gap-3"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'এখানে ক্লিক করে একসাথে একাধিক ছবি নির্বাচন করুন' : 'Click to select multiple photos'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'bn' ? 'JPG, PNG, WebP (একসাথে ১০-২০টি ছবি সিলেক্ট করতে পারেন)' : 'JPG, PNG, WebP (select multiple images at once)'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs">
                <UploadCloud className="w-4 h-4" />
                {lang === 'bn' ? 'ছবি ব্রাউজ করুন' : 'Browse Files'}
              </span>
            </label>
          </div>

          {/* Quick Preset Library Images */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              {lang === 'bn' ? 'অথবা লাইব্রেরি থেকে ছবি যোগ করুন' : 'Or Pick from Library Presets'}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {libraryImages.slice(0, 4).map((img) => (
                <div
                  key={img.id}
                  onClick={() => handleAddFromLibrary(img)}
                  className="group relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-500 transition-all shadow-xs"
                >
                  <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-medium">
                    + যোগ করুন
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scheduling Configuration */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              {lang === 'bn' ? 'শিডিউল ও পোস্টের সময় নির্ধারণ' : 'Posting Schedule Settings'}
            </h3>

            {/* Interval between posts */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'প্রতিটি ছবির মধ্যবর্তী বিরতি (Interval)' : 'Time Interval Between Posts'}
              </label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[1, 2, 3, 6].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => {
                      setIntervalHours(hrs);
                      setItems((prev) => recalculateTimes(prev, hrs, startDelayMinutes));
                    }}
                    className={`py-2 px-2 rounded-lg font-semibold text-center border cursor-pointer ${
                      intervalHours === hrs
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {hrs} {lang === 'bn' ? 'ঘণ্টা' : 'Hrs'}
                  </button>
                ))}
              </div>
            </div>

            {/* First post start delay */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'প্রথম পোস্ট শুরু হবে' : 'First Post Starts In'}
              </label>
              <select
                value={startDelayMinutes}
                onChange={(e) => {
                  const mins = parseInt(e.target.value, 10);
                  setStartDelayMinutes(mins);
                  setItems((prev) => recalculateTimes(prev, intervalHours, mins));
                }}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              >
                <option value={10}>১০ মিনিট পর (10 Minutes from now)</option>
                <option value={30}>৩০ মিনিট পর (30 Minutes from now)</option>
                <option value={60}>১ ঘণ্টা পর (1 Hour from now)</option>
                <option value={180}>৩ ঘণ্টা পর (3 Hours from now)</option>
              </select>
            </div>

            {/* AI Caption Style & Mood */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'ক্যাপশনের ধরন ও মেজাজ' : 'AI Caption Theme & Mood'}
              </label>
              <select
                value={preferredTheme}
                onChange={(e) => setPreferredTheme(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
              >
                <option value="Islamic & Spiritual">ইসলামিক নসিহত ও রিমাইন্ডার (Islamic & Spiritual)</option>
                <option value="Motivational & Success">আত্মউন্নয়ন ও মোটিভেশন (Motivational)</option>
                <option value="Beauty of Bangladesh">প্রকৃতি ও আমাদের বাংলাদেশ (Nature & Scenic)</option>
                <option value="Wisdom & Deep Quotes">বাছাইকৃত গভীর উক্তি (Inspirational Quotes)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Side: Selected Images & AI Generated Captions Queue */}
        <div className="lg:col-span-7 space-y-4">
          {/* Top Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                {lang === 'bn' ? `নির্বাচিত ছবি (${items.length}টি)` : `Selected Photos (${items.length})`}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'bn' ? 'ক্যাপশন যাচাই করুন এবং শিডিউলে যুক্ত করুন' : 'Review generated captions & schedule'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleGenerateAllCaptions}
                  disabled={isProcessingAll}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isProcessingAll ? 'তৈরি হচ্ছে...' : 'সব ক্যাপশন রি-জেনারেট'}
                </button>
              )}

              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleScheduleAll}
                  disabled={isScheduling}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isScheduling ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  {lang === 'bn' ? `সব ছবি শিডিউল করুন (${items.length})` : `Schedule All (${items.length})`}
                </button>
              )}
            </div>
          </div>

          {/* Toast / Status alert */}
          {statusMessage && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/30 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span className="font-medium leading-relaxed">{statusMessage.text}</span>
              </div>
              {statusMessage.type === 'success' && (
                <button
                  type="button"
                  onClick={onNavigateToQueue}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  কিউ দেখুন <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Empty State */}
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'এখনো কোনো ছবি যোগ করা হয়নি' : 'No photos added yet'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {lang === 'bn'
                  ? 'বামে "ছবি ব্রাউজ করুন" বাটনে ক্লিক করে এক সাথে ৫-১০টি ছবি সিলেক্ট করুন। AI স্বয়ংক্রিয়ভাবে ছোট ক্যাপশন তৈরি করে শিডিউল সাজিয়ে দেবে।'
                  : 'Click Browse Files on the left to add photos. AI will automatically generate short matching captions.'}
              </p>
            </div>
          )}

          {/* Photo Items List */}
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-4 items-start"
              >
                {/* Photo Thumbnail */}
                <div className="relative w-full sm:w-36 h-28 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                  <img src={item.previewUrl} alt={item.title} className="w-full h-full object-cover" />
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                    #{idx + 1}
                  </span>
                </div>

                {/* Caption Details & Scheduled Time */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleUpdateItemTitle(item.id, e.target.value)}
                      placeholder="শিরোনাম / টপিক"
                      className="font-bold text-xs text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-emerald-500 focus:outline-hidden pb-0.5"
                    />

                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.scheduledTime).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Caption Input */}
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={item.caption}
                      onChange={(e) => handleUpdateItemCaption(item.id, e.target.value)}
                      placeholder={item.isGeneratingCaption ? 'AI ক্যাপশন তৈরি করছে...' : 'ছোট ক্যাপশন লিখুন বা AI বাটনে চাপুন...'}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white leading-relaxed resize-none"
                    />
                    {item.isGeneratingCaption && (
                      <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
                        <span>AI ক্যাপশন তৈরি করছে...</span>
                      </div>
                    )}
                  </div>

                  {/* Hashtags and Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                    <div className="flex flex-wrap gap-1 text-slate-500 font-mono text-[10px]">
                      {item.hashtags.map((tag, tIdx) => (
                        <span key={tIdx} className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => generateCaptionForItem(item)}
                        disabled={item.isGeneratingCaption}
                        title="ক্যাপশন পুনরায় তৈরি করুন"
                        className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        title="ছবি বাদ দিন"
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
