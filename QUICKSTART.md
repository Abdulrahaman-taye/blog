# 🚀 Finance ISL - Quick Start Guide

Welcome to Finance ISL! This guide will help you get started quickly.

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Download Files
Download all files maintaining the folder structure.

### Step 2: Start Local Server

**Option A - Python:**
```bash
cd finance-isl
python -m http.server 8000
```

**Option B - Node.js:**
```bash
cd finance-isl
npx http-server -p 8000
```

**Option C - PHP:**
```bash
cd finance-isl
php -S localhost:8000
```

### Step 3: Open Browser
Navigate to: `http://localhost:8000`

---

## 📝 Adding Your First Blog Post

### 1. Open `json/blog-posts.json`

### 2. Add a new post object to the "posts" array:

```json
{
  "id": "my-first-post",
  "title": "My First Blog Post",
  "slug": "my-first-post",
  "excerpt": "This is a brief description of my post.",
  "category": "islamic-finance",
  "subtopic": "murabaha",
  "author": {
    "name": "Your Name",
    "avatar": "images/authors/you.jpg",
    "bio": "Your bio"
  },
  "publishedDate": "2026-07-20",
  "modifiedDate": "2026-07-20",
  "readingTime": "5 min",
  "featured": false,
  "tags": ["islamic", "finance", "beginner"],
  "featuredImage": {
    "src": "images/posts/my-image.jpg",
    "alt": "Description of image",
    "caption": "Image caption"
  },
  "content": [
    {
      "type": "paragraph",
      "text": "Your first paragraph here..."
    },
    {
      "type": "heading",
      "level": 2,
      "text": "First Section"
    },
    {
      "type": "paragraph",
      "text": "More content here..."
    }
  ],
  "relatedPosts": []
}
```

### 3. Add Your Image
Place your image in `images/posts/` folder

### 4. Refresh Browser
Your new post appears on the home page!

---

## 🎨 Changing Themes

Click the **sun/moon icon** in the header to cycle through:
- ☀️ Light (default)
- 🌙 Dark
- 🍀 Emerald
- ⭐ Golden

---

## 📱 Installing as App

### Mobile (Android/iOS)
1. Open website in Chrome/Safari
2. Tap "Add to Home Screen"
3. App icon appears on home screen

### Desktop (Chrome/Edge)
1. Open website
2. Click install icon in address bar
3. App installs like a native app

---

## 🌐 Going Live

### Upload to Web Host
1. Zip all files
2. Upload to your hosting provider
3. Extract in public_html or www folder
4. Access via your domain

### Free Hosting Options
- **Netlify**: Drag & drop upload
- **Vercel**: Connect GitHub repo
- **GitHub Pages**: Enable in repo settings

---

## 📧 Setting Up Contact Form

Currently uses mailto: protocol. For direct email sending:

### Quick Solution - Formspree
1. Go to [formspree.io](https://formspree.io)
2. Create account & form
3. Get your form ID
4. Update form in index.html

---

## 🆘 Need Help?

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| Page blank | Check browser console for errors |
| Content not showing | Ensure JSON files are valid |
| Images missing | Verify image paths |
| Offline not working | Check HTTPS is enabled |
| PWA not installing | Ensure manifest.json is accessible |

---

## 📚 Key Files to Edit

| File | What to Edit |
|------|--------------|
| `json/blog-posts.json` | Add/edit blog posts |
| `json/downloads.json` | Add downloadable resources |
| `json/glossary.json` | Add glossary terms |
| `json/faqs.json` | Add FAQs |
| `json/about.json` | Edit about page |
| `json/navigation.json` | Edit menu structure |
| `json/app-config.json` | App settings |

---

## ✅ Checklist Before Going Live

- [ ] Update app-config.json with your details
- [ ] Add your blog posts
- [ ] Add your images
- [ ] Test on mobile devices
- [ ] Enable HTTPS
- [ ] Set up contact form
- [ ] Update manifest.json
- [ ] Test offline mode
- [ ] Submit sitemap to Google

---

Happy blogging! 🎉

For detailed documentation, see [README.md](README.md)