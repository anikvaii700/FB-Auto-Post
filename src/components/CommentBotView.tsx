import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Bot,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
  Heart,
  ShieldCheck,
  User,
  ExternalLink,
  MessageCircleQuestion,
  Sparkle,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { AdminSettings, FacebookCommentItem } from '../types.ts';

interface Props {
  settings: AdminSettings;
  lang: 'en' | 'bn';
  onRefresh: () => void;
}

export const CommentBotView: React.FC<Props> = ({ settings, lang, onRefresh }) => {
  const [comments, setComments] = useState<FacebookCommentItem[]>([]);
  const [isBotActive, setIsBotActive] = useState<boolean>(settings.isAutoCommentReplyActive ?? true);
  const [botTone, setBotTone] = useState<string>(settings.autoCommentReplyTone || 'islamic_warm');
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live Simulator State
  const [simCommentText, setSimCommentText] = useState<string>('আসসালামু আলাইকুম ভাই, অনেক সুন্দর লিখেছেন! মাশাআল্লাহ');
  const [simCommenterName, setSimCommenterName] = useState<string>('রাকিবুল হাসান');
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<{
    replyText: string;
    category: string;
    confidence: number;
  } | null>(null);

  // Manual reply state
  const [replyInputs, setReplyInputs] = useState<{ [commentId: string]: string }>({});
  const [replyingMap, setReplyingMap] = useState<{ [commentId: string]: boolean }>({});

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await api.getComments();
      if (res.success) {
        setComments(res.comments || []);
        setIsBotActive(res.isBotActive);
        if (res.botTone) setBotTone(res.botTone);
      }
    } catch (err) {
      console.warn('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleToggleBot = async (active: boolean) => {
    setIsBotActive(active);
    try {
      await api.toggleCommentBot(active, botTone);
      setToastMessage({
        type: 'success',
        text: active
          ? (lang === 'bn' ? '✓ কমেন্ট অটো-রিপ্লাই বট চালু করা হয়েছে!' : '✓ Comment Auto-Reply Bot is now ACTIVE!')
          : (lang === 'bn' ? 'কমেন্ট অটো-রিপ্লাই সাময়িক বন্ধ করা হয়েছে।' : 'Comment Auto-Reply Bot paused.'),
      });
      onRefresh();
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message });
    }
  };

  const handleToneChange = async (tone: string) => {
    setBotTone(tone);
    try {
      await api.toggleCommentBot(isBotActive, tone);
      setToastMessage({
        type: 'success',
        text: lang === 'bn' ? '✓ রিপ্লের ভাষা ও টোন আপডেট হয়েছে!' : '✓ Reply tone updated!',
      });
      onRefresh();
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message });
    }
  };

  const handleTestSimulate = async (customText?: string) => {
    const textToTest = customText || simCommentText;
    if (!textToTest.trim()) return;

    setSimulating(true);
    setSimResult(null);

    try {
      const res = await api.testCommentReply({
        commentText: textToTest,
        commenterName: simCommenterName,
        tone: botTone,
        postTitle: 'ইস্তিগফারের অলৌকিক শক্তি ও বরকত',
      });

      if (res.success) {
        setSimResult({
          replyText: res.replyText,
          category: res.category,
          confidence: res.confidence,
        });
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: `টেস্ট ব্যর্থ: ${err.message}` });
    } finally {
      setSimulating(false);
    }
  };

  const handleSendManualReply = async (commentId: string) => {
    const replyText = replyInputs[commentId]?.trim();
    if (!replyText) return;

    setReplyingMap((prev) => ({ ...prev, [commentId]: true }));
    try {
      const res = await api.replyComment(commentId, replyText);
      if (res.success) {
        setToastMessage({
          type: 'success',
          text: lang === 'bn' ? '✓ কমেন্টের উত্তর সফলভাবে পাঠানো হয়েছে!' : '✓ Reply sent successfully!',
        });
        setReplyInputs((prev) => ({ ...prev, [commentId]: '' }));
        fetchComments();
      } else {
        setToastMessage({ type: 'error', text: res.error || 'Failed to send reply' });
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message });
    } finally {
      setReplyingMap((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleAIGenerateForSingleComment = async (comment: FacebookCommentItem) => {
    try {
      const res = await api.testCommentReply({
        commentText: comment.message,
        commenterName: comment.fromName,
        tone: botTone,
        postTitle: comment.postTitle,
      });

      if (res.success) {
        setReplyInputs((prev) => ({ ...prev, [comment.id]: res.replyText }));
      }
    } catch (err: any) {
      alert(`AI Error: ${err.message}`);
    }
  };

  // Sample quick test comments
  const SAMPLE_COMMENTS = [
    { text: 'আসসালামু আলাইকুম ভাই, কেমন আছেন?', label: 'সালাম' },
    { text: 'মাশাআল্লাহ! হৃদয় ছুঁয়ে গেল পোস্টটি।', label: 'প্রশংসা' },
    { text: 'আমিন ইয়া রব্বাল আলামিন। দোয়া চাই।', label: 'দোয়া/আমিন' },
    { text: 'ভাই এটা কীভাবে সংগ্রহ করব? বিস্তারিত বলুন।', label: 'প্রশ্ন/তথ্য' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-6 text-white shadow-lg">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-3">
            <Bot className="w-3.5 h-3.5 text-cyan-300" />
            <span>{lang === 'bn' ? 'স্মার্ট ফেসবুক কমেন্ট অটো-রিপ্লাই ইঞ্জিন' : 'Smart Facebook Comment Auto-Reply'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {lang === 'bn'
              ? 'কমেন্টের ধরন বুঝে তাৎক্ষণিক সঠিক ও মিষ্টি রিপ্লে দিবে AI'
              : 'AI Automatically Analyzes Facebook Comments & Replies Instantly'}
          </h1>
          <p className="mt-2 text-sm text-blue-100 leading-relaxed">
            {lang === 'bn'
              ? 'কেউ সালাম দিলে ওয়ালাইকুমুস সালাম, মাশাআল্লাহ বললে জাযাকাল্লাহু খাইরান, দোয়া বা আমিন বললে সুন্দর দোয়া এবং কোনো প্রশ্ন করলে আন্তরিকভাবে তথ্য প্রদান করে সাথে সাথে কমেন্টের উত্তর দিয়ে পেজের এনগেজমেন্ট বহুগুণ বৃদ্ধি করবে।'
              : 'Detects salams, praises, duas, and inquiries to reply with warm, authentic Bengali responses matching the context.'}
          </p>
        </div>
      </div>

      {/* Main Bot Control & Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Bot Settings & Persona */}
        <div className="lg:col-span-5 space-y-5">
          {/* Master Switch Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-500" />
                  {lang === 'bn' ? 'অটো-রিপ্লাই রোবট স্ট্যাটাস' : 'Auto-Reply Bot Status'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isBotActive
                    ? (lang === 'bn' ? 'বট চালু আছে (নতুন কমেন্ট এলে উত্তর দিবে)' : 'Active: Bot responds to new comments')
                    : (lang === 'bn' ? 'বট সাময়িকভাবে বন্ধ আছে' : 'Paused: Bot is inactive')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleBot(!isBotActive)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs ${
                  isBotActive
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {isBotActive ? (lang === 'bn' ? 'সক্রিয় (Active)' : 'Active') : (lang === 'bn' ? 'বন্ধ (Inactive)' : 'Inactive')}
              </button>
            </div>

            {/* Tone Selector */}
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'bn' ? 'রিপ্লের ধরন ও ব্যক্তিত্ব (Tone & Persona):' : 'Reply Tone & Persona:'}
              </label>

              <div className="space-y-2 text-xs">
                {[
                  {
                    id: 'islamic_warm',
                    label: 'ইসলামিক ও বিনম্র (সুপারিশকৃত)',
                    desc: 'সালামের পূর্ণ জবাব, দোয়া, আমিন ও জাযাকাল্লাহু খাইরান সহ মার্জিত ইসলামিক ভাষা।',
                  },
                  {
                    id: 'friendly',
                    label: 'আন্তরিক ও বন্ধুত্বপূর্ণ',
                    desc: 'ধন্যবাদ প্রিয় ভাই/বোন, ভালোবাসা নিরন্তর ইত্যাদি মিষ্টি ও প্রাণবন্ত ভাষা।',
                  },
                  {
                    id: 'professional',
                    label: 'পেশাদার ও তথ্যবহুল',
                    desc: 'সংক্ষিপ্ত, তথ্যবহুল এবং কাস্টমার সেবা কেন্দ্রিক মার্জিত উত্তর।',
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    onClick={() => handleToneChange(item.id)}
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      botTone === item.id
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{item.label}</span>
                      {botTone === item.id && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Meta API Permission Info Notice */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'bn' ? 'মেটা এপিআই পারমিশন গাইড' : 'Meta Graph API Permission Note'}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {lang === 'bn'
                ? 'ফেসবুক পেজে পোস্ট করার জন্য যেমন "pages_manage_posts" দরকার হয়, তেমনি কমেন্টে লাইভ রিপ্লে দিতে ডেভেলপার পোর্টালে "pages_manage_engagement" পারমিশন সিলেক্ট করে টোকেন নিতে হয়। নিচে আপনি যেকোনো কমেন্ট লিখে AI-এর তাৎক্ষণিক রিপ্লে সরাসরি পরীক্ষা করতে পারেন।'
                : 'Posting requires pages_manage_posts; replying to live comments additionally utilizes pages_manage_engagement. You can test live replies directly below.'}
            </p>
          </div>
        </div>

        {/* Right: Live Interactive Comment Lab & Recent Feed */}
        <div className="lg:col-span-7 space-y-5">
          {/* Live Simulator Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {lang === 'bn' ? 'কমেন্ট রিপ্লে টেস্ট ল্যাব (Live AI Simulator)' : 'Live AI Comment Simulator'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'bn'
                  ? 'নিচের স্যাম্পল কমেন্টে ক্লিক করুন অথবা নিজের ইচ্ছামত কমেন্ট লিখে দেখুন AI কেমন চমৎকার উত্তর তৈরি করে:'
                  : 'Click a sample comment or type your own to see how AI responds in real time:'}
              </p>
            </div>

            {/* Quick Sample Comment Chips */}
            <div className="flex flex-wrap gap-2">
              {SAMPLE_COMMENTS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSimCommentText(s.text);
                    handleTestSimulate(s.text);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 text-[11px] font-medium border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                >
                  <span className="font-semibold mr-1">{s.label}:</span>
                  "{s.text}"
                </button>
              ))}
            </div>

            {/* Input Simulation Box */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={simCommenterName}
                  onChange={(e) => setSimCommenterName(e.target.value)}
                  placeholder="মন্তব্যকারীর নাম"
                  className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={simCommentText}
                  onChange={(e) => setSimCommentText(e.target.value)}
                  placeholder="ব্যবহারকারীর কমেন্ট লিখুন..."
                  className="sm:col-span-2 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={() => handleTestSimulate()}
                disabled={simulating}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {simulating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                {lang === 'bn' ? 'AI দিয়ে তাৎক্ষণিক উত্তর পরীক্ষা করুন' : 'Test AI Smart Reply'}
              </button>
            </div>

            {/* Simulation Result Bubble */}
            {simResult && (
              <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    {lang === 'bn' ? 'AI তৈরি করা স্বয়ংক্রিয় রিপ্লে:' : 'AI Generated Response:'}
                  </span>
                  <span className="text-[10px] font-semibold bg-indigo-200 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full uppercase">
                    ধরণ: {simResult.category}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-indigo-900/40 text-xs font-medium text-slate-900 dark:text-white leading-relaxed">
                  "{simResult.replyText}"
                </div>
              </div>
            )}
          </div>

          {/* Facebook Comments List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                {lang === 'bn' ? `সাম্প্রতিক কমেন্ট ফিড (${comments.length}টি)` : `Recent Comments (${comments.length})`}
              </h2>

              <button
                type="button"
                onClick={fetchComments}
                disabled={loadingComments}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingComments ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Toast Alert */}
            {toastMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  toastMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 border-rose-500/30 text-rose-900 dark:text-rose-200'
                }`}
              >
                <span>{toastMessage.text}</span>
                <button type="button" onClick={() => setToastMessage(null)} className="text-[10px] underline">
                  ✕
                </button>
              </div>
            )}

            {/* Empty Comments Placeholder */}
            {comments.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <MessageSquare className="w-6 h-6 text-slate-400 mx-auto" />
                <p>{lang === 'bn' ? 'ফেসবুক পেজের পোস্টে এখনো কোনো নতুন কমেন্ট পাওয়া যায়নি।' : 'No new comments detected yet.'}</p>
                <p className="text-[11px] text-slate-400">
                  {lang === 'bn'
                    ? 'পেজে পোস্ট পাবলিশ হওয়ার পর ব্যবহারকারীরা কমেন্ট করলে তা এখানে চলে আসবে এবং বট স্বয়ংক্রিয়ভাবে রিপ্লে দিবে।'
                    : 'When users comment on your published page posts, they will appear here.'}
                </p>
              </div>
            )}

            {/* Comments Feed List */}
            <div className="space-y-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-[10px]">
                        {c.fromName.charAt(0) || 'U'}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{c.fromName}</span>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        c.replied
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {c.replied ? '✓ উত্তর দেওয়া হয়েছে' : 'পেন্ডিং উত্তর'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 pl-8">
                    "{c.message}"
                  </p>

                  {/* If Replied */}
                  {c.replied && c.replyText && (
                    <div className="ml-8 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                      <Bot className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-[10px] text-emerald-700 dark:text-emerald-400">
                          The Mosafa AI রিপ্লে:
                        </span>
                        <span>{c.replyText}</span>
                      </div>
                    </div>
                  )}

                  {/* Manual / AI Reply Action if Not Replied */}
                  {!c.replied && (
                    <div className="pl-8 pt-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={replyInputs[c.id] || ''}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        placeholder="রিপ্লে লিখুন বা AI বাটনে চাপুন..."
                        className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />

                      <button
                        type="button"
                        onClick={() => handleAIGenerateForSingleComment(c)}
                        title="AI দিয়ে উত্তর লিখুন"
                        className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 hover:bg-indigo-100 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendManualReply(c.id)}
                        disabled={replyingMap[c.id] || !replyInputs[c.id]}
                        className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>পাঠান</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
