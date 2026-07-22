# Finance ISL - Supabase Setup Guide

Complete step-by-step guide to set up Supabase backend for Finance ISL.

---

## Step 1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **Start your project**
3. Sign up with GitHub, Google, or email
4. Verify your email if required

---

## Step 2: Create a New Project

1. From the dashboard, click **New Project**
2. Fill in:
   - **Organization**: Create new or select existing
   - **Project name**: `finance-isl`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
3. Click **Create new project**
4. Wait 1-2 minutes for setup to complete

---

## Step 3: Get Your API Keys

1. In your project, go to **Settings** (gear icon, bottom left)
2. Click **API**
3. Copy these two values:
   - **Project URL**: `https://xxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUz...`

---

## Step 4: Configure env.js

Open `env.js` in your project root and update:

```javascript
const ENV = {
  SUPABASE_URL: 'https://xxxxxxxx.supabase.co',  // Your Project URL
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUz...',         // Your anon public key
  WEB3FORMS_KEY: 'YOUR_ACCESS_KEY_HERE',
  CONTACT_EMAIL: 'abdulrahamanraye68@gmail.com'
};
```

---

## Step 5: Create Database Tables

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Open the file `supabase-schema.sql` from your project
4. Copy ALL the contents and paste into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. Wait for it to complete - you should see "Success"

This creates:
- All database tables
- Security policies (public read/write)
- Storage buckets
- Seed data (authors, categories, subtopics)

---

## Step 6: Create Storage Buckets

If the SQL didn't create buckets, do it manually:

1. Go to **Storage** (left sidebar)
2. Click **New bucket** and create these 4 buckets:

| Bucket Name | Public | Purpose |
|-------------|--------|---------|
| `post-images` | ✅ Yes | Blog post featured images |
| `author-avatars` | ✅ Yes | Author profile pictures |
| `download-thumbnails` | ✅ Yes | Download card images |
| `download-files` | ✅ Yes | Downloadable files (PDF, DOCX, etc.) |

For each bucket:
- Enter the name exactly as shown
- Toggle **Public bucket** ON
- Click **Create bucket**

---

## Step 7: Upload Images

### Author Avatars
Upload to `author-avatars` bucket:
| File Name | For Author |
|-----------|-----------|
| `ahmad-hassan.jpg` | Dr. Ahmad Hassan |
| `fatima-al-rashid.jpg` | Dr. Fatima Al-Rashid |
| `abdullah-ibrahim.jpg` | Sheikh Abdullah Ibrahim |
| `yusuf-patel.jpg` | Prof. Yusuf Patel |
| `aisha-mohammed.jpg` | Dr. Aisha Mohammed |
| `hassan-ali.jpg` | Dr. Hassan Ali |
| `omar-khalil.jpg` | Dr. Omar Khalil |
| `khadija-osman.jpg` | Dr. Khadija Osman |
| `ibrahim-suleiman.jpg` | Dr. Ibrahim Suleiman |
| `maryam-ibrahim.jpg` | Dr. Maryam Ibrahim |
| `sarah-abdullah.jpg` | Sarah Abdullah |
| `finance-isl-team.jpg` | Finance ISL Team |

### Post Featured Images
Upload to `post-images` bucket using the post ID as filename:
| File Name | For Post |
|-----------|---------|
| `understanding-murabaha.jpg` | Understanding Murabaha |
| `mudarabah-explained.jpg` | Mudarabah Explained |
| `zakat-calculator-guide.jpg` | Zakat Calculator Guide |
| `islamic-banking-101.jpg` | Islamic Banking 101 |
| `leadership-islamic-perspective.jpg` | Leadership |
| `takaful-guide.jpg` | Takaful Guide |
| `sukuk-explained.jpg` | Sukuk Explained |
| `waqf-guide.jpg` | Waqf Guide |
| `ethics-in-business.jpg` | Ethics in Business |
| `beginner-guide-islamic-finance.jpg` | Beginner Guide |
| `corporate-governance-guide.jpg` | Corporate Governance |
| `social-responsibility-guide.jpg` | Social Responsibility |
| `marketing-halal.jpg` | Halal Marketing |

### Download Thumbnails
Upload to `download-thumbnails` bucket:
| File Name | For Download |
|-----------|-------------|
| `zakat-calculator.jpg` | Zakat Calculator |
| `islamic-finance-glossary.jpg` | Glossary PDF |
| `murabaha-template.jpg` | Murabaha Template |
| `business-plan-template.jpg` | Business Plan |
| `investment-checklist.jpg` | Investment Checklist |
| `takaful-guide.jpg` | Takaful Guide |
| `sukuk-overview.jpg` | Sukuk Presentation |
| `ethics-workbook.jpg` | Ethics Workbook |

### Downloadable Files
Upload to `download-files` bucket:
| File Name | Type |
|-----------|------|
| `zakat-calculator.xlsx` | Excel |
| `islamic-finance-glossary.pdf` | PDF |
| `murabaha-template.docx` | Word |
| `business-plan-template.docx` | Word |
| `investment-checklist.pdf` | PDF |
| `takaful-guide.pdf` | PDF |
| `sukuk-overview.pptx` | PowerPoint |
| `ethics-workbook.pdf` | PDF |

---

## Step 8: Update Database with Image URLs

After uploading images, update the database with the public URLs.

In Supabase **SQL Editor**, run:

```sql
-- Update author avatars
UPDATE authors SET avatar = 'https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/author-avatars/ahmad-hassan.jpg' WHERE id = 'ahmad-hassan';
-- Repeat for each author...

-- Update post images
UPDATE posts SET featured_image_src = 'https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/post-images/understanding-murabaha.jpg' WHERE id = 'understanding-murabaha';
-- Repeat for each post...

-- Update download images
UPDATE downloads SET image = 'https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/download-thumbnails/zakat-calculator.jpg' WHERE id = 'zakat-calculator';
-- Repeat for each download...

-- Update download URLs
UPDATE downloads SET download_url = 'https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/download-files/zakat-calculator.xlsx' WHERE id = 'zakat-calculator';
-- Repeat for each download...
```

Or use the **Admin Panel** (`admin.html`) to update each record visually.

---

## Step 9: Add Blog Post Content

Use the Admin Panel at `admin.html` to:
1. Add blog posts with their content blocks
2. Set featured posts
3. Add FAQs and glossary terms
4. Upload and manage downloads

---

## Step 10: Test

1. Open `index.html` in your browser (via local server)
2. Verify content loads from Supabase
3. If Supabase is unavailable, it falls back to local JSON files
4. Open `admin.html` to manage content

---

## File Structure

```
finance-isl/
├── index.html          # Main website
├── admin.html          # Admin panel (direct URL only)
├── env.js              # Supabase credentials (UPDATE THIS!)
├── supabase-schema.sql # Database setup script
├── SUPABASE-SETUP.md   # This file
├── js/
│   ├── supabase.js     # Supabase client module
│   ├── app.js          # Main application
│   ├── content.js      # Content loader (Supabase → JSON fallback)
│   └── ...
├── json/               # Fallback data (used when Supabase unavailable)
└── ...
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Content not loading | Check env.js has correct URL and key |
| Images not showing | Verify bucket is public and URLs are correct |
| SQL errors | Make sure you run the ENTIRE schema file |
| CORS errors | Supabase allows all origins by default |
| Admin panel not saving | Check browser console for errors |