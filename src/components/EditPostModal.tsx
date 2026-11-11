import React, { useState } from 'react';
import { X, Calendar, Image as ImageIcon, Check, Sparkles, Wand2, Type, Palette } from 'lucide-react';
import { PostItem } from '../types.ts';
import { VisualCardModal } from './VisualCardModal.tsx';
import { applyStylePreset } from '../utils/textFormatter.ts';

interface Props {
  post: PostItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: PostItem) => void;
  lang: 'en' | 'bn';
}

const PRESET_BACKGROUNDS = [
  {
    name: 'Islamic Mosque',
    nameBn: '🕌 ইসলামিক লণ্ঠন',
    url: '/src/assets/images/social_islamic_bg_1794224545916.jpg',
  },
  {
    name: 'Nature Sunset',
    nameBn: '🌿 নদী ও সূর্যাস্ত',
    url: '/src/assets/images/social_nature_bg_1794224545379.jpg',
  },
  {
    name: 'Magenta Glow',
    nameBn: '🌌 ম্যাজেন্টা ওয়েভ',
    url: '/src/assets/images/user_bg_magenta_wave.png',
  },
];

export const EditPostModal: React.FC<Props> = ({ post, isOpen, onClose, onSave, lang }) => {
  if (!isOpen || !post) return null;

  const [title, setTitle] = useState(post.title || '');
  const [body, setBody] = useState(post.body || '');
  const [hashtagsStr, setHashtagsStr] = useState(post.hashtags?.join(' ') || '');
  const [scheduledAt, setScheduledAt] = useState(post.scheduledAt?.substring(0, 16) || '');
  const [imageUrl, setImageUrl] = useState(post.imageUrl || '');
  const [status, setStatus] = useState(post.status);
  const [cardModalOpen, setCardModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PostItem = {
      ...post,
      title: title.trim() || undefined,
      body: body.trim(),
      hashtags: hashtagsStr
        .split(' ')
        .map((s) => s.trim())
        .filter((s) => s.startsWith('#')),
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : post.scheduledAt,
      imageUrl: imageUrl.trim() || undefined,
      imageSource: imageUrl ? 'ai' : post.imageSource,
      status,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    onClose();
  };

  const handleApplyStyle = (styleType: 'islamic_frame' | 'motivational_frame' | 'quote_marks' | 'bold_english' | 'divider' | 'dua_closing') => {
    setBody((prev) => applyStylePreset(prev, styleType));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 my-6 max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-500" />
                <span>{lang === 'bn' ? 'পোস্ট ও ব্যাকগ্রাউন্ড সম্পাদনা করুন' : 'Edit Post & Background Style'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'সুন্দর ফন্ট, ইসলামিক অলঙ্করণ এবং আকর্ষণীয় ব্যাকগ্রাউন্ড ইমেজ যুক্ত করুন।'
                  : 'Customize typography, decorative frames, and visual background images.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
            {/* Title / Hook */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'Title / Hook (শিরোনাম বা হুক)' : 'Title / Hook'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: ইস্তিগফারের অলৌকিক বরকত"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-semibold"
              />
            </div>

            {/* Quick Styling Toolbar for Body */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'পোস্টের মূল লেখা (Status Content) *' : 'Post Body Content *'}
                </label>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">
                    {lang === 'bn' ? 'স্টাইল যোগ করুন:' : 'Style preset:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyStyle('islamic_frame')}
                    className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium hover:bg-emerald-500/20 cursor-pointer"
                    title="ইসলামিক ফ্রেম ও দোয়া যুক্ত করুন"
                  >
                    🕌 ইসলামিক ফ্রেম
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyStyle('motivational_frame')}
                    className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-medium hover:bg-amber-500/20 cursor-pointer"
                    title="মোটিভেশনাল ফ্রেম যুক্ত করুন"
                  >
                    🌟 মোটিভেশনাল
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyStyle('bold_english')}
                    className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[11px] font-medium hover:bg-blue-500/20 cursor-pointer"
                    title="ইংরেজি শব্দগুলোকে বোল্ড ইউনিকোডে রূপান্তর করুন"
                  >
                    𝗕 বোল্ড ইংলিশ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyStyle('quote_marks')}
                    className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-medium hover:bg-purple-500/20 cursor-pointer"
                    title="উদ্ধৃতি চিহ্নে আবৃত করুন"
                  >
                    ❝ কোট ❞
                  </button>
                </div>
              </div>

              <textarea
                rows={6}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white leading-relaxed font-sans text-xs"
              />
            </div>

            {/* Visual Background Section (Crucial for User's Request) */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <span>{lang === 'bn' ? 'ফেসবুক পোস্টের ব্যাকগ্রাউন্ড ছবি (Photo Post)' : 'Facebook Post Background Photo'}</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'ছবি যুক্ত থাকলে ফেসবুকে আকর্ষণীয় ফটো পোস্ট হিসেবে ব্যাকগ্রাউন্ড সহ প্রকাশিত হবে।'
                      : 'Posts with an image are published to Facebook as visual photo posts.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCardModalOpen(true)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? '🎨 এইচডি কার্ড তৈরি করুন' : 'Generate Visual Card'}</span>
                </button>
              </div>

              {/* Preset Background Quick Selectors */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {lang === 'bn' ? 'প্রিসেট ব্যাকগ্রাউন্ড:' : 'Preset Backdrops:'}
                </span>
                {PRESET_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.url}
                    type="button"
                    onClick={() => setImageUrl(bg.url)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer transition-colors ${
                      imageUrl === bg.url
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {bg.nameBn}
                  </button>
                ))}
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-[11px] text-rose-500 hover:underline cursor-pointer ml-auto"
                  >
                    {lang === 'bn' ? 'ছবি বাতিল' : 'Remove Image'}
                  </button>
                )}
              </div>

              {/* Current Image Preview & URL input */}
              <div className="flex items-center gap-3 pt-1">
                {imageUrl ? (
                  <div className="w-20 h-14 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 bg-slate-900">
                    <img
                      src={imageUrl}
                      alt="Post backdrop preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-14 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0 text-[10px]">
                    {lang === 'bn' ? 'ছবি নেই' : 'No image'}
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder={lang === 'bn' ? 'ছবির পাথ বা URL (যেমন /src/assets/images/... অথবা https://...)' : 'Image path or URL'}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-[11px] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'Hashtags (হ্যাশট্যাগ)' : 'Hashtags'}
              </label>
              <input
                type="text"
                value={hashtagsStr}
                onChange={(e) => setHashtagsStr(e.target.value)}
                placeholder="#TheMosafa #ইস্তিগফার #IslamicReminder #Faith"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-blue-600 dark:text-blue-400 font-mono text-xs"
              />
            </div>

            {/* Publishing Time & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'নির্ধারিত সময় (Scheduled Time)' : 'Scheduled Publishing Time'}
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'স্ট্যাটাস (Status)' : 'Queue Status'}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white capitalize text-xs"
                >
                  <option value="scheduled">Scheduled (অটো শিডিউল)</option>
                  <option value="pending">Pending (অপেক্ষমান)</option>
                  <option value="draft">Draft (খসড়া)</option>
                  <option value="paused">Paused (স্থগিত)</option>
                  <option value="published">Published (প্রকাশিত)</option>
                  <option value="failed">Failed (ব্যর্থ)</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'bn' ? 'পরিবর্তন সেভ করুন' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Visual Card Generator Modal */}
      <VisualCardModal
        isOpen={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        initialTitle={title}
        initialBody={body}
        categoryName={post.categoryName || 'The Mosafa'}
        lang={lang}
        onAttachImage={(dataUrl) => {
          setImageUrl(dataUrl);
          setCardModalOpen(false);
        }}
      />
    </>
  );
};
