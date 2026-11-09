import React, { useState, useEffect } from 'react';
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  ExternalLink,
  RotateCcw,
  BookOpen,
  Info,
  Server,
} from 'lucide-react';
import { AdminSettings } from '../types.ts';
import { api } from '../services/api.ts';

interface Props {
  settings: AdminSettings;
  lang: 'en' | 'bn';
  onRefresh: () => void;
}

export const FacebookConnectView: React.FC<Props> = ({ settings, lang, onRefresh }) => {
  const [userToken, setUserToken] = useState(() => settings.metaUserToken || localStorage.getItem('mosafa_meta_user_token') || '');
  const [pageId, setPageId] = useState(() => settings.metaPageId || localStorage.getItem('mosafa_saved_page_id') || '1475947198932278');
  const [pageToken, setPageToken] = useState(() => settings.metaPageToken || localStorage.getItem('mosafa_saved_page_token') || '');
  const [pageName, setPageName] = useState(() => {
    if (settings.metaPageName && settings.metaPageName !== 'MoSaFa Official Page (Demo / Connect to Live)') {
      return settings.metaPageName;
    }
    return localStorage.getItem('mosafa_saved_page_name') || 'The Mosafa';
  });
  const [appId, setAppId] = useState(() => settings.metaAppId || localStorage.getItem('mosafa_meta_app_id') || '');
  const [appSecret, setAppSecret] = useState(() => settings.metaAppSecret || localStorage.getItem('mosafa_meta_app_secret') || '');

  // Keep local state in sync only if settings has non-empty values
  useEffect(() => {
    if (settings.metaPageId) {
      setPageId(settings.metaPageId);
      localStorage.setItem('mosafa_saved_page_id', settings.metaPageId);
    }
    if (settings.metaPageName && settings.metaPageName !== 'MoSaFa Official Page (Demo / Connect to Live)') {
      setPageName(settings.metaPageName);
      localStorage.setItem('mosafa_saved_page_name', settings.metaPageName);
    }
    if (settings.metaPageToken) {
      setPageToken(settings.metaPageToken);
      localStorage.setItem('mosafa_saved_page_token', settings.metaPageToken);
    }
    if (settings.metaUserToken) {
      setUserToken(settings.metaUserToken);
      localStorage.setItem('mosafa_meta_user_token', settings.metaUserToken);
    }
    if (settings.metaAppId) {
      setAppId(settings.metaAppId);
      localStorage.setItem('mosafa_meta_app_id', settings.metaAppId);
    }
    if (settings.metaAppSecret) {
      setAppSecret(settings.metaAppSecret);
      localStorage.setItem('mosafa_meta_app_secret', settings.metaAppSecret);
    }
  }, [settings]);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    valid: boolean;
    user?: { id: string; name: string };
    pages: any[];
    error?: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePageTokenChange = (val: string) => {
    setPageToken(val);
    localStorage.setItem('mosafa_saved_page_token', val);
  };

  const handlePageIdChange = (val: string) => {
    setPageId(val);
    localStorage.setItem('mosafa_saved_page_id', val);
  };

  const handlePageNameChange = (val: string) => {
    setPageName(val);
    localStorage.setItem('mosafa_saved_page_name', val);
  };

  const handleTestConnection = async () => {
    const tokenToTest = pageToken || userToken;
    if (!tokenToTest) {
      setToastMsg({
        type: 'error',
        text: lang === 'bn' ? 'অনুগ্রহ করে অ্যাক্সেস টোকেন দিন।' : 'Please enter an access token to test.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    setToastMsg(null);

    try {
      const res = await api.testFacebook(tokenToTest, pageId);
      setTestResult(res);

      if (res.valid) {
        let selectedId = pageId || '1475947198932278';
        let selectedName = pageName || 'The Mosafa';
        let selectedToken = tokenToTest;

        if (res.pages && res.pages.length > 0) {
          const primary = res.pages[0];
          selectedId = primary.id;
          selectedName = primary.name;
          selectedToken = primary.access_token || tokenToTest;

          setPageId(selectedId);
          setPageName(selectedName);
          setPageToken(selectedToken);
        } else if (res.user) {
          selectedId = res.user.id;
          selectedName = res.user.name;
          setPageId(selectedId);
          setPageName(selectedName);
        }

        // AUTO-SAVE IMMEDIATELY TO LOCALSTORAGE AND SERVER!
        localStorage.setItem('mosafa_saved_page_token', selectedToken);
        localStorage.setItem('mosafa_saved_page_id', selectedId);
        localStorage.setItem('mosafa_saved_page_name', selectedName);

        await api.updateSettings({
          metaPageToken: selectedToken,
          metaPageId: selectedId,
          metaPageName: selectedName,
          isMetaConnected: true,
        });

        setToastMsg({
          type: 'success',
          text: lang === 'bn'
            ? `সংযোগ সফল ও স্থায়ীভাবে সংরক্ষিত হয়েছে! পেজ: ${selectedName} (ID: ${selectedId})`
            : `Connected and permanently saved! Page: ${selectedName}`,
        });

        onRefresh();
      } else {
        setToastMsg({
          type: 'error',
          text: res.error || (lang === 'bn' ? 'টোকেন যাচাই ব্যর্থ হয়েছে' : 'Token verification failed'),
        });
      }
    } catch (err: any) {
      setTestResult({
        valid: false,
        pages: [],
        error: err.message || 'Network error reaching Facebook API',
      });
      setToastMsg({
        type: 'error',
        text: err.message || 'Network error reaching Facebook API',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setToastMsg(null);
    try {
      // Immediate localStorage backup
      localStorage.setItem('mosafa_saved_page_token', pageToken.trim());
      localStorage.setItem('mosafa_saved_page_id', pageId.trim());
      localStorage.setItem('mosafa_saved_page_name', pageName.trim());
      localStorage.setItem('mosafa_meta_user_token', userToken.trim());
      localStorage.setItem('mosafa_meta_app_id', appId.trim());
      localStorage.setItem('mosafa_meta_app_secret', appSecret.trim());

      const isConn = Boolean(pageToken.trim() && pageId.trim());
      await api.updateSettings({
        metaAppId: appId.trim(),
        metaAppSecret: appSecret.trim(),
        metaUserToken: userToken.trim(),
        metaPageToken: pageToken.trim(),
        metaPageId: pageId.trim() || '1475947198932278',
        metaPageName: pageName.trim() || 'The Mosafa',
        isMetaConnected: isConn,
      });
      setToastMsg({
        type: 'success',
        text: lang === 'bn'
          ? '✓ ফেসবুক সেটিংস ও টোকেন ব্রাউজার ও ডাটাবেজে স্থায়ীভাবে সেভ হয়েছে! (এখন থেকে আর মুছবে না)'
          : '✓ Facebook credentials permanently saved to browser & database!',
      });
      onRefresh();
    } catch (err: any) {
      setToastMsg({
        type: 'error',
        text: `Save failed: ${err.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    localStorage.removeItem('mosafa_saved_page_token');
    localStorage.removeItem('mosafa_saved_page_id');
    localStorage.removeItem('mosafa_saved_page_name');
    localStorage.removeItem('mosafa_meta_user_token');

    await api.updateSettings({
      metaUserToken: '',
      metaPageToken: '',
      metaPageId: '',
      metaPageName: '',
      isMetaConnected: false,
    });
    setUserToken('');
    setPageToken('');
    setPageId('');
    setPageName('');
    setTestResult(null);
    setToastMsg({
      type: 'success',
      text: lang === 'bn' ? 'ফেসবুক সংযোগ বিচ্ছিন্ন করা হয়েছে।' : 'Facebook disconnected successfully.',
    });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <span>{lang === 'bn' ? 'ফেসবুক কানেকশন (Meta Graph API)' : 'Facebook Meta Graph API Integration'}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'অফিসিয়াল মেটা গ্রাফ এপিআই (Meta Graph API) দিয়ে আপনার ফেসবুক পেজ সংযুক্ত করুন।'
              : 'Connect your authorized Facebook Page using official Meta Graph API v19.0.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${
              settings.isMetaConnected
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${settings.isMetaConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {settings.isMetaConnected
              ? lang === 'bn' ? 'পেজ সংযুক্ত আছে' : 'Page Connected (Live)'
              : lang === 'bn' ? 'সিমুলেশন টেস্ট মোড' : 'Simulation Test Mode'}
          </span>
        </div>
      </div>

      {/* Limitation Notice Card */}
      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
          <strong className="block font-semibold mb-0.5">
            {lang === 'bn' ? 'মেটা এপিআই নীতি ও পেজ পাবলিশিং নিয়ম:' : 'Meta Graph API Policy & Target Page Rule:'}
          </strong>
          {lang === 'bn'
            ? 'অফিসিয়াল মেটা গ্রাফ এপিআই শুধুমাত্র ফেসবুক পেজ (Facebook Page)-এ অটোমেটিক পাবলিশ করার অনুমতি দেয়। ব্যক্তিগত ফেসবুক প্রোফাইলে (Personal Profile) কোনো এপিআই দিয়ে স্বয়ংক্রিয় পোস্ট করা মেটা পলিসির পরিপন্থী। MoSaFa প্ল্যাটফর্ম আপনার অনুমোদিত ফেসবুক পেজে সম্পূর্ণ স্বয়ংক্রিয়ভাবে টেক্সট ও ছবি পাবলিশ করবে।'
            : 'The official Meta Graph API strictly permits automated publishing to Facebook Pages. Automated posting to personal Facebook profiles is restricted by Meta policies. MoSaFa publishes directly to your authorized Facebook Page.'}
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'মেটা গ্রাফ এপিআই ক্রেডেনশিয়াল' : 'Meta API Credentials'}
          </h2>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Page Access Token */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Page Access Token (পেজ অ্যাক্সেস টোকেন) *
              </label>
              <textarea
                rows={3}
                value={pageToken}
                onChange={(e) => handlePageTokenChange(e.target.value)}
                placeholder="EAA..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-[11px]"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {lang === 'bn'
                  ? 'মেটা ডেভেলপার পোর্টাল থেকে pages_manage_posts এবং pages_read_engagement পারমিশন সহ সংগৃহীত টোকেন।'
                  : 'Token generated from Graph API Explorer with pages_manage_posts and pages_read_engagement permissions.'}
              </p>
            </div>

            {/* Target Page ID & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Facebook Page ID *
                </label>
                <input
                  type="text"
                  value={pageId}
                  onChange={(e) => handlePageIdChange(e.target.value)}
                  placeholder="e.g. 1475947198932278"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Page Display Name
                </label>
                <input
                  type="text"
                  value={pageName}
                  onChange={(e) => handlePageNameChange(e.target.value)}
                  placeholder="e.g. The Mosafa"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Optional App ID & Secret */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meta App ID (Optional)
                </label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meta App Secret (Optional)
                </label>
                <input
                  type="password"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing...' : (lang === 'bn' ? 'সংযোগ পরীক্ষা করুন' : 'Test Token & Fetch Pages')}</span>
              </button>

              <div className="flex items-center gap-2">
                {settings.isMetaConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-medium cursor-pointer"
                  >
                    {lang === 'bn' ? 'সংযোগ বিচ্ছিন্ন করুন' : 'Disconnect'}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer shadow-xs"
                >
                  {saving ? 'Saving...' : (lang === 'bn' ? 'সেভ করুন' : 'Save Credentials')}
                </button>
              </div>
            </div>
          </form>

          {/* Toast Notification Banner */}
          {toastMsg && (
            <div
              className={`p-3.5 rounded-xl border mt-3 text-xs flex items-center justify-between gap-3 ${
                toastMsg.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {toastMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span className="font-medium">{toastMsg.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMsg(null)}
                className="text-[11px] underline opacity-75 hover:opacity-100 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Test Result Display */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border mt-4 text-xs ${
                testResult.valid
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-500/40 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                {testResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                <span>
                  {testResult.valid
                    ? (lang === 'bn' ? 'টোকেন বৈধ ও সক্রিয়!' : 'Token is Valid & Active!')
                    : (lang === 'bn' ? 'টোকেন যাচাই ব্যর্থ হয়েছে' : 'Token Verification Failed')}
                </span>
              </div>

              {testResult.error && <p className="mt-1 font-mono text-[11px]">{testResult.error}</p>}

              {testResult.user && (
                <p className="mt-1">
                  <strong>User:</strong> {testResult.user.name} (ID: {testResult.user.id})
                </p>
              )}

              {testResult.pages && testResult.pages.length > 0 && (
                <div className="mt-3 pt-2 border-t border-emerald-200 dark:border-emerald-800 space-y-1.5">
                  <p className="font-semibold">{lang === 'bn' ? 'অনুমোদিত পেজ তালিকা (ক্লিক করে নির্বাচন করুন):' : 'Authorized Pages (Click to select):'}</p>
                  {testResult.pages.map((p: any) => (
                    <div
                      key={p.id}
                      onClick={async () => {
                        const targetToken = p.access_token || pageToken;
                        setPageId(p.id);
                        setPageName(p.name);
                        setPageToken(targetToken);

                        localStorage.setItem('mosafa_saved_page_token', targetToken);
                        localStorage.setItem('mosafa_saved_page_id', p.id);
                        localStorage.setItem('mosafa_saved_page_name', p.name);

                        await api.updateSettings({
                          metaPageToken: targetToken,
                          metaPageId: p.id,
                          metaPageName: p.name,
                          isMetaConnected: true,
                        });
                        setToastMsg({
                          type: 'success',
                          text: lang === 'bn' ? `পেজ "${p.name}" সফলভাবে যুক্ত ও সেভ হয়েছে!` : `Page "${p.name}" selected and saved!`,
                        });
                        onRefresh();
                      }}
                      className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 cursor-pointer flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-slate-800"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                        <p className="font-mono text-[10px] text-slate-500">ID: {p.id}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Select
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step-by-Step Meta Developer Guide (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'টোকেন নেওয়ার সহজ নির্দেশিকা (ধাপে ধাপে)' : 'Step-by-Step Meta Setup Guide'}
            </h2>
          </div>

          <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside leading-relaxed">
            <li>
              <strong className="text-slate-900 dark:text-white">
                {lang === 'bn' ? 'মেটা ডেভেলপার পোর্টালে যান:' : 'Open Meta for Developers:'}
              </strong>
              <a
                href="https://developers.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline flex items-center gap-1 inline-flex ml-1"
              >
                developers.facebook.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              {lang === 'bn'
                ? 'একটি "Business" টাইপ অ্যাপ তৈরি করুন (বা পূর্ববর্তী অ্যাপ ব্যবহার করুন)।'
                : 'Create or select a "Business" type app in your developer account.'}
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">Graph API Explorer:</strong>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 pl-4">
                Tools &gt; Graph API Explorer এ যান। আপনার অ্যাপটি ড্রপডাউন থেকে সিলেক্ট করুন।
              </p>
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">
                {lang === 'bn' ? 'প্রয়োজনীয় পারমিশন যুক্ত করুন:' : 'Add Required Permissions:'}
              </strong>
              <div className="flex flex-wrap gap-1.5 mt-1 pl-4 font-mono text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                  pages_show_list
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                  pages_read_engagement
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                  pages_manage_posts
                </span>
              </div>
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">
                {lang === 'bn' ? 'টোকেন তৈরি করুন:' : 'Generate Page Access Token:'}
              </strong>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 pl-4">
                "Generate Access Token" এ ক্লিক করে আপনার ফেসবুক পেজটি নির্বাচন করুন। উৎপন্ন টোকেনটি কপি করে বামের বক্সে পেস্ট করুন।
              </p>
            </li>
            <li>
              <strong className="text-slate-900 dark:text-white">
                {lang === 'bn' ? 'টেস্ট মোড সুবিধা:' : 'Test Mode Advantage:'}
              </strong>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 pl-4">
                টোকেন না দিলেও আপনি সিমুলেশন মোডে সমস্ত কন্টেন্ট তৈরি ও শিডিউলার পরীক্ষা করতে পারবেন!
              </p>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
