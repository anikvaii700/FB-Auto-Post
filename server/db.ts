import fs from 'fs';
import path from 'path';
import { AdminSettings, Category, CommandHistoryItem, LibraryImage, PostItem, SystemLog } from '../src/types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'mosafa_db.json');

export interface DatabaseState {
  settings: AdminSettings;
  categories: Category[];
  posts: PostItem[];
  commands: CommandHistoryItem[];
  images: LibraryImage[];
  logs: SystemLog[];
}

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat_islamic_reminder',
    name: 'Islamic Reminders',
    nameBn: 'ইসলামিক নসিহত ও রিমাইন্ডার',
    description: 'দৈনন্দিন জীবনে আল্লাহর স্মরণ, আখিরাতের চিন্তা, তওবা ও ইস্তিগফারের অনুপ্রেরণামূলক কথা।',
    style: 'Spiritual, Emotional & Reverent',
    tone: 'Heart-touching, Gentle, Inspiring',
    audience: 'Bengali Muslims seeking inner peace and spiritual mindfulness',
    language: 'bn',
    preferredLength: 'medium',
    hashtagRules: ['#IslamicReminder', '#ইস্তিগফার', '#আল্লাহর_স্মরণ', '#দ্বীনি_কথা', '#Faith'],
    contentInstructions: 'সহীহ সূত্রভিত্তিক কথা বলুন। তওবা, ক্ষমা, সবর, শোকর এবং আল্লাহর রহমতের কথা সুন্দর বাংলা ভাষায় তুলে ধরুন। কোনো বিতর্কিত বিষয় নয়।',
    imagePreferences: 'always',
    dailyPosts: 3,
    scheduleTimes: ['09:00', '14:00', '20:30'],
    isActive: true,
    color: '#059669', // Emerald
  },
  {
    id: 'cat_quran_hadith',
    name: 'Quran & Hadith Education',
    nameBn: 'কুরআন ও হাদিস শিক্ষা',
    description: 'সহীহ হাদিস ও কুরআনের আয়াতের সহজ বাংলা অর্থ, ব্যাখ্যা ও বাস্তব শিক্ষা।',
    style: 'Educational, Authentic & Reverent',
    tone: 'Wise, Scholarly yet Accessible',
    audience: 'General learners desiring authentic Islamic knowledge',
    language: 'bn',
    preferredLength: 'medium',
    hashtagRules: ['#QuranVerse', '#Hadith', '#কুরআনের_আলো', '#হাদিসের_শিক্ষা', '#Sunnah'],
    contentInstructions: 'আয়াতের সূরা ও আয়াত নম্বর এবং হাদিসের সুনির্দিষ্ট কিতাব (বুখারী/মুসলিম/তিরমিযী ইত্যাদি) নম্বর উল্লেখ বাধ্যতামূলক। কোনো মিথ্যা বা দুর্বল রেওয়ায়েত পরিহার করতে হবে।',
    imagePreferences: 'optional',
    dailyPosts: 2,
    scheduleTimes: ['07:30', '17:00'],
    isActive: true,
    color: '#0d9488', // Teal
  },
  {
    id: 'cat_islamic_stories',
    name: 'Islamic Stories',
    nameBn: 'ইসলামের শিক্ষণীয় গল্প',
    description: 'নবী-রাসূলগণ ও সাহাবায়ে কেরামের জীবনের শিক্ষণীয় ও প্রেরণাদায়ক ঘটনা।',
    style: 'Narrative & Heartfelt Storytelling',
    tone: 'Engaging, Touching, Thought-provoking',
    audience: 'All age groups, youth and family',
    language: 'bn',
    preferredLength: 'story',
    hashtagRules: ['#IslamicStory', '#সাহাবাদের_জীবন', '#শিক্ষণীয়_গল্প', '#LifeOfSahaba'],
    contentInstructions: 'ঘটনাটি আকর্ষণীয় সূচনায় শুরু করুন, বাস্তব জীবনের সাথে মিলিয়ে শেষ করুন। শিক্ষণীয় পয়েন্ট বুলেট আকারে দিন।',
    imagePreferences: 'optional',
    dailyPosts: 1,
    scheduleTimes: ['21:00'],
    isActive: true,
    color: '#0284c7', // Sky
  },
  {
    id: 'cat_motivational',
    name: 'Motivational Posts',
    nameBn: 'আত্মউন্নয়ন ও অনুপ্রেরণা',
    description: 'কঠোর পরিশ্রম, ধৈর্য, লক্ষ্য অর্জন ও মানসিক শক্তি বৃদ্ধির মোটিভেশনাল পোস্ট।',
    style: 'Energetic, Practical & Uplifting',
    tone: 'Empowering, Direct, High Energy',
    audience: 'Youth, students, professionals, entrepreneurs',
    language: 'bn',
    preferredLength: 'medium',
    hashtagRules: ['#Motivation', '#অনুপ্রেরণা', '#সফলতা', '#HardWork', '#Mindset'],
    contentInstructions: 'বাস্তব জীবনের চ্যালেঞ্জ, ব্যর্থতা থেকে ঘুরে দাঁড়ানো এবং ইতিবাচক মানসিকতার কথা জোর দিয়ে লিখুন।',
    imagePreferences: 'always',
    dailyPosts: 2,
    scheduleTimes: ['08:00', '19:00'],
    isActive: true,
    color: '#d97706', // Amber
  },
  {
    id: 'cat_inspirational_quotes',
    name: 'Inspirational Quotes',
    nameBn: 'বাছাইকৃত উক্তি ও চিন্তা',
    description: 'মননশীল মনীষী ও জীবনের গভীর উপলব্ধি থেকে নেওয়া সংক্ষেপ ভাবগম্ভীর উক্তি।',
    style: 'Minimalist & Profound',
    tone: 'Philosophical, Sharp, Memorable',
    audience: 'Deep thinkers, avid readers, social media audience',
    language: 'bn',
    preferredLength: 'short',
    hashtagRules: ['#Quotes', '#বাছাইকৃত_উক্তি', '#Wisdom', '#LifeQuotes'],
    contentInstructions: '১-৩ লাইনের শক্তিশালী উক্তি। নিচে ছোট ব্যাখ্যা বা চিন্তার খোরাক দিন।',
    imagePreferences: 'always',
    dailyPosts: 2,
    scheduleTimes: ['11:00', '22:00'],
    isActive: true,
    color: '#7c3aed', // Purple
  },
  {
    id: 'cat_educational',
    name: 'Educational Content',
    nameBn: 'জ্ঞানমূলক ও জীবন দক্ষতা',
    description: 'দৈনন্দিন জীবনের প্রয়োজনীয় জ্ঞান, ক্যারিয়ার টিপস, রিডিং হ্যাবিট ও স্কিল ডেভেলপমেন্ট।',
    style: 'Actionable & Structured',
    tone: 'Informative, Encouraging, Clear',
    audience: 'Learners, students, lifelong learners',
    language: 'bn',
    preferredLength: 'long',
    hashtagRules: ['#Education', '#শিক্ষা', '#SkillDevelopment', '#SelfGrowth', '#Learning'],
    contentInstructions: 'পয়েন্ট আকারে ৩-৫টি কার্যকরী পরামর্শ দিন যা পাঠক সাথে সাথে প্রয়োগ করতে পারে।',
    imagePreferences: 'optional',
    dailyPosts: 1,
    scheduleTimes: ['15:00'],
    isActive: true,
    color: '#2563eb', // Blue
  },
  {
    id: 'cat_funny_entertainment',
    name: 'Funny & Entertainment',
    nameBn: 'রম্য ও নির্মল বিনোদন',
    description: 'বাঙালি জীবনের দৈনন্দিন হাসি-ঠাট্টা, পারিবারিক মজার মুহূর্ত ও নির্ভেজাল আনন্দ।',
    style: 'Humorous, Relatable & Clean',
    tone: 'Playful, Light-hearted, Witty',
    audience: 'Broad social audience looking for a smile',
    language: 'bn',
    preferredLength: 'short',
    hashtagRules: ['#Comedy', '#রম্য', '#হাসির_পোস্ট', '#BengaliHumor', '#Relatable'],
    contentInstructions: 'সম্পূর্ণ শালীন ও নির্মল কৌতুক বা রিলেটেবল পরিস্থিতি। কোনো ব্যক্তিআক্রমণ বা অশালীনতা নয়।',
    imagePreferences: 'optional',
    dailyPosts: 1,
    scheduleTimes: ['16:30'],
    isActive: true,
    color: '#ec4899', // Pink
  },
  {
    id: 'cat_relationship_family',
    name: 'Relationship & Family',
    nameBn: 'পারিবারিক সম্পর্ক ও দাম্পত্য',
    description: 'বাবা-মা, সন্তান, ভাই-বোন ও দাম্পত্য জীবনে পারস্পরিক ভালোবাসা, সম্মান ও বোঝাপড়া।',
    style: 'Warm, Compassionate & Wise',
    tone: 'Gentle, Empathic, Values-driven',
    audience: 'Couples, parents, youth and elders',
    language: 'bn',
    preferredLength: 'medium',
    hashtagRules: ['#FamilyFirst', '#পারিবারিক_বন্ধন', '#সম্পর্ক', '#Parenting', '#Love'],
    contentInstructions: 'ছোট ছোট ভুলের কারণে সম্পর্ক কীভাবে নষ্ট হয় এবং কীভাবে ক্ষমা ও যত্নের মাধ্যমে তা বাঁচানো যায় তা তুলে ধরুন।',
    imagePreferences: 'optional',
    dailyPosts: 1,
    scheduleTimes: ['12:30'],
    isActive: true,
    color: '#f43f5e', // Rose
  },
  {
    id: 'cat_business_marketing',
    name: 'Business & Marketing',
    nameBn: 'ব্যবসা ও ক্যারিয়ার গ্রোথ',
    description: 'ক্ষুদ্র উদ্যোক্তা, ফ্রিল্যান্সিং, অনলাইন ব্যবসা ও কাস্টমার রিলেশনশিপ টিপস।',
    style: 'Professional & Strategic',
    tone: 'Insightful, Pragmatic, Results-oriented',
    audience: 'Entrepreneurs, shop owners, freelancers',
    language: 'both',
    preferredLength: 'medium',
    hashtagRules: ['#BusinessTips', '#উদ্যোক্তা', '#MarketingStrategy', '#StartupBD', '#SalesGrowth'],
    contentInstructions: 'বাস্তবসম্মত সেলস বা ব্র্যান্ডিং স্ট্র্যাটেজি বাংলায় সহজ ভাষায় বুঝিয়ে দিন।',
    imagePreferences: 'optional',
    dailyPosts: 1,
    scheduleTimes: ['18:30'],
    isActive: true,
    color: '#0891b2', // Cyan
  },
  {
    id: 'cat_bangladesh',
    name: 'Bangladesh Stories & Pride',
    nameBn: 'আমাদের বাংলাদেশ ও ঐতিহ্য',
    description: 'গ্রাম-বাংলার অপরূপ সৌন্দর্য, সংস্কৃতি, ঐতিহ্য, দেশপ্রেম ও অনুপ্রেরণামূলক অর্জন।',
    style: 'Nostalgic, Vivid & Patriotic',
    tone: 'Proud, Scenic, Evocative',
    audience: 'All Bangladeshis at home and abroad',
    language: 'bn',
    preferredLength: 'medium',
    hashtagRules: ['#Bangladesh', '#আমার_বাংলাদেশ', '#BeautyOfBengal', '#DeshPrem'],
    contentInstructions: 'নদীমাতৃক দেশের রূপ, ঋতুবৈচিত্র্য এবং মেহনতি মানুষের ইতিবাচক গল্প তুলুন।',
    imagePreferences: 'always',
    dailyPosts: 1,
    scheduleTimes: ['10:30'],
    isActive: true,
    color: '#15803d', // Green
  },
  {
    id: 'cat_social_awareness',
    name: 'Social Awareness',
    nameBn: 'সামাজিক সচেতনতা',
    description: 'যানজট, পরিবেশ পরিচ্ছন্নতা, সাইবার নিরাপত্তা, মানুষের প্রতি সহমর্মিতা ও নাগরিক দায়িত্ব।',
    style: 'Civic-minded & Constructive',
    tone: 'Serious, Constructive, Call to Action',
    audience: 'Responsible citizens of all ages',
    language: 'bn',
    preferredLength: 'medium',
    hashtagRules: ['#SocialAwareness', '#সচেতনতা', '#CivicDuty', '#BetterSociety'],
    contentInstructions: 'সমস্যার পাশাপাশি সমাধান এবং ব্যক্তিগত উদ্যোগে কী করা যায় তা উল্লেখ করুন।',
    imagePreferences: 'optional',
    dailyPosts: 1,
    scheduleTimes: ['13:00'],
    isActive: true,
    color: '#475569', // Slate
  },
];

