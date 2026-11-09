import { AdminSettings, Category, CommandHistoryItem, DashboardMetrics, LibraryImage, PostItem, SystemLog } from '../types.ts';

export const api = {
  async getStatus(): Promise<{ success: boolean; metrics: DashboardMetrics }> {
    const res = await fetch('/api/status');
    return res.json();
  },

  async verifyPin(pin: string): Promise<{ success: boolean; authorized: boolean; error?: string }> {
    const res = await fetch('/api/auth/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    return res.json();
  },

  async getSettings(): Promise<{ success: boolean; settings: AdminSettings }> {
    const res = await fetch('/api/settings');
    return res.json();
  },

  async updateSettings(settings: Partial<AdminSettings>): Promise<{ success: boolean; settings: AdminSettings }> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  async toggleAutomation(action: 'start' | 'pause' | 'resume' | 'stop'): Promise<{ success: boolean; isAutomationActive: boolean }> {
    const res = await fetch('/api/automation/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    return res.json();
  },

  async getCategories(): Promise<{ success: boolean; categories: Category[] }> {
    const res = await fetch('/api/categories');
    return res.json();
  },

  async saveCategory(category: Partial<Category>): Promise<{ success: boolean; category: Category }> {
    const isNew = !category.id;
    const url = isNew ? '/api/categories' : `/api/categories/${category.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return res.json();
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async getPosts(): Promise<{ success: boolean; posts: PostItem[] }> {
    const res = await fetch('/api/posts');
    return res.json();
  },

  async savePost(post: Partial<PostItem>): Promise<{ success: boolean; post: PostItem }> {
    const isNew = !post.id;
    const url = isNew ? '/api/posts' : `/api/posts/${post.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    return res.json();
  },

  async deletePost(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async publishPostNow(id: string): Promise<{ success: boolean; post: PostItem; isSimulated?: boolean; permalink?: string; error?: string }> {
    const res = await fetch(`/api/posts/${id}/publish-now`, { method: 'POST' });
    return res.json();
  },

  async regeneratePost(id: string, feedback?: string): Promise<{ success: boolean; post: PostItem }> {
    const res = await fetch(`/api/posts/${id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    });
    return res.json();
  },

  async clearQueue(): Promise<{ success: boolean; count: number }> {
    const res = await fetch('/api/queue/clear', { method: 'POST' });
    return res.json();
  },

  async generateAI(params: {
    categoryId?: string;
    customTopic?: string;
    count?: number;
    language?: 'bn' | 'en' | 'both';
    approvalMode?: 'auto' | 'manual';
  }): Promise<{ success: boolean; posts: PostItem[]; error?: string }> {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async generateCommand(params: {
    instruction: string;
    count?: number;
    language?: 'bn' | 'en';
    categoryId?: string;
  }): Promise<{ success: boolean; posts: PostItem[]; error?: string }> {
    const res = await fetch('/api/ai/generate-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async getCommands(): Promise<{ success: boolean; commands: CommandHistoryItem[] }> {
    const res = await fetch('/api/commands');
    return res.json();
  },

  async getImages(): Promise<{ success: boolean; images: LibraryImage[] }> {
    const res = await fetch('/api/images');
    return res.json();
  },

  async saveImage(image: Partial<LibraryImage>): Promise<{ success: boolean; image: LibraryImage }> {
    const res = await fetch('/api/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(image),
    });
    return res.json();
  },

  async deleteImage(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/images/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async getLogs(): Promise<{ success: boolean; logs: SystemLog[] }> {
    const res = await fetch('/api/logs');
    return res.json();
  },

  async testFacebook(token: string, targetPageId?: string): Promise<{
    valid: boolean;
    user?: { id: string; name: string };
    pages: any[];
    error?: string;
  }> {
    const res = await fetch('/api/facebook/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, targetPageId }),
    });
    return res.json();
  },

  async saveFacebookPage(params: { pageId: string; pageName: string; pageToken: string }): Promise<{ success: boolean }> {
    const res = await fetch('/api/facebook/save-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async getSupabaseSchema(): Promise<{ success: boolean; sql: string }> {
    const res = await fetch('/api/supabase/schema');
    return res.json();
  },
};
