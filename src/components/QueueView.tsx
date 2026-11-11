import React, { useState } from 'react';
import {
  Clock,
  Send,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Check,
  ExternalLink,
} from 'lucide-react';
import { PostItem, PostStatus } from '../types.ts';
import { api } from '../services/api.ts';
import { EditPostModal } from './EditPostModal.tsx';

interface Props {
  posts: PostItem[];
  lang: 'en' | 'bn';
  onPublishNow: (id: string) => void;
  onRefresh: () => void;
  onClearQueue: () => void;
}

export const QueueView: React.FC<Props> = ({
  posts,
  lang,
  onPublishNow,
  onRefresh,
  onClearQueue,
}) => {
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'pending' | 'draft' | 'failed' | 'published'>('all');
  const [search, setSearch] = useState('');
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);

  const filteredPosts = posts.filter((post) => {
    if (filter !== 'all' && post.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = post.title?.toLowerCase().includes(q);
      const matchBody = post.body.toLowerCase().includes(q);
      const matchCat = post.categoryName.toLowerCase().includes(q);
      return matchTitle || matchBody || matchCat;
    }
    return true;
  });

  const handleDelete = async (id: string) => {
    if (confirm(lang === 'bn' ? 'পোস্টটি মুছে ফেলতে চান?' : 'Delete this post?')) {
      await api.deletePost(id);
      onRefresh();
    }
  };

  const handleApprove = async (post: PostItem) => {
    await api.savePost({
      ...post,
      status: 'scheduled',
      approvalMode: 'auto',
      scheduledAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    });
    onRefresh();
  };

  const handleSaveEdit = async (updated: PostItem) => {
    await api.savePost(updated);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" />
            <span>{lang === 'bn' ? 'পোস্টিং কিউ ও শিডিউল ম্যানেজার' : 'Publishing Queue & Scheduled Posts'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'শিডিউলকৃত পোস্টের সময় পরিবর্তন, তাৎক্ষণিক প্রকাশ, সম্পাদনা বা অনুমোদন করুন।'
              : 'Inspect upcoming queue, reschedule publishing times, retry failures, or publish instantly.'}
          </p>
        </div>

        <button
          onClick={onClearQueue}
          className="px-3 py-2 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'কিউ খালি করুন' : 'Clear Queue'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
          {(['all', 'scheduled', 'pending', 'draft', 'failed', 'published'] as const).map((st) => {
            const count = st === 'all' ? posts.length : posts.filter((p) => p.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer capitalize flex items-center gap-1.5 ${
                  filter === st
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>
                  {st === 'all'
                    ? lang === 'bn' ? 'সকল' : 'All'
                    : st === 'scheduled'
                    ? lang === 'bn' ? 'শিডিউলকৃত' : 'Scheduled'
                    : st === 'draft'
                    ? lang === 'bn' ? 'ড্রাফট' : 'Drafts'
                    : st === 'failed'
                    ? lang === 'bn' ? 'ব্যর্থ' : 'Failed'
                    : st === 'published'
                    ? lang === 'bn' ? 'প্রকাশিত' : 'Published'
                    : st}
                </span>
                <span className="font-mono text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'bn' ? 'পোস্ট খুঁজুন...' : 'Search posts...'}
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-xs">
              {lang === 'bn' ? 'এই ক্যাটাগরিতে কোনো পোস্ট পাওয়া যায়নি।' : 'No posts found in this queue tab.'}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isDue = new Date(post.scheduledAt) <= new Date() && post.status === 'scheduled';
            return (
              <div
                key={post.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Thumbnail"
                      className="w-20 h-20 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {post.categoryName}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span
                        className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                          post.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : post.status === 'scheduled'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : post.status === 'failed'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {post.status.toUpperCase()}
                      </span>
                      {isDue && (
                        <span className="text-[10px] font-mono text-emerald-500 font-bold animate-pulse">
                          ● DUE NOW
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {post.title || 'Untitled Post'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                      {post.body}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono">
                      <span>
                        Schedule: {new Date(post.scheduledAt).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} (Dhaka)
                      </span>
                      {post.facebookPostId && (
                        <span className="text-blue-500">FB ID: {post.facebookPostId}</span>
                      )}
                    </div>

                    {post.errorMsg && (
                      <p className="text-[11px] text-rose-500 font-medium mt-1">
                        Error: {post.errorMsg}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {post.status === 'draft' && (
                    <button
                      onClick={() => handleApprove(post)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'অনুমোদন করুন' : 'Approve'}</span>
                    </button>
                  )}

                  {post.status !== 'published' && (
                    <button
                      onClick={() => onPublishNow(post.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5 text-blue-200" />
                      <span>{lang === 'bn' ? 'এখনই প্রকাশ করুন' : 'Publish Now'}</span>
                    </button>
                  )}

                  {post.facebookPermalink && (
                    <a
                      href={post.facebookPermalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Open Facebook post"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => setEditingPost(post)}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Edit post"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Delete post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Post Modal */}
      <EditPostModal
        post={editingPost}
        isOpen={Boolean(editingPost)}
        onClose={() => setEditingPost(null)}
        onSave={handleSaveEdit}
        lang={lang}
      />
    </div>
  );
};