const DEFAULT_SETTINGS: AdminSettings = {
  adminPin: '1234',
  isAutomationActive: true,
  publishingMode: 'approval_required', // Start in approval mode for safety as requested
  defaultTimezone: 'Asia/Dhaka',
  dailyPostingCount: 3,
  preferredLanguage: 'bn',
  geminiModel: 'gemini-3.8-flash',
  metaAppId: '',
  metaAppSecret: '',
  metaUserToken: '',
  metaPageToken: '',
  metaPageId: '',
  metaPageName: 'MoSaFa Official Page (Demo / Connect to Live)',
  isMetaConnected: false,
  supabaseUrl: '',
  supabaseAnonKey: '',
  isSupabaseConfigured: false,
  notifyOnPublish: true,
  autoAdvanceHours: 8,
};

const DEFAULT_IMAGES: LibraryImage[] = [
  {
    id: 'img_brand_1',
    url: '/src/assets/images/mosafa_brand_symbol_1794224544537.jpg',
    title: 'MoSaFa Brand Emblem',
    aspectRatio: '1:1',
    category: 'Brand',
    createdAt: new Date().toISOString(),
    type: 'preset',
  },
  {
    id: 'img_islamic_1',
    url: '/src/assets/images/social_islamic_bg_1794224545916.jpg',
    title: 'Serene Islamic Courtyard',
    prompt: 'Serene Islamic architectural background with subtle arabesque geometric arches, soft ambient golden hour lantern glow',
    aspectRatio: '16:9',
    category: 'Islamic',
    createdAt: new Date().toISOString(),
    type: 'preset',
  },
  {
    id: 'img_magenta_wave',
    url: '/assets/aistudio/image_0add04d7.png',
    title: 'MoSaFa Fluid Magenta Wave',
    prompt: 'Fluid magenta organic curves on deep navy background with minimalist white ribbon waves',
    aspectRatio: '16:9',
    category: 'Brand Theme',
    createdAt: new Date().toISOString(),
    type: 'preset',
  },
  {
    id: 'img_nature_1',
    url: '/src/assets/images/social_nature_bg_1794224545379.jpg',
    title: 'Bangladesh River Morning Mist',
    prompt: 'Lush peaceful Bangladesh riverbank morning mist with blooming water lilies and golden sunrise',
    aspectRatio: '16:9',
    category: 'Bangladesh',
    createdAt: new Date().toISOString(),
    type: 'preset',
  },
];

