import { db } from './db.ts';
import { publishPostToFacebook } from './facebook.ts';
import { generatePostsWithAI } from './gemini.ts';

let schedulerInterval: NodeJS.Timeout | null = null;
let isProcessing = false;

/**
 * Start the independent background publishing and auto-generation worker
 */
export function startBackgroundScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  console.log('[MoSaFa Scheduler] Initializing independent background worker...');
  db.addLog('info', 'scheduler', 'Background publishing scheduler started. Checking queue every 25 seconds.');

  // Run first check after 3 seconds
  setTimeout(runSchedulerTick, 3000);

  // Periodic interval every 25 seconds
  schedulerInterval = setInterval(runSchedulerTick, 25000);
}

export function stopBackgroundScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    db.addLog('info', 'scheduler', 'Background publishing scheduler stopped.');
  }
}

/**
 * Main Scheduler Tick
 */
async function runSchedulerTick() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const settings = db.getSettings();
    if (!settings.isAutomationActive) {
      isProcessing = false;
      return;
    }

    const now = new Date();
    const posts = db.getPosts();

    // 1. Process Due Posts
    const duePosts = posts.filter(
      (p) => p.status === 'scheduled' && new Date(p.scheduledAt) <= now
    );

    for (const post of duePosts) {
      db.addLog('info', 'scheduler', `Processing scheduled post "${post.title || post.id}"...`);

      const result = await publishPostToFacebook({
        post,
        pageToken: settings.metaPageToken,
        pageId: settings.metaPageId,
      });

      if (result.success) {
        post.status = 'published';
        post.publishedAt = new Date().toISOString();
        post.facebookPostId = result.postId;
        post.facebookPermalink = result.permalink;
        post.errorMsg = undefined;
        db.savePost(post);

        const simNotice = result.isSimulated ? ' (Simulated - Live FB token not set)' : ' (Live Facebook Page)';
        db.addLog(
          'success',
          'facebook',
          `Successfully published post "${post.title || post.id}" to ${settings.metaPageName || 'Facebook'}${simNotice}`,
          JSON.stringify({ postId: result.postId, permalink: result.permalink })
        );
      } else {
        post.retryCount = (post.retryCount || 0) + 1;
        post.errorMsg = result.error;
        if (post.retryCount >= 3) {
          post.status = 'failed';
          db.addLog(
            'error',
            'facebook',
            `Post "${post.title || post.id}" failed after 3 attempts: ${result.error}`
          );
        } else {
          // Delay next retry by 5 minutes
          post.scheduledAt = new Date(Date.now() + 1000 * 60 * 5).toISOString();
          db.addLog(
            'warn',
            'scheduler',
            `Post retry #${post.retryCount} scheduled for "${post.title || post.id}": ${result.error}`
          );
        }
        db.savePost(post);
      }
    }

    // 2. Auto-generate ahead of time if queue is low
    await checkAndAutoAdvanceQueue(settings);
  } catch (err: any) {
    console.error('[MoSaFa Scheduler] Error in tick:', err);
    db.addLog('error', 'scheduler', `Scheduler tick error: ${err.message}`);
  } finally {
    isProcessing = false;
  }
}

/**
 * Check if queue needs auto-generation ahead of time
 */
async function checkAndAutoAdvanceQueue(settings: ReturnType<typeof db.getSettings>) {
  // Only auto-advance if enabled and Mode is Auto Publish
  if (settings.publishingMode !== 'auto') {
    return;
  }

  const posts = db.getPosts();
  const now = Date.now();
  const advanceWindowMs = (settings.autoAdvanceHours || 8) * 60 * 60 * 1000;

  // Upcoming scheduled posts in next X hours
  const upcomingPosts = posts.filter(
    (p) =>
      (p.status === 'scheduled' || p.status === 'pending') &&
      new Date(p.scheduledAt).getTime() > now &&
      new Date(p.scheduledAt).getTime() <= now + advanceWindowMs
  );

  // If we have fewer than 2 upcoming posts, automatically generate the next scheduled one!
  if (upcomingPosts.length < 2) {
    const activeCategories = db.getCategories().filter((c) => c.isActive);
    if (activeCategories.length === 0) return;

    // Pick next category
    const category = activeCategories[Math.floor(Math.random() * activeCategories.length)];
    db.addLog(
      'info',
      'ai',
      `Auto-advancing content queue: Triggering AI generation for category "${category.name}" ahead of time.`
    );

    try {
      const recentBodies = posts.slice(0, 5).map((p) => p.body);
      const generated = await generatePostsWithAI({
        category,
        count: 1,
        language: category.language === 'both' ? 'bn' : category.language,
        recentPostBodies: recentBodies,
      });

      if (generated && generated.length > 0) {
        const item = generated[0];
        // Calculate appropriate schedule time (e.g. 2 to 4 hours from now)
        const scheduledTime = new Date(now + 1000 * 60 * 60 * 3).toISOString();

        // Check if category has an image preset
        const libraryImages = db.getImages();
        const matchingImg = libraryImages.find(
          (img) => img.category?.toLowerCase() === category.name.toLowerCase()
        );

        const newPost: any = {
          id: `post_auto_${Date.now()}`,
          title: item.title,
          body: item.body,
          hashtags: item.hashtags,
          categoryId: category.id,
          categoryName: category.name,
          language: item.language,
          status: 'scheduled',
          approvalMode: 'auto',
          scheduledAt: scheduledTime,
          imageUrl: matchingImg?.url,
          imagePrompt: item.suggestedImagePrompt,
          imageSource: matchingImg ? 'ai' : 'none',
          retryCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.savePost(newPost);
        db.addLog(
          'success',
          'ai',
          `Auto-generated post "${newPost.title}" scheduled for ${new Date(scheduledTime).toLocaleTimeString('en-US', { timeZone: settings.defaultTimezone })}`
        );
      }
    } catch (aiErr: any) {
      db.addLog('warn', 'ai', `Auto-generation failed: ${aiErr.message}`);
    }
  }
}
