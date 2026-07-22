// Finance ISL - Content Manager
const ContentManager = {
  config: null,
  posts: null,
  authors: null,
  featured: null,
  navigation: null,
  downloads: null,
  faqs: null,
  glossary: null,
  about: null,
  source: 'json', // 'supabase' or 'json'
  
  async init() {
    // Try Supabase first
    if (SupabaseClient.connected) {
      const ok = await this.loadFromSupabase();
      if (ok) {
        this.source = 'supabase';
        console.log('[Content] Loaded from Supabase');
        return true;
      }
    }
    
    // Fallback to JSON files
    await this.loadFromJSON();
    this.source = 'json';
    console.log('[Content] Loaded from JSON files');
    return true;
  },
  
  // ===== SUPABASE LOADER =====
  async loadFromSupabase() {
    try {
      const [posts, authors, featured, downloads, faqCats, faqs, glossary, categories, subtopics, about, appSettings, themeSettings] = await Promise.all([
        SupabaseClient.fetchAll('posts', 'published_date', false),
        SupabaseClient.fetchAll('authors', 'name'),
        SupabaseClient.fetchAll('featured', 'sort_order'),
        SupabaseClient.fetchAll('downloads', 'name'),
        SupabaseClient.fetchAll('faq_categories', 'sort_order'),
        SupabaseClient.fetchAll('faqs', 'sort_order'),
        SupabaseClient.fetchAll('glossary', 'term'),
        SupabaseClient.fetchAll('categories', 'sort_order'),
        SupabaseClient.fetchAll('subtopics', 'sort_order'),
        SupabaseClient.fetchOne('about', 1),
        SupabaseClient.getSetting('app'),
        SupabaseClient.getSetting('themes')
      ]);
      
      if (!posts) return false;
      
      // Transform posts to match frontend format
      this.posts = {
        posts: posts.map(p => ({
          id: p.id,
          title: p.title,
          excerpt: p.excerpt,
          category: p.category,
          subtopic: p.subtopic,
          author: p.author,
          publishedDate: p.published_date,
          tags: p.tags || [],
          featuredImage: {
            src: p.featured_image_src || '',
            alt: p.featured_image_alt || '',
            caption: p.featured_image_caption || ''
          },
          content: p.content || [],
          relatedPosts: p.related_posts || []
        }))
      };
      
      // Transform authors
      this.authors = { authors: authors || [] };
      
      // Transform featured
      this.featured = {
        featured: (featured || []).map(f => f.post_id)
      };
      
      // Transform downloads
      this.downloads = {
        downloads: (downloads || []).map(d => ({
          id: d.id,
          name: d.name,
          description: d.description,
          format: d.format,
          size: d.size,
          version: d.version,
          lastUpdated: d.last_updated,
          downloadUrl: d.download_url,
          image: d.image || '',
          tags: d.tags || []
        }))
      };
      
      // Transform FAQs
      const faqMap = {};
      (faqCats || []).forEach(c => { faqMap[c.id] = c.category; });
      const faqGrouped = {};
      (faqs || []).forEach(f => {
        const catName = faqMap[f.category_id] || 'Other';
        if (!faqGrouped[catName]) faqGrouped[catName] = [];
        faqGrouped[catName].push({ id: f.id, question: f.question, answer: f.answer, tags: f.tags || [] });
      });
      this.faqs = {
        faqs: Object.entries(faqGrouped).map(([category, questions]) => ({ category, questions }))
      };
      
      // Transform glossary
      this.glossary = {
        glossary: (glossary || []).map(g => ({
          term: g.term,
          arabic: g.arabic,
          pronunciation: g.pronunciation,
          definition: g.definition,
          category: g.category,
          relatedTerms: g.related_terms || []
        }))
      };
      
      // Transform navigation from categories + subtopics
      const navMap = {};
      (categories || []).forEach(c => {
        navMap[c.id] = { id: c.id, title: c.title, icon: c.icon, description: c.description, subtopics: [] };
      });
      (subtopics || []).forEach(s => {
        if (navMap[s.category_id]) {
          navMap[s.category_id].subtopics.push({
            id: s.id,
            title: s.title,
            description: s.description,
            type: s.type || 'blog',
            page: s.page || null
          });
        }
      });
      this.navigation = { menu: { main: Object.values(navMap) } };
      
      // About
      this.about = about ? { about: about } : null;
      
      // Config from settings
      this.config = {
        app: appSettings || {},
        themes: themeSettings || {}
      };
      
      // Cache everything
      this.cacheAll();
      
      return true;
    } catch (e) {
      console.warn('[Content] Supabase load error:', e);
      return false;
    }
  },
  
  // ===== JSON LOADER =====
  async loadFromJSON() {
    this.config = await this.loadFile('json/app-config.json', 'app-config');
    this.posts = await this.loadFile('json/blog-posts.json', 'blog-posts');
    this.authors = await this.loadFile('json/authors.json', 'authors');
    this.featured = await this.loadFile('json/featured.json', 'featured');
    this.navigation = await this.loadFile('json/navigation.json', 'navigation');
    this.downloads = await this.loadFile('json/downloads.json', 'downloads');
    this.faqs = await this.loadFile('json/faqs.json', 'faqs');
    this.glossary = await this.loadFile('json/glossary.json', 'glossary');
    this.about = await this.loadFile('json/about.json', 'about');
    this.cacheAll();
  },
  
  async loadFile(url, cacheKey) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn(`Failed to load ${url}, trying cache...`);
      return StorageManager.loadCachedData(cacheKey);
    }
  },
  
  cacheAll() {
    try {
      if (this.config) StorageManager.cacheData('app-config', this.config, 168);
      if (this.posts) StorageManager.cacheData('blog-posts', this.posts, 24);
      if (this.authors) StorageManager.cacheData('authors', this.authors, 168);
      if (this.featured) StorageManager.cacheData('featured', this.featured, 24);
      if (this.navigation) StorageManager.cacheData('navigation', this.navigation, 168);
      if (this.downloads) StorageManager.cacheData('downloads', this.downloads, 24);
      if (this.faqs) StorageManager.cacheData('faqs', this.faqs, 168);
      if (this.glossary) StorageManager.cacheData('glossary', this.glossary, 168);
      if (this.about) StorageManager.cacheData('about', this.about, 168);
    } catch (e) {}
  },
  
  // ===== POSTS =====
  getAllPosts() { return (this.posts && this.posts.posts) ? this.posts.posts : []; },
  getPostById(id) { return this.getAllPosts().find(p => p.id === id); },
  getPostBySlug(slug) { return this.getPostById(slug); },
  getPostsByCategory(cat) { return this.getAllPosts().filter(p => p.category === cat); },
  getPostsBySubtopic(sub) { return this.getAllPosts().filter(p => p.subtopic === sub); },
  getFeaturedPosts() {
    if (!this.featured || !this.featured.featured) return [];
    return this.featured.featured.map(id => this.getPostById(id)).filter(Boolean);
  },
  getRecentPosts(limit = 9) {
    return [...this.getAllPosts()].sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate)).slice(0, limit);
  },
  getRelatedPosts(postId, limit = 3) {
    const post = this.getPostById(postId);
    if (!post || !post.relatedPosts) return [];
    return post.relatedPosts.map(id => this.getPostById(id)).filter(Boolean).slice(0, limit);
  },
  calculateReadingTime(post) {
    if (!post || !post.content) return '1 min';
    let wordCount = 0;
    post.content.forEach(block => {
      if (block.text) wordCount += block.text.split(/\s+/).length;
      if (block.items) block.items.forEach(item => wordCount += item.split(/\s+/).length);
    });
    return Math.max(1, Math.ceil(wordCount / 200)) + ' min read';
  },
  getPostCount() { return this.getAllPosts().length; },
  getLastUpdated() {
    const posts = this.getAllPosts();
    if (!posts.length) return '';
    return posts.map(p => new Date(p.publishedDate)).sort((a, b) => b - a)[0].toISOString().split('T')[0];
  },
  
  // ===== SEARCH =====
  searchPostsWithHighlight(query) {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    const results = [];
    this.getAllPosts().forEach(post => {
      const matches = [];
      let snippet = null;
      if (post.title.toLowerCase().includes(q)) matches.push('title');
      if (post.excerpt && post.excerpt.toLowerCase().includes(q)) matches.push('excerpt');
      if (post.tags && post.tags.some(t => t.toLowerCase().includes(q))) matches.push('tags');
      if (post.subtopic && (post.subtopic.toLowerCase().includes(q) || post.subtopic.replace(/-/g,' ').includes(q))) matches.push('subtopic');
      if (post.content) {
        for (const block of post.content) {
          let text = block.text || '';
          if (block.items) text += ' ' + block.items.join(' ');
          if (text.toLowerCase().includes(q)) {
            matches.push('content');
            const idx = text.toLowerCase().indexOf(q);
            snippet = text.substring(Math.max(0, idx - 60), Math.min(text.length, idx + q.length + 60));
            break;
          }
        }
      }
      if (matches.length > 0) results.push({ post, matchSources: matches, contentSnippet: snippet, priority: matches.includes('title') ? 0 : 1 });
    });
    return results.sort((a, b) => a.priority - b.priority);
  },
  
  // ===== AUTHORS =====
  getAuthorById(id) {
    if (!this.authors || !this.authors.authors) return null;
    return this.authors.authors.find(a => a.id === id);
  },
  
  // ===== CATEGORIES =====
  getCategories() {
    if (this.navigation && this.navigation.menu && this.navigation.menu.main) return this.navigation.menu.main;
    return [];
  },
  getCategoryById(id) { return this.getCategories().find(c => c.id === id); },
  
  // ===== DOWNLOADS =====
  getDownloads() { return (this.downloads && this.downloads.downloads) ? this.downloads.downloads : []; },
  getDownloadById(id) { return this.getDownloads().find(d => d.id === id); },
  getDownloadCount() { return this.getDownloads().length; },
  
  // ===== FAQs =====
  getFAQs() { return (this.faqs && this.faqs.faqs) ? this.faqs.faqs : []; },
  getFAQCount() { return this.getFAQs().reduce((sum, cat) => sum + cat.questions.length, 0); },
  
  // ===== GLOSSARY =====
  getGlossaryTerms() { return (this.glossary && this.glossary.glossary) ? this.glossary.glossary : []; },
  searchGlossary(query) {
    const terms = this.getGlossaryTerms();
    if (!query) return terms;
    const q = query.toLowerCase();
    return terms.filter(t => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q));
  },
  getGlossaryByLetter() {
    const grouped = {};
    this.getGlossaryTerms().forEach(t => {
      const letter = t.term.charAt(0).toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(t);
    });
    const sorted = {};
    Object.keys(grouped).sort().forEach(k => { sorted[k] = grouped[k].sort((a, b) => a.term.localeCompare(b.term)); });
    return sorted;
  },
  getGlossaryCount() { return this.getGlossaryTerms().length; },
  
  // ===== ABOUT =====
  getAbout() { return this.about ? this.about.about : null; },
  
  // ===== CONFIG =====
  getAppConfig() { return this.config || {}; },
  getWeb3FormsKey() { return (this.config && this.config.app) ? this.config.app.web3formsAccessKey : (typeof ENV !== 'undefined' ? ENV.WEB3FORMS_KEY : null); },
  getContactEmail() { return (this.config && this.config.app) ? this.config.app.email : (typeof ENV !== 'undefined' ? ENV.CONTACT_EMAIL : 'abdulrahamanraye68@gmail.com'); },
  
  // ===== UTILS =====
  formatDate(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { return d; }
  },
  getAuthorInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
};