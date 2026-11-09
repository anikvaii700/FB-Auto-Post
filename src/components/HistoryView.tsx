import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  ExternalLink,
  Copy,
  RotateCcw,
  Search,
  Share2,
} from 'lucide-react';
import { PostItem } from '../types.ts';
import { api } from '../services/api.ts';

interface Props {
  posts: PostItem[];
  lang: 'en' | 'bn';
  onRefresh: () => void;
}

export const HistoryView: React.FC<Props> = ({ posts, lang, onRefresh }) => {
  const [search, setSearch] = useState('');

  const published = posts
    .filter((p) => p.status === 'published')
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return p.title?.toLowerCase().includes(q) || p.body.toLowerCase().includes(q);
    });

  const handleDuplicate = async (post: PostItem) => {
    const copyPost: PostItem = {
      ...post,
      id: `post_repost_${Date.now()}`,
      status: 'scheduled',
      approvalMode: 'auto',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
      publishedAt: undefined,
      facebookPostId: undefined,
      facebookPermalink: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await api.savePost(copyPost);
    onRefresh();
    alert(lang === 'bn' ? 'পোস্টটি সফলভাবে আগামীকালকের জন্য পুনরায় শিডিউল করা হয়েছে!' : 'Post re-queued for tomorrow!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-500" />
            <span>{lang === 'bn' ? 'প্রকাশিত পোস্টের আর্কাইভ ও হিস্ট্রি' : 'Published Facebook Posts Archive'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'ফেসবুকে সফলভাবে প্রকাশিত পোস্টের পারমালিঙ্ক, ফেসবুক আইডি এবং পুনরায় ব্যবহারের সুযোগ।'
              : 'Archive of published Facebook posts with live permalinks, post IDs, and re-posting affordances.'}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'bn' ? 'আর্কাইভে খুঁজুন...' : 'Search archive...'}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Grid of Published Posts */}
      <div className="space-y-4">
        {published.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-500" />
            <p className="text-xs">
              {lang === 'bn' ? 'এখনও কোনো পোস্ট প্রকাশিত হয়নি।' : 'No published posts in history yet.'}
            </p>
          </div>
        ) : (
          published.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start justify-between gap-5"
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="Post media"
                    className="w-28 h-24 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{post.categoryName}</span>
                    <span>·</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      Published: {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : 'Recently'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{post.title}</h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line line-clamp-3 leading-relaxed">
                    {post.body}
                  </p>

                  {post.hashtags && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {post.hashtags.map((h, i) => (
                        <span key={i} className="text-[11px] text-blue-600 dark:text-blue-400">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <span>FB ID: {post.facebookPostId || 'sim_post'}</span>
                    {post.facebookPermalink && (
                      <a
                        href={post.facebookPermalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline flex items-center gap-0.5"
                      >
                        <span>View on Facebook</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${post.title ? post.title + '\n\n' : ''}${post.body}\n\n${post.hashtags.join(' ')}`);
                    alert('Copied full post text!');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>

                <button
                  onClick={() => handleDuplicate(post)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'পুনরায় শিডিউল' : 'Re-Schedule'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
