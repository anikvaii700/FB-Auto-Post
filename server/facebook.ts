import fs from 'fs';
import path from 'path';
import { PostItem } from '../src/types.ts';
import { formatFullFacebookMessage } from '../src/utils/textFormatter.ts';

export interface MetaPageInfo {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  tasks?: string[];
  link?: string;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  permalink?: string;
  isSimulated?: boolean;
  error?: string;
}

/**
 * Test Facebook Token & fetch managed pages
 */
export async function testFacebookConnection(token: string, targetPageId?: string): Promise<{
  valid: boolean;
  user?: { id: string; name: string };
  pages: MetaPageInfo[];
  error?: string;
}> {
  if (!token || token.trim().length < 10) {
    return {
      valid: false,
      pages: [],
      error: 'Access token is empty or too short. Please provide a valid Meta Graph API User or Page Access Token.',
    };
  }

  const cleanToken = token.trim();

  try {
    // If targetPageId provided, test page endpoint directly first or in parallel
    if (targetPageId && targetPageId.trim().length > 3) {
      const cleanPageId = targetPageId.trim();
      const pageDirectRes = await fetch(
        `https://graph.facebook.com/v19.0/${cleanPageId}?fields=id,name,category,link,access_token&access_token=${encodeURIComponent(cleanToken)}`
      );
      const pageDirectData = await pageDirectRes.json();
      if (pageDirectData.id && pageDirectData.name && !pageDirectData.error) {
        const truePageToken = pageDirectData.access_token || cleanToken;
        return {
          valid: true,
          user: { id: pageDirectData.id, name: pageDirectData.name },
          pages: [{
            id: pageDirectData.id,
            name: pageDirectData.name,
            access_token: truePageToken,
            category: pageDirectData.category,
            link: pageDirectData.link,
          }],
        };
      }
    }

    // 1. Fetch user identity
    const userRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${encodeURIComponent(cleanToken)}`);
    const userData = await userRes.json();

    if (userData.error) {
      // Check if this token is directly a Page token
      const meBasicRes = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${encodeURIComponent(cleanToken)}`);
      const meBasicData = await meBasicRes.json();
      if (meBasicData.id && !meBasicData.error) {
        return {
          valid: true,
          user: { id: meBasicData.id, name: meBasicData.name || 'Facebook Page' },
          pages: [{
            id: meBasicData.id,
            name: meBasicData.name || 'Facebook Page',
            access_token: cleanToken,
          }],
        };
      }

      if (userData.error.message?.includes('pages_read_engagement') || userData.error.message?.includes('pages_manage_posts')) {
        return {
          valid: false,
          pages: [],
          error: "টোকেনে 'pages_read_engagement' বা 'pages_manage_posts' পারমিশনটি যুক্ত নেই। Meta Developer ড্যাশবোর্ডে গিয়ে এই পারমিশন দুটি যোগ করতে হবে।",
        };
      }
      return {
        valid: false,
        pages: [],
        error: userData.error.message || 'Invalid Facebook Access Token',
      };
    }

    // 2. Fetch pages the user manages
    const accountsRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,category,tasks&access_token=${encodeURIComponent(token)}`
    );
    const accountsData = await accountsRes.json();

    const pages: MetaPageInfo[] = [];
    if (accountsData.data && Array.isArray(accountsData.data)) {
      accountsData.data.forEach((p: any) => {
        pages.push({
          id: p.id,
          name: p.name,
          access_token: p.access_token || token,
          category: p.category,
          tasks: p.tasks,
        });
      });
    } else {
      // Maybe the token provided was already a Page Access Token!
      const pageRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,category,link&access_token=${encodeURIComponent(token)}`);
      const pageData = await pageRes.json();
      if (pageData.id && pageData.name) {
        pages.push({
          id: pageData.id,
          name: pageData.name,
          access_token: token,
          category: pageData.category,
          link: pageData.link,
        });
      }
    }

    return {
      valid: true,
      user: { id: userData.id, name: userData.name },
      pages,
    };
  } catch (err: any) {
    return {
      valid: false,
      pages: [],
      error: err.message || 'Network error reaching Graph API',
    };
  }
}