const DEFAULT_POSTS: PostItem[] = [
  {
    id: 'post_demo_1',
    title: 'ইস্তিগফারের অলৌকিক শক্তি',
    body: `রাসূলুল্লাহ সাল্লাল্লাহু আলাইহি ওয়া সাল্লাম বলেছেন:\n"যে ব্যক্তি নিয়মিত ইস্তিগফার করবে, আল্লাহ তার প্রতিটি সংকট থেকে উত্তরণের পথ বের করে দেবেন, সমস্ত দুশ্চিন্তা দূর করে দেবেন এবং তাকে এমন উৎস থেকে রিজিক দান করবেন যা সে কল্পনাও করতে পারেনি।" (আবু দাউদ: ১৫১৮)\n\nহৃদয় যখন ভারাক্রান্ত হয়ে ওঠে, যখন চারপাশের পথ বন্ধ মনে হয়, তখন আন্তরিকভাবে বলুন:\n"আস্তাগফিরুল্লাহাল্লাজি লা ইলাহা ইল্লা হুয়াল হাইয়্যুল কাইয়্যুমু ওয়া আতূবু ইলাইহ।"\n\nতওবা শুধু অতীতের পাপ মোচন করে না, বরং আপনার আগামী দিনের জন্য আল্লাহর অফুরন্ত রহমতের দরজা উন্মুক্ত করে দেয়।`,
    hashtags: ['#ইস্তিগফার', '#IslamicReminder', '#আল্লাহর_রহমত', '#তাওবা', '#PeaceOfMind'],
    categoryId: 'cat_islamic_reminder',
    categoryName: 'Islamic Reminders',
    language: 'bn',
    status: 'scheduled',
    approvalMode: 'auto',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 45).toISOString(), // 45 mins from now
    imageUrl: '/src/assets/images/social_islamic_bg_1794224545916.jpg',
    imageSource: 'ai',
    retryCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'post_demo_2',
    title: 'সবর ও প্রার্থনার শক্তি',
    body: `কখনো কখনো আপনার প্রার্থনার উত্তর সাথে সাথে আসে না, কারণ আল্লাহ আপনাকে এমন কিছু শেখাচ্ছেন যা আপনার ভবিষ্যতের জন্য অপরিহার্য।\n\nকুরআনুল কারীমে আল্লাহ তা'আলা ইরশাদ করেছেন:\n"হে মুমিনগণ! তোমরা ধৈর্য ও সালাতের মাধ্যমে সাহায্য প্রার্থনা করো। নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সাথে আছেন।" (সূরা বাক্বারাহ: ১৫৩)\n\nআজকের ক্লান্তি কালকের শক্তিতে রূপ নেবে। আল্লাহর ওপর পূর্ণ ভরসা রাখুন।`,
    hashtags: ['#সবর', '#কুরআনের_আলো', '#হাদিসের_শিক্ষা', '#Patience', '#TrustAllah'],
    categoryId: 'cat_quran_hadith',
    categoryName: 'Quran & Hadith Education',
    language: 'bn',
    status: 'scheduled',
    approvalMode: 'auto',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 180).toISOString(), // 3 hours from now
    imageUrl: '/src/assets/images/social_islamic_bg_1794224545916.jpg',
    imageSource: 'ai',
    retryCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'post_demo_3',
    title: 'সকালবেলা নদীর কূলে জীবনের গান',
    body: `কুয়াশা ভেজা নদীর ঘাটে যখন শাপলা ফুলগুলো সূর্যকে অভ্যর্থনা জানায়, তখন মনে হয় জীবন কত সুন্দর আর সহজ!\n\nআমরাই হয়তো জটিল করে ফেলি বেশি ভেবে। আজ একটু সময় নিন, চারপাশের প্রকৃতির দিকে তাকান এবং সৃষ্টিকর্তার প্রতিটি নিয়ামতের জন্য শুকরিয়া আদায় করুন।\n\nআলহামদুলিল্লাহ আলা কুল্লি হাল।`,
    hashtags: ['#আমার_বাংলাদেশ', '#প্রকৃতি', '#শুকরিয়া', '#সকালের_হাওয়া', '#Bangladesh'],
    categoryId: 'cat_bangladesh',
    categoryName: 'Bangladesh Stories & Pride',
    language: 'bn',
    status: 'published',
    approvalMode: 'auto',
    scheduledAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    publishedAt: new Date(Date.now() - 1000 * 60 * 118).toISOString(),
    facebookPostId: 'fb_1029384756182_published',
    facebookPermalink: 'https://www.facebook.com/permalink.php?story_fbid=1029384756182&id=1000892341234',
    imageUrl: '/src/assets/images/social_nature_bg_1794224545379.jpg',
    imageSource: 'ai',
    retryCount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'post_demo_4',
    title: 'ব্যর্থতা শেষ নয়, নতুন শুরুর বীজ',
    body: `আপনি যদি আজ কোনো কাজে কাঙ্ক্ষিত ফল না পেয়ে থাকেন, তবে মনে রাখবেন—অভিজ্ঞতা কখনো বৃথা যায় না। সফল ব্যক্তি আর সাধারণ ব্যক্তির মধ্যে একটাই তফাত: সফল ব্যক্তিটি একবার বেশি চেষ্টা করেছিলেন।\n\nনিজেকে প্রশ্ন করুন: আজ আপনি কী নতুন শিখলেন? আগামীকাল আরও দৃঢ় প্রত্যয়ে মাঠে নামুন!`,
    hashtags: ['#Motivation', '#অনুপ্রেরণা', '#সফলতা', '#NeverGiveUp', '#GrowthMindset'],
    categoryId: 'cat_motivational',
    categoryName: 'Motivational Posts',
    language: 'bn',
    status: 'draft',
    approvalMode: 'manual',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 360).toISOString(),
    imageUrl: '/src/assets/images/social_nature_bg_1794224545379.jpg',
    imageSource: 'ai',
    retryCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_COMMANDS: CommandHistoryItem[] = [
  {
    id: 'cmd_1',
    instruction: 'Create 5 emotional Islamic reminders about Istighfar with authentic references',
    count: 5,
    categoryId: 'cat_islamic_reminder',
    categoryName: 'Islamic Reminders',
    language: 'bn',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'completed',
    generatedPostCount: 5,
  },
  {
    id: 'cmd_2',
    instruction: 'Generate 10 motivational Bengali statuses for youth and entrepreneurs',
    count: 10,
    categoryId: 'cat_motivational',
    categoryName: 'Motivational Posts',
    language: 'bn',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: 'completed',
    generatedPostCount: 10,
  },
];

