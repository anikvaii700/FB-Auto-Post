/**
 * Unicode Stylizer and Facebook Post Beautification Engine
 * Transforms ordinary plain text into aesthetically formatted, high-engagement Facebook posts
 */

// Mathematical Bold Unicode mappings
const BOLD_MAP: Record<string, string> = {
  a: '𝗮', b: '𝗯', c: '𝗰', d: '𝗱', e: '𝗲', f: '𝗳', g: '𝗴', h: '𝗵', i: '𝗶', j: '𝗷',
  k: '𝗸', l: '𝗹', m: '𝗺', n: '𝗻', o: '𝗼', p: '𝗽', q: '𝗾', r: '𝗿', s: '𝘀', t: '𝘁',
  u: '𝘂', v: '𝘃', w: '𝘄', x: '𝘅', y: '𝘆', z: '𝘇',
  A: '𝗔', B: '𝗕', C: '𝗖', D: '𝗗', E: '𝗘', F: '𝗙', G: '𝗚', H: '𝗛', I: '𝗜', J: '𝗝',
  K: '𝗞', L: '𝗟', M: '𝗠', N: '𝗡', O: '𝗢', P: '𝗣', Q: '𝗤', R: '𝗥', S: '𝗦', T: '𝗧',
  U: '𝗨', V: '𝗩', W: '𝗪', X: '𝗫', Y: '𝗬', Z: '𝗭',
  '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵',
};

const ITALIC_MAP: Record<string, string> = {
  a: '𝘢', b: '𝘣', c: '𝘤', d: '𝘥', e: '𝘦', f: '𝘧', g: '𝘨', h: '𝘩', i: '𝘪', j: '𝘫',
  k: '𝘬', l: '𝘭', m: '𝘮', n: '𝘯', o: '𝘰', p: '𝘱', q: '𝘲', r: '𝘳', s: '𝘴', t: '𝘵',
  u: '𝘶', v: '𝘷', w: '𝘸', x: '𝘹', y: '𝘺', z: '𝘻',
  A: '𝘈', B: '𝘉', C: '𝘊', D: '𝘋', E: '𝘌', F: '𝘍', G: '𝘎', H: '𝘏', I: '𝘐', J: '𝘑',
  K: '𝘒', L: '𝘓', M: '𝘔', N: '𝘕', O: '𝘖', P: '𝘗', Q: '𝘘', R: '𝘙', S: '𝘚', T: '𝘛',
  U: '𝘜', V: '𝘝', W: '𝘞', X: '𝘟', Y: '𝘠', Z: '𝘡',
};

export function toUnicodeBold(text: string): string {
  return text.split('').map((char) => BOLD_MAP[char] || char).join('');
}

export function toUnicodeItalic(text: string): string {
  return text.split('').map((char) => ITALIC_MAP[char] || char).join('');
}

export type PostDecorationStyle = 'islamic' | 'motivational' | 'poetic' | 'viral' | 'clean';

export interface BeautifyOptions {
  title?: string;
  body: string;
  hashtags?: string[];
  style?: PostDecorationStyle;
  pageName?: string;
}

/**
 * Builds a beautifully formatted Facebook status with decorative frames, quotes, and CTAs
 */
