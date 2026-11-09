import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { PostItem } from '../types.ts';
import { EditPostModal } from './EditPostModal.tsx';
import { api } from '../services/api.ts';

interface Props {
  posts: PostItem[];
  lang: 'en' | 'bn';
  onRefresh: () => void;
}

export const CalendarView: React.FC<Props> = ({ posts, lang, onRefresh }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const daysOfWeek = lang === 'bn'
    ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map posts by date "YYYY-MM-DD"
  const postsByDate: Record<string, PostItem[]> = {};
  posts.forEach((p) => {
    const d = new Date(p.scheduledAt);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!postsByDate[dateKey]) {
      postsByDate[dateKey] = [];
    }
    postsByDate[dateKey].push(p);
  });

  const handleSavePost = async (updated: PostItem) => {
    await api.savePost(updated);
    onRefresh();
  };

  const daysCells = [];
  // Blank days before first day
  for (let i = 0; i < firstDayIndex; i++) {
    daysCells.push(<div key={`blank-${i}`} className="min-h-24 p-2 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 rounded-xl" />);
  }

  // Days in month
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayPosts = postsByDate[dateKey] || [];
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

    daysCells.push(
      <div
        key={`day-${day}`}
        className={`min-h-28 p-2 rounded-xl border flex flex-col justify-between transition-colors ${
          isToday
            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/40'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
              isToday
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {day}
          </span>
          {dayPosts.length > 0 && (
            <span className="text-[10px] font-mono font-semibold text-slate-400">
              {dayPosts.length} posts
            </span>
          )}
        </div>

        <div className="space-y-1 overflow-y-auto max-h-20">
          {dayPosts.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedPost(p)}
              className={`p-1 rounded-md text-[11px] truncate cursor-pointer transition-colors ${
                p.status === 'published'
                  ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : p.status === 'scheduled'
                  ? 'bg-blue-100/70 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : p.status === 'failed'
                  ? 'bg-rose-100/70 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-amber-100/70 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
              title={`${p.title || p.body} (${new Date(p.scheduledAt).toLocaleTimeString()})`}
            >
              <span className="font-semibold">{new Date(p.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>{' '}
              {p.title || p.body.substring(0, 15)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-500" />
            <span>{lang === 'bn' ? 'কন্টেন্ট পাবলিশিং ক্যালেন্ডার' : 'Visual Content Calendar'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'মাসিক ক্যালেন্ডারে প্রকাশিত ও শিডিউলকৃত পোস্ট দেখুন এবং তারিখ পরিবর্তন করুন।'
              : 'Monthly calendar view of scheduled, published, and draft Facebook posts.'}
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 text-sm font-bold text-slate-900 dark:text-white min-w-[140px] text-center">
              {lang === 'bn' ? monthNamesBn[month] : monthNamesEn[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {daysOfWeek.map((dayName, idx) => (
            <div
              key={idx}
              className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-1"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">{daysCells}</div>
      </div>

      {/* Edit Modal */}
      <EditPostModal
        post={selectedPost}
        isOpen={Boolean(selectedPost)}
        onClose={() => setSelectedPost(null)}
        onSave={handleSavePost}
        lang={lang}
      />
    </div>
  );
};
