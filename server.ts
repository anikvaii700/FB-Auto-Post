import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './server/db.ts';
import { generatePostsWithAI, regeneratePostWithFeedback, generateCaptionForImage, generateSmartCommentReply } from './server/gemini.ts';
import { publishPostToFacebook, testFacebookConnection, fetchFacebookPostComments, replyToFacebookComment } from './server/facebook.ts';
import { startBackgroundScheduler, stopBackgroundScheduler } from './server/scheduler.ts';
import { SUPABASE_SQL_SCHEMA } from './server/supabase_schema.ts';
import { Category, PostItem, FacebookCommentItem } from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// -------------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------------

// 1. Dashboard Status & Metrics
app.get('/api/status', (req, res) => {
  try {
    const settings = db.getSettings();
    const posts = db.getPosts();
    const categories = db.getCategories();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const todayPublishedCount = posts.filter(
      (p) => p.status === 'published' && p.publishedAt?.startsWith(todayStr)
    ).length;

    const scheduled = posts
      .filter((p) => p.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    const nextScheduledPost = scheduled.length > 0 ? scheduled[0] : null;

    res.json({
      success: true,
      metrics: {
        totalGenerated: posts.length,
        totalPublished: posts.filter((p) => p.status === 'published').length,
        pendingCount: posts.filter((p) => p.status === 'pending').length,
        scheduledCount: scheduled.length,
        failedCount: posts.filter((p) => p.status === 'failed').length,
        draftCount: posts.filter((p) => p.status === 'draft').length,
        todayPublishedCount,
        activeCategoriesCount: categories.filter((c) => c.isActive).length,
        nextScheduledPost,
        isAutomationActive: settings.isAutomationActive,
        isMetaConnected: settings.isMetaConnected,
        metaPageName: settings.metaPageName,
        publishingMode: settings.publishingMode,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Admin Settings & PIN Login
app.post('/api/auth/verify-pin', (req, res) => {
  const { pin } = req.body;
  const currentPin = db.getSettings().adminPin || '1234';
  if (pin === currentPin) {
    return res.json({ success: true, authorized: true });
  }
  return res.status(401).json({ success: false, authorized: false, error: 'ভুল পিন কোড। সঠিক অ্যাডমিন পিন দিন।' });
});

app.get('/api/settings', (req, res) => {
  res.json({ success: true, settings: db.getSettings() });
});

app.post('/api/settings', (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    db.addLog('info', 'system', 'Admin settings updated successfully.');
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Automation Engine Control
app.post('/api/automation/toggle', (req, res) => {
  const { action } = req.body; // 'start', 'pause', 'resume', 'stop'
  const settings = db.getSettings();

  if (action === 'start' || action === 'resume') {
    db.updateSettings({ isAutomationActive: true });
    startBackgroundScheduler();
    db.addLog('info', 'scheduler', `Automation active: Background posting scheduler ${action === 'start' ? 'started' : 'resumed'}.`);
    return res.json({ success: true, isAutomationActive: true });
  } else if (action === 'pause' || action === 'stop') {
    db.updateSettings({ isAutomationActive: false });
    stopBackgroundScheduler();
    db.addLog('info', 'scheduler', `Automation paused: Background posting paused by admin.`);
    return res.json({ success: true, isAutomationActive: false });
  }
  return res.status(400).json({ success: false, error: 'Invalid action. Use start, pause, resume, or stop.' });
});

// 4. Categories CRUD
app.get('/api/categories', (req, res) => {
  res.json({ success: true, categories: db.getCategories() });
});

app.post('/api/categories', (req, res) => {
  try {
    const category: Category = {
      ...req.body,
      id: req.body.id || `cat_${Date.now()}`,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    };
    db.saveCategory(category);
    db.addLog('info', 'system', `Category "${category.name}" created.`);
    res.json({ success: true, category });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/categories/:id', (req, res) => {
  try {
    const category: Category = { ...req.body, id: req.params.id };
    db.saveCategory(category);
    db.addLog('info', 'system', `Category "${category.name}" updated.`);
    res.json({ success: true, category });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  const ok = db.deleteCategory(req.params.id);
  db.addLog('warn', 'system', `Category "${req.params.id}" deleted.`);
  res.json({ success: ok });
});

// 5. Posts & Publishing Queue CRUD
app.get('/api/posts', (req, res) => {
  res.json({ success: true, posts: db.getPosts() });
});

app.post('/api/posts', (req, res) => {
  try {
    const post: PostItem = {
      ...req.body,
      id: req.body.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      retryCount: req.body.retryCount || 0,
      createdAt: req.body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.savePost(post);
    db.addLog('info', 'system', `Post "${post.title || post.id}" saved with status: ${post.status}.`);
    res.json({ success: true, post });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/posts/:id', (req, res) => {
  try {
    const existing = db.getPost(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    const updated = db.savePost({ ...existing, ...req.body, id: req.params.id });
    res.json({ success: true, post: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/posts/:id', (req, res) => {
  const ok = db.deletePost(req.params.id);
  res.json({ success: ok });
});

// Clear Queue
app.post('/api/queue/clear', (req, res) => {
  const count = db.clearQueue();
  db.addLog('warn', 'scheduler', `Cleared ${count} pending/scheduled posts from queue.`);
  res.json({ success: true, count });
});

// 6. Direct Publish Now
app.post('/api/posts/:id/publish-now', async (req, res) => {
  try {
    const post = db.getPost(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const settings = db.getSettings();
    const result = await publishPostToFacebook({
      post,
      pageToken: settings.metaPageToken,
      pageId: settings.metaPageId,
      pageName: settings.metaPageName || 'The Mosafa',
    });

    if (result.success) {
      post.status = 'published';
      post.publishedAt = new Date().toISOString();
      post.facebookPostId = result.postId;
      post.facebookPermalink = result.permalink;
      post.errorMsg = undefined;
      db.savePost(post);

      const simNotice = result.isSimulated ? ' (Simulated - Live FB token not set)' : ' (Live Facebook Page)';
      db.addLog('success', 'facebook', `Post published manually to ${settings.metaPageName || 'Facebook'}${simNotice}`, result.permalink);

      return res.json({ success: true, post, isSimulated: result.isSimulated, permalink: result.permalink });
    } else {
      post.errorMsg = result.error;
      db.savePost(post);
      db.addLog('error', 'facebook', `Failed to publish post: ${result.error}`);
      return res.status(400).json({ success: false, error: result.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. AI Content Generation
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { categoryId, customTopic, count, language, approvalMode } = req.body;
    const category = categoryId ? db.getCategory(categoryId) : undefined;
    const settings = db.getSettings();

    const recentBodies = db.getPosts().slice(0, 5).map((p) => p.body);

    const generatedOutputs = await generatePostsWithAI({
      category,
      customTopic,
      count: count || 1,
      language: language || settings.preferredLanguage,
      recentPostBodies: recentBodies,
    });

    // Check images in library
    const images = db.getImages();
    const defaultImage = images.find((i) => i.category?.toLowerCase() === category?.name.toLowerCase()) || images[1];

    const mode = approvalMode || settings.publishingMode;
    const newPosts: PostItem[] = generatedOutputs.map((item, idx) => {
      // stagger scheduled times by 3 hours
      const scheduledTime = new Date(Date.now() + 1000 * 60 * (45 + idx * 180)).toISOString();

      return {
        id: `post_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        title: item.title,
        body: item.body,
        hashtags: item.hashtags,
        categoryId: category?.id || 'custom',
        categoryName: category?.name || 'Custom AI Generation',
        language: item.language,
        status: mode === 'auto' ? 'scheduled' : 'draft',
        approvalMode: mode,
        scheduledAt: scheduledTime,
        imageUrl: defaultImage?.url,
        imagePrompt: item.suggestedImagePrompt,
        imageSource: defaultImage ? 'ai' : 'none',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    db.savePosts(newPosts);
    db.addLog('success', 'ai', `Generated ${newPosts.length} post(s) via Gemini 3.8 Flash.`);

    res.json({ success: true, posts: newPosts });
  } catch (err: any) {
    console.error('AI generation API error:', err);
    db.addLog('error', 'ai', `Generation error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. AI Command Center Execution
app.post('/api/ai/generate-command', async (req, res) => {
  try {
    const { instruction, count, language, categoryId } = req.body;
    if (!instruction || !instruction.trim()) {
      return res.status(400).json({ success: false, error: 'Instruction cannot be empty' });
    }

    const category = categoryId ? db.getCategory(categoryId) : undefined;
    const settings = db.getSettings();
    const postCount = parseInt(count, 10) || 1;
    const targetLang = language || settings.preferredLanguage;

    const recentBodies = db.getPosts().slice(0, 5).map((p) => p.body);

    const generatedOutputs = await generatePostsWithAI({
      category,
      customTopic: instruction,
      count: postCount,
      language: targetLang,
      recentPostBodies: recentBodies,
    });

    const libraryImages = db.getImages();
    const newPosts: PostItem[] = generatedOutputs.map((item, idx) => {
      const scheduledTime = new Date(Date.now() + 1000 * 60 * (60 + idx * 180)).toISOString();
      const matchedImg = libraryImages.find((img) => img.category?.toLowerCase() === category?.name.toLowerCase()) || libraryImages[1];

      return {
        id: `post_cmd_${Date.now()}_${idx}`,
        title: item.title,
        body: item.body,
        hashtags: item.hashtags,
        categoryId: category?.id || 'custom_command',
        categoryName: category?.name || 'AI Command Center',
        language: item.language,
        status: settings.publishingMode === 'auto' ? 'scheduled' : 'draft',
        approvalMode: settings.publishingMode,
        scheduledAt: scheduledTime,
        imageUrl: matchedImg?.url,
        imagePrompt: item.suggestedImagePrompt,
        imageSource: matchedImg ? 'ai' : 'none',
        sourceCommand: instruction,
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    db.savePosts(newPosts);

    // Save to command history
    db.addCommand({
      id: `cmd_${Date.now()}`,
      instruction,
      count: postCount,
      categoryId: category?.id,
      categoryName: category?.name,
      language: targetLang === 'both' ? 'bn' : targetLang,
      createdAt: new Date().toISOString(),
      status: 'completed',
      generatedPostCount: newPosts.length,
    });

    db.addLog('success', 'ai', `Executed command: "${instruction.substring(0, 50)}..." -> Generated ${newPosts.length} posts.`);

    res.json({ success: true, posts: newPosts });
  } catch (err: any) {
    db.addLog('error', 'ai', `Command execution failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Regenerate single post
app.post('/api/posts/:id/regenerate', async (req, res) => {
  try {
    const post = db.getPost(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    const { feedback } = req.body;
    const regenerated = await regeneratePostWithFeedback(post, feedback);

    post.title = regenerated.title;
    post.body = regenerated.body;
    post.hashtags = regenerated.hashtags;
    if (regenerated.suggestedImagePrompt) {
      post.imagePrompt = regenerated.suggestedImagePrompt;
    }
    post.updatedAt = new Date().toISOString();

    db.savePost(post);
    db.addLog('info', 'ai', `Regenerated post "${post.title || post.id}" with feedback.`);
    res.json({ success: true, post });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Command History
app.get('/api/commands', (req, res) => {
  res.json({ success: true, commands: db.getCommands() });
});

// 10. Library Images
app.get('/api/images', (req, res) => {
  res.json({ success: true, images: db.getImages() });
});

app.post('/api/images', (req, res) => {
  try {
    const image = {
      ...req.body,
      id: req.body.id || `img_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.addImage(image);
    res.json({ success: true, image });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/images/:id', (req, res) => {
  const ok = db.deleteImage(req.params.id);
  res.json({ success: ok });
});

// 10B. AI Image Caption Generation (Requirement #1)
app.post('/api/ai/image-caption', async (req, res) => {
  try {
    const { imagePrompt, imageBase64, mimeType, theme, preferredTone, customHint } = req.body;
    const result = await generateCaptionForImage({
      imagePrompt,
      imageBase64,
      mimeType,
      theme,
      preferredTone,
      customHint,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10C. Batch Image Schedule Creator (Requirement #1: অনেকগুলো ছবি এক সাথে শিডিউলে পোস্ট করা)
app.post('/api/ai/batch-image-posts', async (req, res) => {
  try {
    const { items, scheduleIntervalHours = 3, startDelayMinutes = 30 } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No items provided for batch scheduling' });
    }

    const settings = db.getSettings();
    const now = Date.now();
    const intervalMs = scheduleIntervalHours * 60 * 60 * 1000;
    const initialDelayMs = startDelayMinutes * 60 * 1000;

    const newPosts: PostItem[] = items.map((item: any, idx: number) => {
      const scheduledTime = item.scheduledAt || new Date(now + initialDelayMs + idx * intervalMs).toISOString();

      return {
        id: `post_batch_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        title: item.title || `ছবি পোস্ট #${idx + 1}`,
        body: item.caption || item.body || '',
        hashtags: Array.isArray(item.hashtags) ? item.hashtags : ['#TheMosafa', '#PhotoPost'],
        categoryId: item.categoryId || 'custom_photo',
        categoryName: item.categoryName || 'ছবি ও ক্যাপশন পোস্টার',
        language: 'bn',
        status: settings.publishingMode === 'auto' ? 'scheduled' : 'scheduled',
        approvalMode: settings.publishingMode,
        scheduledAt: scheduledTime,
        imageUrl: item.imageUrl,
        imageSource: 'upload',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    db.savePosts(newPosts);
    db.addLog(
      'success',
      'scheduler',
      `ব্যাচ ফটো শিডিউলার: ${newPosts.length}টি ছবি ও ক্যাপশন শিডিউল কিউতে সফলভাবে যুক্ত হয়েছে।`
    );

    res.json({ success: true, count: newPosts.length, posts: newPosts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10D. Facebook Comment Management & Auto-Reply Bot (Requirement #3)
app.get('/api/comments', async (req, res) => {
  try {
    const settings = db.getSettings();
    const storedComments = db.getComments();

    // If connected to Facebook, fetch fresh comments on recent posts
    if (settings.isMetaConnected && settings.metaPageToken) {
      const publishedPosts = db.getPosts().filter((p) => p.status === 'published' && p.facebookPostId).slice(0, 5);

      for (const p of publishedPosts) {
        if (!p.facebookPostId) continue;
        try {
          const fbComments = await fetchFacebookPostComments(p.facebookPostId, settings.metaPageToken);
          for (const fc of fbComments) {
            const existing = storedComments.find((c) => c.id === fc.id);
            if (!existing) {
              const newComment: FacebookCommentItem = {
                id: fc.id,
                postId: p.facebookPostId,
                postTitle: p.title || p.body.substring(0, 40),
                fromName: fc.from?.name || 'ফেসবুক ব্যবহারকারী',
                fromId: fc.from?.id,
                message: fc.message || '',
                createdTime: fc.created_time || new Date().toISOString(),
                replied: false,
              };
              db.saveComment(newComment);
            }
          }
        } catch (_) {}
      }
    }

    res.json({
      success: true,
      comments: db.getComments(),
      isBotActive: settings.isAutoCommentReplyActive ?? true,
      botTone: settings.autoCommentReplyTone || 'islamic_warm',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test or Generate Comment Reply
app.post('/api/comments/test-reply', async (req, res) => {
  try {
    const { commentText, commenterName, tone, postTitle } = req.body;
    if (!commentText) {
      return res.status(400).json({ success: false, error: 'Comment text is required' });
    }

    const reply = await generateSmartCommentReply({
      commentText,
      commenterName,
      tone,
      postTitle,
    });

    res.json({ success: true, ...reply });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reply to a specific comment (live or simulated)
app.post('/api/comments/reply', async (req, res) => {
  try {
    const { commentId, message } = req.body;
    if (!commentId || !message) {
      return res.status(400).json({ success: false, error: 'commentId and message are required' });
    }

    const settings = db.getSettings();
    let replySuccess = false;
    let replyId: string | undefined;

    if (settings.isMetaConnected && settings.metaPageToken && !commentId.startsWith('sim_')) {
      const fbRes = await replyToFacebookComment(commentId, message, settings.metaPageToken);
      replySuccess = fbRes.success;
      replyId = fbRes.replyId;
      if (!replySuccess) {
        db.addLog('warn', 'facebook', `Live comment reply notice: ${fbRes.error}`);
      }
    } else {
      replySuccess = true;
      replyId = `sim_reply_${Date.now()}`;
    }

    // Mark replied in database
    db.markCommentReplied(commentId, message);
    db.addLog('success', 'facebook', `কমেন্ট রিপ্লে পাঠানো হয়েছে: "${message.substring(0, 50)}..."`);

    res.json({ success: true, replyId, repliedMessage: message });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle Comment Auto-Reply Bot
app.post('/api/comments/toggle-bot', (req, res) => {
  try {
    const { isActive, tone } = req.body;
    const updated = db.updateSettings({
      isAutoCommentReplyActive: isActive !== undefined ? isActive : true,
      autoCommentReplyTone: tone || 'islamic_warm',
    });
    db.addLog(
      'info',
      'system',
      `কমেন্ট অটো-রিপ্লাই বট ${isActive ? 'চালু' : 'বন্ধ'} করা হয়েছে। (টোন: ${tone || 'ইসলামিক'})`
    );
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. System Logs
app.get('/api/logs', (req, res) => {
  res.json({ success: true, logs: db.getLogs() });
});

// 12. Facebook Connection & Meta Graph API
app.post('/api/facebook/test', async (req, res) => {
  try {
    const { token, targetPageId, pageId } = req.body;
    const result = await testFacebookConnection(token, targetPageId || pageId);
    if (result.valid) {
      db.addLog('success', 'facebook', `Successfully connected Facebook user ${result.user?.name}. Found ${result.pages.length} managed page(s).`);
    } else {
      db.addLog('warn', 'facebook', `Facebook connection test failed: ${result.error}`);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

app.post('/api/facebook/save-page', (req, res) => {
  try {
    const { pageId, pageName, pageToken } = req.body;
    db.updateSettings({
      metaPageId: pageId,
      metaPageName: pageName,
      metaPageToken: pageToken,
      isMetaConnected: true,
    });
    db.addLog('success', 'facebook', `Selected primary Facebook Page: "${pageName}" (${pageId}).`);
    res.json({ success: true, settings: db.getSettings() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Supabase Schema SQL Export
app.get('/api/supabase/schema', (req, res) => {
  res.json({ success: true, sql: SUPABASE_SQL_SCHEMA });
});

// -------------------------------------------------------------------
// DEV MIDDLEWARE & PRODUCTION SERVING
// -------------------------------------------------------------------

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MoSaFa AI Auto Poster] Server running at http://localhost:${PORT}`);
    startBackgroundScheduler();
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[MoSaFa AI Auto Poster] Port ${PORT} is busy, retrying in 1s...`);
      setTimeout(() => {
        try {
          server.close();
        } catch (_) {}
        server.listen(PORT, '0.0.0.0');
      }, 1000);
    } else {
      console.error('[MoSaFa AI Auto Poster] Server error:', err);
    }
  });

  const handleShutdown = () => {
    stopBackgroundScheduler();
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal server boot error:', err);
});
