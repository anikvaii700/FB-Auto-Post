import { PostItem } from '../src/types.ts';

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
      const pageDirectRes = await fetch(`https://graph.facebook.com/v19.0/${cleanPageId}?fields=id,name,category,link&access_token=${encodeURIComponent(cleanToken)}`);
      const pageDirectData = await pageDirectRes.json();
      if (pageDirectData.id && pageDirectData.name && !pageDirectData.error) {
        return {
          valid: true,
          user: { id: pageDirectData.id, name: pageDirectData.name },
          pages: [{
            id: pageDirectData.id,
            name: pageDirectData.name,
            access_token: cleanToken,
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
export async function publishPostToFacebook(params: {
  post: PostItem;
  pageToken?: string;
  pageId?: string;
}): Promise<PublishResult> {
  const { post, pageToken, pageId } = params;

  // Build complete message
  const fullMessage = [
    post.title ? `【 ${post.title} 】\n` : '',
    post.body,
    post.hashtags && post.hashtags.length > 0 ? `\n\n${post.hashtags.join(' ')}` : '',
  ]
    .filter(Boolean)
    .join('');

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

  try {
    let url: string;
    let body: any;

    if (post.imageUrl && (post.imageUrl.startsWith('http://') || post.imageUrl.startsWith('https://'))) {
      // Photo post via Graph API
      url = `https://graph.facebook.com/v19.0/${pageId}/photos`;
      body = {
        url: post.imageUrl,
        caption: fullMessage,
        access_token: pageToken,
      };
    } else {
      // Text / Status post via Graph API
      url = `https://graph.facebook.com/v19.0/${pageId}/feed`;
      body = {
        message: fullMessage,
        access_token: pageToken,
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
