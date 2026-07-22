-- Finance ISL - Supabase Database Schema
-- Run this entire file in Supabase SQL Editor

-- =============================================
-- 1. AUTHORS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  role TEXT,
  specialization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. POSTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT,
  category TEXT NOT NULL,
  subtopic TEXT,
  author TEXT REFERENCES authors(id) ON DELETE SET NULL,
  published_date DATE DEFAULT CURRENT_DATE,
  tags TEXT[] DEFAULT '{}',
  featured_image_src TEXT,
  featured_image_alt TEXT,
  featured_image_caption TEXT,
  content JSONB DEFAULT '[]',
  related_posts TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. FEATURED TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS featured (
  id SERIAL PRIMARY KEY,
  post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. DOWNLOADS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS downloads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  format TEXT,
  size TEXT,
  version TEXT,
  last_updated DATE,
  download_url TEXT,
  image TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. FAQ_CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS faq_categories (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0
);

-- =============================================
-- 6. FAQs TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS faqs (
  id TEXT PRIMARY KEY,
  category_id INTEGER REFERENCES faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0
);

-- =============================================
-- 7. GLOSSARY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS glossary (
  id SERIAL PRIMARY KEY,
  term TEXT NOT NULL,
  arabic TEXT,
  pronunciation TEXT,
  definition TEXT NOT NULL,
  category TEXT,
  related_terms TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

-- =============================================
-- 9. SUBTOPICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS subtopics (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'blog',
  page TEXT,
  sort_order INTEGER DEFAULT 0
);

-- =============================================
-- 10. ABOUT TABLE (single row)
-- =============================================
CREATE TABLE IF NOT EXISTS about (
  id INTEGER PRIMARY KEY DEFAULT 1,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  mission JSONB,
  vision JSONB,
  stats JSONB,
  values JSONB,
  team JSONB,
  history JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE about ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read" ON authors FOR SELECT USING (true);
CREATE POLICY "Public read" ON posts FOR SELECT USING (true);
CREATE POLICY "Public read" ON featured FOR SELECT USING (true);
CREATE POLICY "Public read" ON downloads FOR SELECT USING (true);
CREATE POLICY "Public read" ON faq_categories FOR SELECT USING (true);
CREATE POLICY "Public read" ON faqs FOR SELECT USING (true);
CREATE POLICY "Public read" ON glossary FOR SELECT USING (true);
CREATE POLICY "Public read" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read" ON subtopics FOR SELECT USING (true);
CREATE POLICY "Public read" ON about FOR SELECT USING (true);
CREATE POLICY "Public read" ON settings FOR SELECT USING (true);

-- Public write (admin panel)
CREATE POLICY "Public write" ON authors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write" ON featured FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write" ON downloads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write" ON faq_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write" ON faqs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write" ON glossary FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write" ON subtopics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write" ON about FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write" ON settings FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('author-avatars', 'author-avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('download-thumbnails', 'download-thumbnails', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('download-files', 'download-files', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read storage" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Public insert storage" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete storage" ON storage.objects FOR DELETE USING (true);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_subtopic ON posts(subtopic);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_featured_post ON featured(post_id);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category_id);
CREATE INDEX IF NOT EXISTS idx_subtopics_category ON subtopics(category_id);

-- =============================================
-- SEED: CATEGORIES ONLY
-- =============================================
INSERT INTO categories (id, title, icon, description, sort_order) VALUES
('business-management', 'Business Management', 'briefcase', 'Strategic insights for Islamic business success', 1),
('islamic-finance', 'Islamic Finance', 'bank', 'Comprehensive Islamic finance education', 2),
('ethics', 'Ethics', 'balance', 'Ethical frameworks in Islamic business', 3),
('learning-resources', 'Learning Resources', 'book', 'Professional educational materials and tools', 4),
('about', 'About', 'info', 'About Finance ISL', 5)
ON CONFLICT (id) DO NOTHING;

-- Default settings
INSERT INTO settings (key, value) VALUES
('app', '{"name":"Finance ISL","version":"1.0.0","description":"Comprehensive Islamic Finance Blog Platform","email":"abdulrahamanraye68@gmail.com","copyright":"© 2026 Finance ISL. All rights reserved.","web3formsAccessKey":"YOUR_ACCESS_KEY_HERE"}'),
('themes', '{"light":{"name":"Light","primary":"#1a5632","secondary":"#2d8a56","accent":"#d4af37","background":"#ffffff","surface":"#f8f9fa","text":"#1a1a1a","textSecondary":"#666666","border":"#e0e0e0"},"dark":{"name":"Dark","primary":"#2d8a56","secondary":"#4ade80","accent":"#fbbf24","background":"#0f172a","surface":"#1e293b","text":"#f1f5f9","textSecondary":"#94a3b8","border":"#334155"},"green":{"name":"Emerald","primary":"#065f46","secondary":"#059669","accent":"#d97706","background":"#ecfdf5","surface":"#d1fae5","text":"#064e3b","textSecondary":"#047857","border":"#a7f3d0"},"gold":{"name":"Golden","primary":"#92400e","secondary":"#b45309","accent":"#1a5632","background":"#fffbeb","surface":"#fef3c7","text":"#78350f","textSecondary":"#92400e","border":"#fde68a"}}')
ON CONFLICT (key) DO NOTHING;

-- Default about row
INSERT INTO about (id, title, subtitle, description, mission, vision, stats, values, team, history) VALUES
(1, 'About Finance ISL', 'Your Trusted Source for Islamic Finance Knowledge', 'Finance ISL is a comprehensive educational platform dedicated to promoting understanding of Islamic finance.', '{"title":"Our Mission","content":""}', '{"title":"Our Vision","content":""}', '{"articles":"0","readers":"0","countries":"0","downloads":"0"}', '[]', '{"members":[]}', '{"milestones":[]}')
ON CONFLICT (id) DO NOTHING;