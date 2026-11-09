import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  Sparkles,
  Share2,
} from 'lucide-react';
import { Category, PreferredLength, ImagePref } from '../types.ts';
import { api } from '../services/api.ts';

interface Props {
  categories: Category[];
  lang: 'en' | 'bn';
  onRefresh: () => void;
}

export const CategoriesView: React.FC<Props> = ({ categories, lang, onRefresh }) => {
  const [editingCat, setEditingCat] = useState<Partial<Category> | null>(null);
  const [saving, setSaving] = useState(false);

  const handleOpenAdd = () => {
    setEditingCat({
      id: `cat_custom_${Date.now()}`,
      name: '',
      nameBn: '',
      description: '',
      style: 'Engaging & Authentic',
      tone: 'Inspiring, Natural, Respectful',
      audience: 'General social audience',
      language: 'bn',
      preferredLength: 'medium',
      hashtagRules: ['#CustomTopic', '#Bangladesh'],
      contentInstructions: '',
      imagePreferences: 'optional',
      dailyPosts: 1,
      scheduleTimes: ['10:00', '18:00'],
      isActive: true,
      color: '#059669',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editingCat.name) return;
    setSaving(true);
    try {
      await api.saveCategory(editingCat);
      setEditingCat(null);
      onRefresh();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(lang === 'bn' ? 'আপনি কি নিশ্চিত যে এই ক্যাটাগরিটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this category?')) {
      await api.deleteCategory(id);
      onRefresh();
    }
  };

  const handleToggleActive = async (cat: Category) => {
    await api.saveCategory({ ...cat, isActive: !cat.isActive });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <span>{lang === 'bn' ? 'কন্টেন্ট ক্যাটাগরি ম্যানেজমেন্ট' : 'Content Categories Management'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'প্রতিটি ক্যাটাগরির নিজস্ব লেখার স্টাইল, টোন, অডিয়েন্স, দৈনিক পোস্টের সংখ্যা এবং প্রকাশের সময়সূচি নির্ধারণ করুন।'
              : 'Customize writing style, audience, tone, daily post quotas, and posting schedules per category.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'bn' ? '+ নতুন ক্যাটাগরি তৈরি করুন' : '+ Add Custom Category'}</span>
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
              cat.isActive
                ? 'border-slate-200 dark:border-slate-800'
                : 'border-slate-200 dark:border-slate-800/40 opacity-60 bg-slate-50/50 dark:bg-slate-950/40'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900"
                    style={{ backgroundColor: cat.color || '#059669' }}
                  />
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    {cat.language === 'both' ? 'BN & EN' : cat.language.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleActive(cat)}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold transition-colors cursor-pointer ${
                      cat.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {cat.isActive ? (lang === 'bn' ? 'সক্রিয়' : 'ACTIVE') : (lang === 'bn' ? 'নিষ্ক্রিয়' : 'INACTIVE')}
                  </button>
                  <button
                    onClick={() => setEditingCat(cat)}
                    className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md cursor-pointer"
                    title="Edit category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {cat.id.startsWith('cat_custom_') && (
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                {lang === 'bn' ? cat.nameBn || cat.name : cat.name}
              </h2>
              {cat.nameBn && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">{cat.name}</p>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-3">
                {cat.description}
              </p>

              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Style & Tone:</span>
                  <span className="truncate max-w-[160px]">{cat.style}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Daily Target:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {cat.dailyPosts} posts/day
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Schedule:</span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {cat.scheduleTimes.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {cat.hashtagRules && cat.hashtagRules.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                {cat.hashtagRules.slice(0, 3).map((h, i) => (
                  <span key={i} className="text-[11px] text-blue-600 dark:text-blue-400">
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit / Add Modal */}
      {editingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingCat.id?.startsWith('cat_custom_')
                  ? lang === 'bn' ? 'নতুন কাস্টম ক্যাটাগরি তৈরি করুন' : 'Add Custom Category'
                  : lang === 'bn' ? 'ক্যাটাগরি সম্পাদনা করুন' : 'Edit Category'}
              </h2>
              <button
                onClick={() => setEditingCat(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    English Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCat.name || ''}
                    onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    বাংলা নাম (Bengali Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCat.nameBn || ''}
                    onChange={(e) => setEditingCat({ ...editingCat, nameBn: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  বিবরণ (Description)
                </label>
                <textarea
                  rows={2}
                  value={editingCat.description || ''}
                  onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Writing Style
                  </label>
                  <input
                    type="text"
                    value={editingCat.style || ''}
                    onChange={(e) => setEditingCat({ ...editingCat, style: e.target.value })}
                    placeholder="e.g. Spiritual, Emotional & Reverent"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Writing Tone
                  </label>
                  <input
                    type="text"
                    value={editingCat.tone || ''}
                    onChange={(e) => setEditingCat({ ...editingCat, tone: e.target.value })}
                    placeholder="e.g. Heart-touching, Gentle, Inspiring"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  AI কন্টেন্ট নির্দেশনা ও নিয়ম (Rules & Guidelines)
                </label>
                <textarea
                  rows={2}
                  value={editingCat.contentInstructions || ''}
                  onChange={(e) => setEditingCat({ ...editingCat, contentInstructions: e.target.value })}
                  placeholder="যেমন: সহীহ হাদিস ও কুরআনের রেফারেন্স উল্লেখ নিশ্চিত করুন।"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    দৈনিক পোস্ট সংখ্যা
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={editingCat.dailyPosts || 1}
                    onChange={(e) => setEditingCat({ ...editingCat, dailyPosts: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    পাবলিশিং সময়সূচি
                  </label>
                  <input
                    type="text"
                    value={editingCat.scheduleTimes?.join(', ') || '10:00, 18:00'}
                    onChange={(e) =>
                      setEditingCat({
                        ...editingCat,
                        scheduleTimes: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                    placeholder="09:00, 14:00, 20:00"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ভাষা (Language)
                  </label>
                  <select
                    value={editingCat.language || 'bn'}
                    onChange={(e) => setEditingCat({ ...editingCat, language: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="en">English</option>
                    <option value="both">Both (উভয়)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer shadow-xs"
                >
                  {saving ? (lang === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
