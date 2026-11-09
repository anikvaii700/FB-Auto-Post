import React, { useState } from 'react';
import { X, Calendar, Image as ImageIcon, Check } from 'lucide-react';
import { PostItem } from '../types.ts';

interface Props {
  post: PostItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: PostItem) => void;
  lang: 'en' | 'bn';
}

export const EditPostModal: React.FC<Props> = ({ post, isOpen, onClose, onSave, lang }) => {
  if (!isOpen || !post) return null;

  const [title, setTitle] = useState(post.title || '');
  const [body, setBody] = useState(post.body || '');
  const [hashtagsStr, setHashtagsStr] = useState(post.hashtags?.join(' ') || '');
  const [scheduledAt, setScheduledAt] = useState(post.scheduledAt?.substring(0, 16) || '');
  const [imageUrl, setImageUrl] = useState(post.imageUrl || '');
  const [status, setStatus] = useState(post.status);

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
      status,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'পোস্ট সম্পাদনা করুন' : 'Edit Post Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Title / Hook (শিরোনাম)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status Content (পোস্টের মূল লেখা) *
            </label>
            <textarea
              rows={5}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white leading-relaxed font-sans"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hashtags (স্পেস দিয়ে আলাদা করুন)
            </label>
            <input
              type="text"
              value={hashtagsStr}
              onChange={(e) => setHashtagsStr(e.target.value)}
              placeholder="#ইস্তিগফার #IslamicReminder #Faith"
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-blue-600 dark:text-blue-400 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Scheduled Publishing Time
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Queue Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white capitalize"
              >
                <option value="scheduled">Scheduled</option>
                <option value="pending">Pending</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
                <option value="published">Published</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Image URL (ছবি লিঙ্ক)
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-[11px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