/**
 * Publish post to a Facebook Page via Meta Graph API
 */
/**
 * Helper to resolve local image file or base64 data URI to a Buffer
 */
function resolveImageToBuffer(imageUrl?: string): { buffer: Buffer; mimeType: string } | null {
  if (!imageUrl) return null;

  try {
    // 1. Data URI: data:image/png;base64,...
    if (imageUrl.startsWith('data:image/')) {
      const parts = imageUrl.split(',');
      const match = parts[0].match(/data:(image\/[a-zA-Z+]+);base64/);
      const mimeType = match ? match[1] : 'image/jpeg';
      const buffer = Buffer.from(parts[1], 'base64');
      return { buffer, mimeType };
    }

    // 2. Local relative or absolute path
    const cleanPath = imageUrl.replace(/^\/+/, '');
    const candidates = [
      path.resolve(process.cwd(), cleanPath),
      path.resolve(process.cwd(), 'public', cleanPath),
      path.resolve(process.cwd(), 'src', cleanPath),
      path.resolve(process.cwd(), cleanPath.replace(/^src\//, '')),
      path.resolve(process.cwd(), cleanPath.replace(/^public\//, '')),
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        const ext = path.extname(cand).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.webp') mimeType = 'image/webp';
        return { buffer: fs.readFileSync(cand), mimeType };
      }
    }
  } catch (err) {
    console.warn('[Facebook Helper] Error reading image buffer:', err);
  }
  return null;
}

/**
 * Resolves the genuine Page Access Token.
 * If user passed a User Token or an unverified token, this queries `/{pageId}?fields=access_token`
 * to extract the true Page token so photo posts never trigger (#200) publish_actions errors.
 */
export async function getOrResolvePageAccessToken(token: string, pageId: string): Promise<string> {
  if (!token || !pageId) return token;
  const cleanToken = token.trim();
  const cleanPageId = pageId.trim();

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${cleanPageId}?fields=access_token,name&access_token=${encodeURIComponent(cleanToken)}`
    );
    const data = await res.json();
    if (data.access_token) {
      console.log(`[Facebook Helper] Successfully verified/retrieved Page Access Token for "${data.name || cleanPageId}".`);
      return data.access_token;
    }
  } catch (err) {
    console.warn('[Facebook Helper] Failed to query page token, proceeding with supplied token:', err);
  }
  return cleanToken;
}

/**
 * Publish post to a Facebook Page via Meta Graph API
 * Supports photo posts with binary file upload, scenic background attachments, and aesthetic typography
 * Falls back gracefully to text feed post if photo endpoint is rejected or permissions are constrained.
 */
export async function publishPostToFacebook(params: {
  post: PostItem;
  pageToken?: string;
  pageId?: string;
  pageName?: string;
}): Promise<PublishResult> {
  const { post, pageToken, pageId, pageName = 'The Mosafa' } = params;

  // Build aesthetically formatted and decorated status text
  const fullMessage = formatFullFacebookMessage({
    title: post.title,
    body: post.body,
    hashtags: post.hashtags,
    pageName,
  });

  // If no live Facebook Page credentials configured, return a safe simulated publish
  if (!pageToken || !pageId) {
    const simId = `sim_fb_${Date.now()}_${Math.floor(Math.random() * 89999 + 10000)}`;
    return {
      success: true,
      postId: simId,
      permalink: `https://www.facebook.com/permalink.php?story_fbid=${simId}&id=${pageId || '1029384756'}`,
      isSimulated: true,
    };
  }

  // Ensure we are using the authentic Page Access Token for this Page
  const activeToken = await getOrResolvePageAccessToken(pageToken, pageId);

  try {
    // 1. Check if post has a local image or remote image
    let localImage = resolveImageToBuffer(post.imageUrl);
    const isRemoteUrl = post.imageUrl && (post.imageUrl.startsWith('http://') || post.imageUrl.startsWith('https://'));

    // 2. If no image is provided, automatically provide a high-quality default background
    if (!localImage && !isRemoteUrl) {
      const isIslamic = /islamic|quran|hadith|ইস্তিগফার|আল্লাহ|দোয়া/i.test(`${post.categoryId} ${post.categoryName} ${post.body}`);
      const fallbackPath = isIslamic
        ? '/src/assets/images/social_islamic_bg_1794224545916.jpg'
        : '/src/assets/images/social_nature_bg_1794224545379.jpg';
      localImage = resolveImageToBuffer(fallbackPath);
    }

    // 3A. Binary Upload to Facebook Graph API /photos (Local File or Base64 Data URI)
    if (localImage) {
      try {
        const formData = new FormData();
        const ext = localImage.mimeType === 'image/png' ? 'png' : 'jpg';
        const uint8 = new Uint8Array(localImage.buffer);
        formData.append(
          'source',
          new Blob([uint8], { type: localImage.mimeType }),
          `mosafa_post_${Date.now()}.${ext}`
        );
        formData.append('caption', fullMessage);
        formData.append('access_token', activeToken);

        const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!data.error && (data.id || data.post_id)) {
          const returnedId = data.id || data.post_id;
          return {
            success: true,
            postId: returnedId,
            permalink: `https://www.facebook.com/${returnedId}`,
            isSimulated: false,
          };
        }

        console.warn(`[Facebook Helper] Photo upload failed with [${data.error?.code}]: ${data.error?.message}. Attempting fallback to text feed...`);
      } catch (uploadErr) {
        console.warn('[Facebook Helper] Exception during photo upload, falling back to feed:', uploadErr);
      }
    }

    // 3B. Remote Image URL Upload to /photos
    if (isRemoteUrl) {
      try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: post.imageUrl,
            caption: fullMessage,
            access_token: activeToken,
          }),
        });

        const data = await res.json();
        if (!data.error && (data.id || data.post_id)) {
          const returnedId = data.id || data.post_id;
          return {
            success: true,
            postId: returnedId,
            permalink: `https://www.facebook.com/${returnedId}`,
            isSimulated: false,
          };
        }

        console.warn(`[Facebook Helper] Remote photo URL upload failed with [${data.error?.code}]: ${data.error?.message}. Attempting fallback to text feed...`);
      } catch (remoteErr) {
        console.warn('[Facebook Helper] Exception during remote photo upload, falling back to feed:', remoteErr);
      }
    }

    // 3C. Feed Post (Text + Emojis + Typography) - guaranteed fallback
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: fullMessage,
        access_token: activeToken,
      }),
    });

    const data = await res.json();
    if (data.error) {
      return {
        success: false,
        error: `Meta Graph API Error [${data.error.code}]: ${data.error.message}`,
      };
    }

    const returnedId = data.id || data.post_id;
    return {
      success: true,
      postId: returnedId,
      permalink: `https://www.facebook.com/${returnedId}`,
      isSimulated: false,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network error publishing to Facebook: ${err.message}`,
    };
  }
}

/**
 * Fetch comments on a specific Facebook Post
 */
export async function fetchFacebookPostComments(postId: string, pageToken: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${postId}/comments?fields=id,message,from,created_time&limit=25&access_token=${encodeURIComponent(pageToken)}`
    );
    const data = await res.json();
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
  } catch (err) {
    console.warn(`[Facebook Comments] Error fetching comments for ${postId}:`, err);
  }
  return [];
}

/**
 * Reply to a Facebook Comment via Graph API
 */
export async function replyToFacebookComment(
  commentId: string,
  message: string,
  pageToken: string
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${commentId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: pageToken,
      }),
    });
    const data = await res.json();
    if (data.id) {
      return { success: true, replyId: data.id };
    }
    return {
      success: false,
      error: data.error?.message || 'Meta Comment Reply Error',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error replying to comment',
    };
  }
}
