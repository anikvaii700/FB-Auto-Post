import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Send,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  Edit3,
} from 'lucide-react';
import { Category, LibraryImage, PostItem } from '../types.ts';
import { api } from '../services/api.ts';

interface Props {
  categories: Category[];
  images: LibraryImage[];
  lang: 'en' | 'bn';
  onPostCreated: (post: PostItem) => void;
  onPublishNow: (id: string) => void;
}

export const ContentGeneratorView: React.FC<Props> = ({
  categories,
  images,
  lang,
  onPostCreated,
  onPublishNow,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [customTopic, setCustomTopic] = useState('');
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [approvalMode, setApprovalMode] = useState<'auto' | 'manual'>('auto');
  const [includeImage, setIncludeImage] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string>(images[1]?.url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedPost, setGeneratedPost] = useState<PostItem | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  const selectedCategory = categories.find((c) => c.id === selectedCatId);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setEditMode(false);

    try {
      const res = await api.generateAI({
        categoryId: selectedCatId,
        customTopic: customTopic.trim() || undefined,
        count: 1,
        language,
        approvalMode,
      });

      if (res.success && res.posts && res.posts.length > 0) {
        const post = res.posts[0];
        if (includeImage && selectedImage) {
          post.imageUrl = selectedImage;
          post.imageSource = 'ai';
        } else if (!includeImage) {
          post.imageUrl = undefined;
          post.imageSource = 'none';
        }
        setGeneratedPost(post);
        onPostCreated(post);
      } else {
        setError(res.error || 'Failed to generate post');
      }
    } catch (err: any) {
      setError(err.message || 'API error during generation');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!generatedPost) return;
    setRegenerating(true);
    try {
      const res = await api.regeneratePost(generatedPost.id, feedback);
      if (res.success && res.post) {
        setGeneratedPost(res.post);
        setFeedback('');
        onPostCreated(res.post);
      }
    } catch (err: any) {
      alert(`Regeneration failed: ${err.message}`);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>{lang === 'bn' ? 'কন্টেন্ট জেনারেটর স্টুডিও' : 'AI Content Generator Studio'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'ক্যাটাগরি ভিত্তিক স্বয়ংক্রিয় স্ট্যাটাস, কুরআনিক রেফারেন্স এবং প্রাসঙ্গিক হ্যাশট্যাগ প্রস্তুত করুন।'
              : 'Generate category-aligned statuses, verified religious references, and relevant hashtags.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {lang === 'bn' ? 'কন্টেন্ট সেটিংস' : 'Generation Parameters'}
            </h2>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'ক্যাটাগরি নির্বাচন' : 'Select Category'}
              </label>
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === 'bn' ? c.nameBn || c.name : c.name}
                  </option>
                ))}
              </select>

              {selectedCategory && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                  <p>
                    <strong className="text-slate-700 dark:text-slate-300">Style:</strong> {selectedCategory.style}
                  </p>
                  <p>
                    <strong className="text-slate-700 dark:text-slate-300">Tone:</strong> {selectedCategory.tone}
                  </p>
                  <p className="line-clamp-2">
                    <strong className="text-slate-700 dark:text-slate-300">Rule:</strong> {selectedCategory.contentInstructions}
                  </p>
                </div>
              )}
            </div>

            {/* Custom Topic / Instruction */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'bn' ? 'সুনির্দিষ্ট বিষয়বস্তু (ঐচ্ছিক)' : 'Specific Topic / Angle (Optional)'}
              </label>
              <textarea
                rows={2}
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'যেমন: তাহাজ্জুদ সালাতের মর্যাদা, কিংবা পিতা-মাতার খেদমত...'
                    : 'e.g. Importance of Tahajjud prayer, or patience in times of adversity...'
                }
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
              />
            </div>

            {/* Language & Approval Mode */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {lang === 'bn' ? 'ভাষা' : 'Language'}
                </label>
                <div className="flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setLanguage('bn')}
                    className={`flex-1 py-1.5 text-xs font-semibold cursor-pointer ${
                      language === 'bn'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    বাংলা
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`flex-1 py-1.5 text-xs font-semibold cursor-pointer ${
                      language === 'en'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {lang === 'bn' ? 'পাবলিশ মোড' : 'Publish Mode'}
                </label>
                <select
                  value={approvalMode}
                  onChange={(e) => setApprovalMode(e.target.value as any)}
                  className="w-full py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value="auto">{lang === 'bn' ? 'অটো শিডিউল' : 'Auto Schedule'}</option>
                  <option value="manual">{lang === 'bn' ? 'ড্রাফট (অনুমোদন)' : 'Draft (Review)'}</option>
                </select>
              </div>
            </div>

            {/* Media Attachment Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  <span>{lang === 'bn' ? 'ছবি যুক্ত করবেন?' : 'Attach Media Image?'}</span>
                </label>
                <input
                  type="checkbox"
                  checked={includeImage}
                  onChange={(e) => setIncludeImage(e.target.checked)}
                  className="accent-emerald-600 w-4 h-4 rounded cursor-pointer"
                />
              </div>

              {includeImage && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setSelectedImage(img.url)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        selectedImage === img.url
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.title || 'Preset'} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-500 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>{lang === 'bn' ? 'জেমিনি এআই তৈরি করছে...' : 'Gemini AI generating...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{lang === 'bn' ? 'পোস্ট তৈরি করুন' : 'Generate New Status'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output & Review Editor (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs min-h-[460px] flex flex-col justify-between">
            {generatedPost ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {lang === 'bn' ? 'তৈরিকৃত কন্টেন্ট প্রিভিউ' : 'Generated Content Preview'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{editMode ? 'Done' : 'Edit'}</span>
                    </button>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      {generatedPost.status}
                    </span>
                  </div>
                </div>

                {/* Facebook Mock Post Card Preview */}
                <div className="border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 bg-white dark:bg-slate-950/60 shadow-xs">
                  {/* Mock Page Header */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <img
                      src="/src/assets/images/mosafa_brand_symbol_1794224544537.jpg"
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        MoSaFa Official Facebook Page
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(generatedPost.scheduledAt).toLocaleString()} · 🌐 Public
                      </p>
                    </div>
                  </div>

                  {/* Title & Body */}
                  {editMode ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={generatedPost.title || ''}
                        onChange={(e) => setGeneratedPost({ ...generatedPost, title: e.target.value })}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold"
                        placeholder="Title"
                      />
                      <textarea
                        rows={6}
                        value={generatedPost.body}
                        onChange={(e) => setGeneratedPost({ ...generatedPost, body: e.target.value })}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  ) : (
                    <div>
                      {generatedPost.title && (
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                          {generatedPost.title}
                        </h3>
                      )}
                      <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                        {generatedPost.body}
                      </p>
                      {generatedPost.hashtags && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {generatedPost.hashtags.map((h, i) => (
                            <span key={i} className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attached Media */}
                  {generatedPost.imageUrl && (
                    <div className="mt-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video">
                      <img
                        src={generatedPost.imageUrl}
                        alt="Attached media"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Regeneration with Feedback */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'পুনরায় লিখতে চাইলে ফিডব্যাক লিখুন (যেমন: আরও আবেগপূর্ণ করো)'
                        : 'Feedback to refine (e.g. make it punchier, add more hadith context)...'
                    }
                    className="flex-1 py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium text-xs rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                    <span>{lang === 'bn' ? 'পুনরায় লিখুন' : 'Refine'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="my-auto py-12 flex flex-col items-center justify-center text-center text-slate-400">
                <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {lang === 'bn' ? 'কোনো কন্টেন্ট প্রিভিউ নেই' : 'No Content Generated Yet'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {lang === 'bn'
                    ? 'বামদিকের ফর্ম থেকে ক্যাটাগরি ও বিষয়বস্তু পছন্দ করে "পোস্ট তৈরি করুন" বাটনে ক্লিক করুন।'
                    : 'Configure parameters on the left and click "Generate New Status" to preview the live Facebook card.'}
                </p>
              </div>
            )}

            {/* Bottom Actions */}
            {generatedPost && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Scheduled: {new Date(generatedPost.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      api.savePost(generatedPost);
                      alert(lang === 'bn' ? 'কিউ-তে সংরক্ষিত হয়েছে!' : 'Saved to queue successfully!');
                    }}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'কিউ-তে রাখুন' : 'Save to Queue'}</span>
                  </button>

                  <button
                    onClick={() => onPublishNow(generatedPost.id)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'এখনই প্রকাশ করুন' : 'Publish to Facebook Now'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
