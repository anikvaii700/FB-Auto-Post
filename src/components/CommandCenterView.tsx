import React, { useState } from 'react';
import {
  Terminal,
  Sparkles,
  Send,
  History,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  Globe,
  Sliders,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { Category, CommandHistoryItem, PostItem } from '../types.ts';
import { api } from '../services/api.ts';

interface Props {
  categories: Category[];
  commands: CommandHistoryItem[];
  lang: 'en' | 'bn';
  onPostsGenerated: (posts: PostItem[]) => void;
  onRefreshCommands: () => void;
}

const PRESET_COMMANDS = [
  {
    textBn: 'ইস্তিগফারের অলৌকিক গুরুত্ব ও বরকত নিয়ে ৫টি হৃদয়স্পর্শী ইসলামিক রিমাইন্ডার তৈরি করো',
    textEn: 'Create 5 emotional Islamic reminders about the importance of Istighfar with authentic references',
    catId: 'cat_islamic_reminder',
    count: 5,
    lang: 'bn' as const,
  },
  {
    textBn: 'বাঙালি তরুণ ও উদ্যোক্তাদের জন্য ১০টি বাস্তবমুখী মোটিভেশনাল স্ট্যাটাস তৈরি করো',
    textEn: 'Generate 10 motivational Bengali statuses for youth and entrepreneurs',
    catId: 'cat_motivational',
    count: 10,
    lang: 'bn' as const,
  },
  {
    textBn: 'বাংলাদেশের দৈনন্দিন জীবনের মজার মজার পরিস্থিতি নিয়ে ৩টি রম্য ও নির্মল বিনোদনমূলক পোস্ট লেখো',
    textEn: 'Create 3 funny and clean posts about everyday life situations in Bangladesh',
    catId: 'cat_funny_entertainment',
    count: 3,
    lang: 'bn' as const,
  },
  {
    textBn: 'সন্তান লালন-পালন ও শিশুর মনস্তত্ত্ব নিয়ে ৭টি শিক্ষণীয় ও সচেতনতামূলক পোস্ট তৈরি করো',
    textEn: "Generate 7 educational posts about children's learning and positive parenting",
    catId: 'cat_relationship_family',
    count: 7,
    lang: 'bn' as const,
  },
  {
    textBn: 'অনলাইন শপ ও ব্যবসার সেলস বৃদ্ধির জন্য ৫টি আকর্ষণীয় বিজনেস প্রমোশন পোস্ট তৈরি করো',
    textEn: 'Create 5 business promotion posts for an online shop with strong call-to-action',
    catId: 'cat_business_marketing',
    count: 5,
    lang: 'bn' as const,
  },
];

export const CommandCenterView: React.FC<Props> = ({
  categories,
  commands,
  lang,
  onPostsGenerated,
  onRefreshCommands,
}) => {
  const [instruction, setInstruction] = useState('');
  const [count, setCount] = useState<number>(3);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<'bn' | 'en'>('bn');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lastGenerated, setLastGenerated] = useState<PostItem[]>([]);

  const handleExecute = async (customInst?: string, customCount?: number, customCat?: string, customLang?: 'bn' | 'en') => {
    const promptText = customInst || instruction;
    const finalCount = customCount || count;
    const finalCat = customCat !== undefined ? customCat : selectedCategory;
    const finalLang = customLang || targetLanguage;

    if (!promptText.trim()) {
      setError(lang === 'bn' ? 'অনুগ্রহ করে নির্দেশনাবলী লিখুন।' : 'Please enter an instruction or select a prompt.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.generateCommand({
        instruction: promptText,
        count: finalCount,
        categoryId: finalCat || undefined,
        language: finalLang,
      });

      if (res.success && res.posts) {
        setLastGenerated(res.posts);
        onPostsGenerated(res.posts);
        setSuccessMsg(
          lang === 'bn'
            ? `সফলভাবে ${res.posts.length}টি পোস্ট তৈরি হয়েছে এবং কিউ-তে যুক্ত হয়েছে!`
            : `Successfully generated ${res.posts.length} post(s) and queued them!`
        );
        onRefreshCommands();
      } else {
        setError(res.error || 'Failed to generate content');
      }
    } catch (err: any) {
      setError(err.message || 'API error generating posts');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: typeof PRESET_COMMANDS[0]) => {
    const text = lang === 'bn' ? preset.textBn : preset.textEn;
    setInstruction(text);
    setCount(preset.count);
    setSelectedCategory(preset.catId);
    setTargetLanguage(preset.lang);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 border border-slate-700/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {lang === 'bn' ? 'এআই কমান্ড সেন্টার (AI Command Center)' : 'AI Command Center'}
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              {lang === 'bn'
                ? 'স্বাভাবিক ভাষায় যেকোনো নির্দেশনা দিন। জেমিনি এআই আপনার চাহিদা অনুযায়ী স্বয়ংক্রিয়ভাবে ফেসবুক পোস্ট তৈরি করবে।'
                : 'Type any natural language prompt. Gemini AI understands, formats, and auto-queues unique Facebook posts.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Command Input Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {lang === 'bn' ? 'আপনার নির্দেশনা বা টপিক লিখুন:' : 'Enter your command or topic instruction:'}
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'যেমন: "ইস্তিগফারের গুরুত্ব নিয়ে ৫টি ইমোশনাল রিমাইন্ডার তৈরি করো" অথবা "১০টি মোটিভেশনাল স্ট্যাটাস"...'
                  : 'e.g. "Create 5 emotional Islamic reminders about Istighfar with authentic hadith references"...'
              }
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
            />
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Post Count */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'পোস্ট সংখ্যা (১ - ১০)' : 'Number of Posts (1 - 10)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600"
              />
              <span className="w-8 text-center font-mono font-bold text-sm text-slate-900 dark:text-white">
                {count}
              </span>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'ক্যাটাগরি নির্ধারণ (ঐচ্ছিক)' : 'Target Category (Optional)'}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{lang === 'bn' ? 'সকল ক্যাটাগরি / স্বয়ংক্রিয়' : 'Any Category / Automatic'}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {lang === 'bn' ? cat.nameBn || cat.name : cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Language */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'আউটপুট ভাষা' : 'Output Language'}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTargetLanguage('bn')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  targetLanguage === 'bn'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                }`}
              >
                বাংলা (Bengali)
              </button>
              <button
                type="button"
                onClick={() => setTargetLanguage('en')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  targetLanguage === 'en'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        {/* Execute Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {error ? (
            <div className="flex items-center gap-2 text-xs text-rose-500 font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : successMsg ? (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              {lang === 'bn'
                ? 'জেমিনি ৩.৮ ফ্ল্যাশ দ্বারা নির্ভুল ও যাচাইকৃত ইসলামিক ও প্রমিত বাংলা কন্টেন্ট তৈরি হবে।'
                : 'Powered by Gemini 3.8 Flash with verified references & authentic Bengali copywriting.'}
            </span>
          )}

          <button
            onClick={() => handleExecute()}
            disabled={loading || !instruction.trim()}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>{lang === 'bn' ? 'তৈরি হচ্ছে...' : 'Generating Posts...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{lang === 'bn' ? `${count}টি পোস্ট জেনারেট করুন` : `Generate ${count} Post(s)`}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Command Ideas Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{lang === 'bn' ? 'রেডিমেড কমান্ড প্রিসেট (এক ক্লিকে ব্যবহার করুন)' : 'Instant Command Presets'}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {PRESET_COMMANDS.map((preset, idx) => {
            const text = lang === 'bn' ? preset.textBn : preset.textEn;
            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500/50 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate">
                    "{text}"
                  </p>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {preset.count} posts · {preset.lang === 'bn' ? 'বাংলা' : 'English'}
                  </span>
                </div>
                <button
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-colors shrink-0 cursor-pointer"
                >
                  {lang === 'bn' ? 'বসিয়ে দিন' : 'Use'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recently Generated Live Previews */}
      {lastGenerated.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'সদ্য প্রস্তুতকৃত পোস্টসমূহ (কিউ-তে সংরক্ষিত)' : 'Recently Generated Output Batch'}
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              {lastGenerated.length} posts queued
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lastGenerated.map((post, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{post.categoryName}</span>
                    <span className="font-mono text-[11px]">
                      {new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{post.title}</h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line line-clamp-4 leading-relaxed">
                    {post.body}
                  </p>

                  {post.hashtags && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {post.hashtags.map((h, i) => (
                        <span key={i} className="text-[11px] text-blue-600 dark:text-blue-400">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                    Status: {post.status}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${post.title}\n\n${post.body}\n\n${post.hashtags.join(' ')}`);
                      alert('Copied to clipboard!');
                    }}
                    className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous Command History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'পূর্ববর্তী কমান্ডের ইতিহাস' : 'Saved Command History'}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{commands.length} saved</span>
        </div>

        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {commands.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400">No previous commands executed yet.</p>
          ) : (
            commands.map((cmd) => (
              <div key={cmd.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {cmd.instruction}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {cmd.count} posts · {cmd.language === 'bn' ? 'বাংলা' : 'English'} ·{' '}
                    {new Date(cmd.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => handleExecute(cmd.instruction, cmd.count, cmd.categoryId, cmd.language)}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'পুনরায় চালান' : 'Re-run'}</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
