import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Lock,
  Database,
  Cpu,
  Save,
  CheckCircle2,
  Copy,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { AdminSettings } from '../types.ts';
import { api } from '../services/api.ts';

interface Props {
  settings: AdminSettings;
  lang: 'en' | 'bn';
  onRefresh: () => void;
}

export const SettingsView: React.FC<Props> = ({ settings, lang, onRefresh }) => {
  const [pin, setPin] = useState(settings.adminPin || '1234');
  const [publishingMode, setPublishingMode] = useState<'auto' | 'approval_required'>(settings.publishingMode || 'approval_required');
  const [timezone, setTimezone] = useState(settings.defaultTimezone || 'Asia/Dhaka');
  const [dailyPostingCount, setDailyPostingCount] = useState(settings.dailyPostingCount || 3);
  const [preferredLang, setPreferredLang] = useState<'bn' | 'en' | 'bilingual'>(settings.preferredLanguage || 'bn');
  const [autoAdvanceHours, setAutoAdvanceHours] = useState(settings.autoAdvanceHours || 8);
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');
  const [saving, setSaving] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlSchema, setSqlSchema] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings({
        adminPin: pin.trim(),
        publishingMode,
        defaultTimezone: timezone,
        dailyPostingCount: Number(dailyPostingCount),
        preferredLanguage: preferredLang,
        autoAdvanceHours: Number(autoAdvanceHours),
        supabaseUrl: supabaseUrl.trim(),
        supabaseAnonKey: supabaseAnonKey.trim(),
        isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
      });
      alert(lang === 'bn' ? 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' : 'Settings updated successfully!');
      onRefresh();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleViewSql = async () => {
    try {
      const res = await api.getSupabaseSchema();
      if (res.sql) {
        setSqlSchema(res.sql);
        setShowSqlModal(true);
      }
    } catch (err: any) {
      alert(`Failed to load SQL: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-emerald-500" />
            <span>{lang === 'bn' ? 'প্ল্যাটফর্ম সেটিংস ও ডাটাবেস' : 'Platform & Database Settings'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'অ্যাডমিন পিন কোড, স্বয়ংক্রিয় শিডিউলিং মোড, জেমিনি মডেল ও সুপাবেস ডাটাবেস কনফিগারেশন।'
              : 'Configure admin PIN code, automation mode, timezone, Gemini AI parameters, and Supabase database.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Admin PIN & Access Protection */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'অ্যাডমিন নিরাপত্তা ও পিন কোড' : 'Admin Security & PIN Code'}
            </h2>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'bn' ? 'অ্যাডমিন পিন কোড (ডিফল্ট: 1234)' : 'Admin Access PIN (Default: 1234)'}
            </label>
            <input
              type="text"
              required
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* 2. Automation & Scheduling Engine */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Clock className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'অটোমেশন ও শিডিউলিং সেটিংস' : 'Automation & Scheduling Rules'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Publishing Mode */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Publishing Mode
              </label>
              <select
                value={publishingMode}
                onChange={(e) => setPublishingMode(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              >
                <option value="auto">
                  {lang === 'bn' ? 'Mode A: Auto Publish (সম্পূর্ণ স্বয়ংক্রিয়)' : 'Mode A: Auto Publish (Direct)'}
                </option>
                <option value="approval_required">
                  {lang === 'bn' ? 'Mode B: Approval Required (ড্রাফট ও পর্যালোচনা)' : 'Mode B: Approval Required (Review)'}
                </option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>

            {/* Daily Target */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Daily Posting Target
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={dailyPostingCount}
                onChange={(e) => setDailyPostingCount(parseInt(e.target.value, 10))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>

            {/* Advance Hours */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Auto-Advance Queue Ahead
              </label>
              <select
                value={autoAdvanceHours}
                onChange={(e) => setAutoAdvanceHours(parseInt(e.target.value, 10))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              >
                <option value={4}>4 Hours Ahead</option>
                <option value={8}>8 Hours Ahead</option>
                <option value={12}>12 Hours Ahead</option>
                <option value={24}>24 Hours Ahead</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Gemini AI Configuration */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Cpu className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'গুগল জেমিনি এআই ইঞ্জিন (Gemini 3.8 Flash)' : 'Google Gemini AI Engine'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                AI Model (Active)
              </label>
              <input
                type="text"
                disabled
                value="gemini-3.8-flash (Standard Production Engine)"
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-600 dark:text-slate-300"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                সার্ভার-সাইডে সিকিউরভাবে @google/genai SDK ব্যবহার হচ্ছে।
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Copywriting Language
              </label>
              <select
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              >
                <option value="bn">বাংলা (Bengali - High Priority)</option>
                <option value="en">English</option>
                <option value="bilingual">Bilingual (দ্বিভাষিক)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Supabase Database Integration */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'সুপাবেস পোস্টগ্রেস ডাটাবেস (Supabase PostgreSQL)' : 'Supabase Database Integration'}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleViewSql}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
            >
              <span>{lang === 'bn' ? 'সম্পূর্ণ SQL স্কিমা দেখুন' : 'View SQL Schema (12 Tables)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase Project URL (Optional)
              </label>
              <input
                type="url"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyz.supabase.co"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supabase Anon / Public Key (Optional)
              </label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOi..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-[11px]"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            {lang === 'bn'
              ? 'টিপস: প্ল্যাটফর্মটি বর্তমানে বিল্ট-ইন লোকাল পারসিস্টেন্ট স্টোরেজ ব্যবহার করছে, যার ফলে সুপাবেস ক্রেডেনশিয়াল না থাকলেও সিস্টেমটি তাৎক্ষণিকভাবে পুরোপুরি কাজ করবে। আপনি চাইলে আপনার সুপাবেস প্রজেক্টেও এই ১২টি টেবিল মাইগ্রেশন করতে পারেন।'
              : 'The platform is currently operating with built-in persistent disk storage, ensuring instant execution even without external credentials. You can optionally link your Supabase PostgreSQL project.'}
          </p>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : (lang === 'bn' ? 'সব পরিবর্তন সংরক্ষণ করুন' : 'Save All Settings')}</span>
          </button>
        </div>
      </form>

      {/* Supabase SQL Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Supabase PostgreSQL Complete DDL Script
                </h2>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500">
                  Run this in your Supabase SQL Editor:
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sqlSchema);
                    alert('SQL copied to clipboard!');
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-96 leading-relaxed">
                {sqlSchema}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