class DatabaseManager {
  private state: DatabaseState;

  constructor() {
    this.ensureDir();
    this.state = this.load();
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
          categories: parsed.categories?.length ? parsed.categories : DEFAULT_CATEGORIES,
          posts: parsed.posts?.length ? parsed.posts : DEFAULT_POSTS,
          commands: parsed.commands?.length ? parsed.commands : DEFAULT_COMMANDS,
          images: parsed.images?.length ? parsed.images : DEFAULT_IMAGES,
          logs: parsed.logs || [],
        };
      }
    } catch (e) {
      console.error('Error loading database, resetting with defaults:', e);
    }

    const initial: DatabaseState = {
      settings: DEFAULT_SETTINGS,
      categories: DEFAULT_CATEGORIES,
      posts: DEFAULT_POSTS,
      commands: DEFAULT_COMMANDS,
      images: DEFAULT_IMAGES,
      logs: [
        {
          id: 'log_init',
          timestamp: new Date().toISOString(),
          level: 'info',
          module: 'system',
          message: 'MoSaFa AI Auto Poster engine initialized with persistent data store.',
        },
      ],
    };
    this.save(initial);
    return initial;
  }

  public save(newState?: DatabaseState) {
    if (newState) {
      this.state = newState;
    }
    try {
      this.ensureDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing database to disk:', err);
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public getSettings(): AdminSettings {
    return this.state.settings;
  }

  public updateSettings(partial: Partial<AdminSettings>): AdminSettings {
    this.state.settings = { ...this.state.settings, ...partial };
    this.save();
    return this.state.settings;
  }

  public getCategories(): Category[] {
    return this.state.categories;
  }

  public getCategory(id: string): Category | undefined {
    return this.state.categories.find((c) => c.id === id);
  }

  public saveCategory(category: Category): Category {
    const idx = this.state.categories.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      this.state.categories[idx] = category;
    } else {
      this.state.categories.push(category);
    }
    this.save();
    return category;
  }

  public deleteCategory(id: string): boolean {
    const initialLen = this.state.categories.length;
    this.state.categories = this.state.categories.filter((c) => c.id !== id);
    this.save();
    return this.state.categories.length < initialLen;
  }

  public getPosts(): PostItem[] {
    return this.state.posts;
  }

  public getPost(id: string): PostItem | undefined {
    return this.state.posts.find((p) => p.id === id);
  }

  public savePost(post: PostItem): PostItem {
    const idx = this.state.posts.findIndex((p) => p.id === post.id);
    post.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      this.state.posts[idx] = post;
    } else {
      this.state.posts.unshift(post);
    }
    this.save();
    return post;
  }

  public savePosts(newPosts: PostItem[]): PostItem[] {
    for (const post of newPosts) {
      const idx = this.state.posts.findIndex((p) => p.id === post.id);
      if (idx >= 0) {
        this.state.posts[idx] = post;
      } else {
        this.state.posts.unshift(post);
      }
    }
    this.save();
    return newPosts;
  }

  public deletePost(id: string): boolean {
    const initialLen = this.state.posts.length;
    this.state.posts = this.state.posts.filter((p) => p.id !== id);
    this.save();
    return this.state.posts.length < initialLen;
  }

  public clearQueue(): number {
    const initialCount = this.state.posts.filter((p) => p.status === 'pending' || p.status === 'scheduled').length;
    this.state.posts = this.state.posts.filter((p) => p.status !== 'pending' && p.status !== 'scheduled');
    this.save();
    return initialCount;
  }

  public getCommands(): CommandHistoryItem[] {
    return this.state.commands;
  }

  public addCommand(command: CommandHistoryItem) {
    this.state.commands.unshift(command);
    if (this.state.commands.length > 50) {
      this.state.commands = this.state.commands.slice(0, 50);
    }
    this.save();
  }

  public getImages(): LibraryImage[] {
    return this.state.images;
  }

  public addImage(image: LibraryImage) {
    this.state.images.unshift(image);
    this.save();
  }

  public deleteImage(id: string): boolean {
    const initialLen = this.state.images.length;
    this.state.images = this.state.images.filter((img) => img.id !== id);
    this.save();
    return this.state.images.length < initialLen;
  }

  public addLog(level: SystemLog['level'], module: SystemLog['module'], message: string, details?: string) {
    const log: SystemLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      details,
    };
    this.state.logs.unshift(log);
    if (this.state.logs.length > 200) {
      this.state.logs = this.state.logs.slice(0, 200);
    }
    this.save();
    return log;
  }

  public getLogs(): SystemLog[] {
    return this.state.logs;
  }
}

export const db = new DatabaseManager();