export function formatFullFacebookMessage(options: BeautifyOptions): string {
  const { title, body, hashtags = [], style = 'islamic', pageName = 'The Mosafa' } = options;

  let header = '';
  const cleanTitle = (title || '')
    .replace(/^[【「『\[★✨🌟💎\s]+|[】」』\]★✨🌟💎\s]+$/g, '')
    .trim();

  // Detect style if not explicitly set
  const isIslamicTopic = style === 'islamic' || /islamic|quran|hadith|ইস্তিগফার|আল্লাহ|নবী|সালাত|সবর|দোয়া|বরকত/i.test(`${cleanTitle} ${body}`);

  if (cleanTitle) {
    if (isIslamicTopic) {
      header = `﷽\n╔════════════════════════════════════╗\n   ✦ 🌙 【 ${cleanTitle} 】 🌙 ✦\n╚════════════════════════════════════╝\n\n`;
    } else if (style === 'poetic') {
      header = `╭─────────────── • ✧ • ───────────────╮\n│   🌿 『 ${cleanTitle} 』 🌿\n╰─────────────── • ✧ • ───────────────╯\n\n`;
    } else {
      header = `✨ ━━━━━━ ❖ ━━━━━━ ✨\n   🌟 ❝ ${cleanTitle} ❞ 🌟\n✨ ━━━━━━ ❖ ━━━━━━ ✨\n\n`;
    }
  }

  // Polish body lines with clean paragraphing
  let formattedBody = body.trim();

  // Add decorative quote marks if not present and body looks like a quote
  if (!formattedBody.includes('❝') && !formattedBody.includes('『') && formattedBody.length < 300) {
    // Only wrap if short
    // formattedBody = `❝ ${formattedBody} ❞`;
  }

  // Footer Call-To-Action & Branding
  let footer = '';
  const alreadyBranded = formattedBody.includes(pageName) || formattedBody.includes('The Mosafa');
  if (!alreadyBranded) {
    if (isIslamicTopic) {
      footer = `\n\n───────────────────────\n🤲 আল্লাহ আমাদের সবাইকে তাওফিক দান করুন। আমিন। 🤍\n📌 সদকায়ে জারিয়া হিসেবে বন্ধুদের সাথে শেয়ার করুন।\n🌸 দ্বীনি পোস্ট নিয়মিত পেতে ফলো করুন: @${pageName}`;
    } else if (style === 'poetic') {
      footer = `\n\n───────────────────────\n🕊️ প্রতিটি মুহূর্ত সুন্দর কাটুক, সৃষ্টিকর্তার শুকরিয়া আদায় করুন।\n❤️ ভালো লাগলে অবশ্যই শেয়ার করতে পারেন। 🌸\n✨ পাশেই থাকুন: @${pageName}`;
    } else {
      footer = `\n\n★━━━━━━━━━━━━━━━━━━━━★\n🎯 প্রতিদিনের সেরা অনুপ্রেরণা ও চিন্তার খোরাক পেতে ফলো করুন: @${pageName}\n📌 ভালো লাগলে বন্ধুদের সাথে শেয়ার করুন। 🤍\n💬 আপনার মতামত কমেন্টে জানান!`;
    }
  }

  // Format Hashtags
  let tagsFormatted = '';
  if (hashtags && hashtags.length > 0) {
    const formattedTags = hashtags.map((t) => (t.startsWith('#') ? t : `#${t}`));
    tagsFormatted = `\n\n🔖 ${formattedTags.join(' ')}`;
  }

  return `${header}${formattedBody}${footer}${tagsFormatted}`.trim();
}

/**
 * Apply presets directly to post draft
 */
export function applyStylePreset(
  currentText: string,
  style: 'islamic_frame' | 'motivational_frame' | 'quote_marks' | 'bold_english' | 'divider' | 'dua_closing'
): string {
  switch (style) {
    case 'islamic_frame': {
      return `﷽\n╔════════════════════════════════════╗\n   ✦ 🌙 【 শিরোনাম এখানে লিখুন 】 🌙 ✦\n╚════════════════════════════════════╝\n\n${currentText}\n\n───────────────────────\n🤲 আল্লাহ আমাদের সবাইকে নেক আমল করার তাওফিক দান করুন। আমিন। 🤍\n📌 সদকায়ে জারিয়া হিসেবে পোস্টটি শেয়ার করুন।\n🌸 পেজটি ফলো করে সাথেই থাকুন: @The Mosafa`;
    }
    case 'motivational_frame': {
      return `✨ ━━━━━━ ❖ ━━━━━━ ✨\n   🌟 ❝ শিরোনাম এখানে লিখুন ❞ 🌟\n✨ ━━━━━━ ❖ ━━━━━━ ✨\n\n${currentText}\n\n★━━━━━━━━━━━━━━━━━━━━★\n🎯 লক্ষ্য স্থির রাখুন, চেষ্টা চালিয়ে যান!\n📌 ভালো লাগলে বন্ধুদের অনুপ্রেরণা দিতে শেয়ার করুন। 🤍\n💬 আপনার মতামত কমেন্টে লিখুন।`;
    }
    case 'quote_marks': {
      return `❝ ${currentText.trim()} ❞`;
    }
    case 'bold_english': {
      // Find English words and convert to Unicode Bold
      return currentText.replace(/[A-Za-z0-9]+/g, (match) => toUnicodeBold(match));
    }
    case 'divider': {
      return `${currentText}\n\n✨ ━━━━━━ ❖ ━━━━━━ ✨\n\n`;
    }
    case 'dua_closing': {
      return `${currentText}\n\n───────────────────────\n🤲 আল্লাহ আমাদের সকল নেক দোয়া কবুল করুন। আমিন। 🤍`;
    }
    default:
      return currentText;
  }
}
