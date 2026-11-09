export type Language = 'bn' | 'en' | 'both';
export type PostStatus = 'draft' | 'pending' | 'scheduled' | 'published' | 'failed' | 'paused';
export type ApprovalMode = 'auto' | 'manual' | 'approval_required';
export type PreferredLength = 'short' | 'medium' | 'long' | 'story';
export type ImagePref = 'optional' | 'always' | 'never';

export interface Category {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  style: string;
  tone: string;
  audience: string;
  language: Language;
  preferredLength: PreferredLength;
  hashtagRules: string[];
  contentInstructions: string;
  imagePreferences: ImagePref;
  dailyPosts: number;
  scheduleTimes: string[]; // e.g. ["09:00", "14:00", "20:00"]
  isActive: boolean;
  color?: string;
}

export interface PostItem {
  id: string;
  title?: string;
  body: string;
  hashtags: string[];
  categoryId: string;
  categoryName: string;
  language: 'bn' | 'en';
  status: PostStatus;
  approvalMode: ApprovalMode;
  scheduledAt: string; // ISO string
  publishedAt?: string;
  facebookPostId?: string;
  facebookPermalink?: string;
  imageUrl?: string;
  imagePrompt?: string;
  imageSource: 'none' | 'ai' | 'upload' | 'card';
  errorMsg?: string;
  sourceCommand?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommandHistoryItem {
  id: string;
  instruction: string;
  count: number;
  categoryId?: string;
  categoryName?: string;
  language: 'bn' | 'en';
  createdAt: string;
  status: 'completed' | 'failed' | 'running';
  generatedPostCount: number;
}

export interface LibraryImage {
  id: string;
  url: string;
  prompt?: string;
  title?: string;
  aspectRatio: string;
  category?: string;
  createdAt: string;
  type: 'ai' | 'upload' | 'preset' | 'card';
}

export interface AdminSettings {
  adminPin: string;
  isAutomationActive: boolean;
  publishingMode: 'auto' | 'approval_required';
  defaultTimezone: string;
  dailyPostingCount: number;
  preferredLanguage: 'bn' | 'en' | 'bilingual';
  geminiModel: string;
  metaAppId: string;
  metaAppSecret: string;
  metaUserToken: string;
  metaPageToken: string;
  metaPageId: string;
  metaPageName: string;
  isMetaConnected: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  isSupabaseConfigured: boolean;
  notifyOnPublish: boolean;
  autoAdvanceHours: number;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  module: 'ai' | 'facebook' | 'scheduler' | 'system';
  message: string;
  details?: string;
}

export interface DashboardMetrics {
  totalGenerated: number;
  totalPublished: number;
  pendingCount: number;
  scheduledCount: number;
  failedCount: number;
  draftCount: number;
  todayPublishedCount: number;
  activeCategoriesCount: number;
  nextScheduledPost: PostItem | null;
  isAutomationActive: boolean;
  isMetaConnected: boolean;
  metaPageName?: string;
}
