/**
 * Supabase PostgreSQL Schema Generator
 * Generates the complete SQL DDL for MoSaFa AI Auto Poster
 */

export const SUPABASE_SQL_SCHEMA = `-- ====================================================================
-- MoSaFa AI Auto Poster - Supabase PostgreSQL Schema
-- Run this script in your Supabase SQL Editor to initialize all tables
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Admin Settings Table
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_pin VARCHAR(20) DEFAULT '1234',
    is_automation_active BOOLEAN DEFAULT true,
    publishing_mode VARCHAR(30) DEFAULT 'approval_required', -- 'auto' or 'approval_required'
    default_timezone VARCHAR(50) DEFAULT 'Asia/Dhaka',
    daily_posting_count INT DEFAULT 3,
    preferred_language VARCHAR(20) DEFAULT 'bn',
    gemini_model VARCHAR(50) DEFAULT 'gemini-3.8-flash',
    meta_app_id VARCHAR(100),
    meta_app_secret VARCHAR(100),
    meta_user_token TEXT,
    meta_page_token TEXT,
    meta_page_id VARCHAR(100),
    meta_page_name VARCHAR(255),
    is_meta_connected BOOLEAN DEFAULT false,
    auto_advance_hours INT DEFAULT 8,
    notify_on_publish BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Facebook Accounts Table
CREATE TABLE IF NOT EXISTS facebook_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fb_user_id VARCHAR(100) NOT NULL UNIQUE,
    user_name VARCHAR(255) NOT NULL,
    user_access_token TEXT NOT NULL,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Facebook Pages Table
CREATE TABLE IF NOT EXISTS facebook_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES facebook_accounts(id) ON DELETE CASCADE,
    page_id VARCHAR(100) NOT NULL UNIQUE,
    page_name VARCHAR(255) NOT NULL,
    page_access_token TEXT NOT NULL,
    page_category VARCHAR(100),
    is_primary_target BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Content Categories Table
CREATE TABLE IF NOT EXISTS content_categories (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_bn VARCHAR(255) NOT NULL,
    description TEXT,
    style VARCHAR(255),
    tone VARCHAR(255),
    audience VARCHAR(255),
    language VARCHAR(20) DEFAULT 'bn',
    preferred_length VARCHAR(30) DEFAULT 'medium',
    hashtag_rules JSONB DEFAULT '[]'::jsonb,
    content_instructions TEXT,
    image_preferences VARCHAR(30) DEFAULT 'optional',
    daily_posts INT DEFAULT 2,
    schedule_times JSONB DEFAULT '["09:00", "15:00", "20:00"]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    color_hex VARCHAR(20) DEFAULT '#059669',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Custom Instructions & AI Command History Table
CREATE TABLE IF NOT EXISTS custom_instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instruction TEXT NOT NULL,
    category_id VARCHAR(100) REFERENCES content_categories(id) ON DELETE SET NULL,
    count INT DEFAULT 1,
    language VARCHAR(20) DEFAULT 'bn',
    status VARCHAR(30) DEFAULT 'completed',
    generated_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Uploaded & AI Generated Images Table
CREATE TABLE IF NOT EXISTS uploaded_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    prompt TEXT,
    title VARCHAR(255),
    aspect_ratio VARCHAR(20) DEFAULT '16:9',
    category VARCHAR(100),
    image_type VARCHAR(30) DEFAULT 'ai', -- 'ai', 'upload', 'card'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Generated Contents Master Table
CREATE TABLE IF NOT EXISTS generated_contents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(300),
    body TEXT NOT NULL,
    hashtags JSONB DEFAULT '[]'::jsonb,
    category_id VARCHAR(100) REFERENCES content_categories(id) ON DELETE SET NULL,
    category_name VARCHAR(255),
    language VARCHAR(20) DEFAULT 'bn',
    approval_mode VARCHAR(30) DEFAULT 'auto',
    image_url TEXT,
    image_prompt TEXT,
    image_source VARCHAR(30) DEFAULT 'none',
    source_command_id UUID REFERENCES custom_instructions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Scheduled Posts & Posting Queue Table
CREATE TABLE IF NOT EXISTS posting_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES generated_contents(id) ON DELETE CASCADE,
    title VARCHAR(300),
    body TEXT NOT NULL,
    hashtags JSONB DEFAULT '[]'::jsonb,
    category_id VARCHAR(100),
    category_name VARCHAR(255),
    language VARCHAR(20) DEFAULT 'bn',
    status VARCHAR(30) DEFAULT 'scheduled', -- 'draft', 'pending', 'scheduled', 'published', 'failed', 'paused'
    approval_mode VARCHAR(30) DEFAULT 'auto',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    facebook_post_id VARCHAR(150),
    facebook_permalink TEXT,
    image_url TEXT,
    retry_count INT DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Published Posts Archive Table
CREATE TABLE IF NOT EXISTS published_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id UUID REFERENCES posting_queue(id) ON DELETE SET NULL,
    facebook_post_id VARCHAR(150) NOT NULL UNIQUE,
    facebook_permalink TEXT,
    title VARCHAR(300),
    body TEXT NOT NULL,
    hashtags JSONB DEFAULT '[]'::jsonb,
    category_name VARCHAR(255),
    image_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    engagement_likes INT DEFAULT 0,
    engagement_comments INT DEFAULT 0,
    engagement_shares INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Generation Logs Table
CREATE TABLE IF NOT EXISTS generation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100),
    category_id VARCHAR(100),
    instruction_summary TEXT,
    posts_requested INT,
    posts_produced INT,
    latency_ms INT,
    status VARCHAR(30),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Posting & System Logs Table
CREATE TABLE IF NOT EXISTS posting_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) DEFAULT 'info', -- 'info', 'warn', 'error', 'success'
    module VARCHAR(30) DEFAULT 'system', -- 'ai', 'facebook', 'scheduler', 'system'
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- Indexes for High Performance Scheduling
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_posting_queue_status_time ON posting_queue (status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_posting_queue_category ON posting_queue (category_id);
CREATE INDEX IF NOT EXISTS idx_published_posts_fb_id ON published_posts (facebook_post_id);
CREATE INDEX IF NOT EXISTS idx_posting_logs_level_created ON posting_logs (level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_instructions_created ON custom_instructions (created_at DESC);
`;
