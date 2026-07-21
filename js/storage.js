// Finance ISL - Storage Manager
const StorageManager = {
  PREFIX: 'financeISL_',
  
  save(key, data) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify({ data: data, ts: Date.now() }));
      return true;
    } catch (e) { return false; }
  },
  
  load(key) {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      if (!item) return null;
      return JSON.parse(item).data;
    } catch (e) { return null; }
  },
  
  remove(key) {
    try { localStorage.removeItem(this.PREFIX + key); } catch (e) {}
  },
  
  cacheData(key, data, hours) {
    if (!data) return;
    try {
      localStorage.setItem(this.PREFIX + 'cache_' + key, JSON.stringify({
        data: data,
        expiry: Date.now() + ((hours || 24) * 3600000)
      }));
    } catch (e) {}
  },
  
  loadCachedData(key) {
    try {
      const raw = localStorage.getItem(this.PREFIX + 'cache_' + key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() > parsed.expiry) {
        localStorage.removeItem(this.PREFIX + 'cache_' + key);
        return null;
      }
      return parsed.data;
    } catch (e) { return null; }
  },
  
  loadPreferences() {
    return this.load('prefs') || {
      theme: 'light',
      readPosts: [],
      searchHistory: [],
      manuallySetTheme: false
    };
  },
  
  savePreferences(prefs) {
    this.save('prefs', prefs);
  },
  
  saveLastVisited(route) {
    const p = this.loadPreferences();
    p.lastVisited = route;
    this.savePreferences(p);
  },
  
  markAsRead(postId) {
    const p = this.loadPreferences();
    if (!p.readPosts.includes(postId)) {
      p.readPosts.push(postId);
      this.savePreferences(p);
    }
  },
  
  addSearchHistory(query) {
    const p = this.loadPreferences();
    p.searchHistory = [query, ...(p.searchHistory || []).filter(q => q !== query)].slice(0, 10);
    this.savePreferences(p);
  },
  
  saveScrollPosition(page, pos) {
    const positions = this.load('scroll_pos') || {};
    positions[page] = pos;
    this.save('scroll_pos', positions);
  },
  
  getScrollPosition(page) {
    return (this.load('scroll_pos') || {})[page] || 0;
  },
  
  saveTheme(theme) {
    const p = this.loadPreferences();
    p.theme = theme;
    this.savePreferences(p);
  },
  
  getTheme() {
    return this.loadPreferences().theme || 'light';
  },
  
  saveContactForm(data) {
    const arr = this.load('contact_submissions') || [];
    arr.push({ ...data, id: Date.now() });
    this.save('contact_submissions', arr);
  },
  
  saveNewsletterSubscriber(data) {
    const arr = this.load('newsletter_subs') || [];
    arr.push({ ...data, id: Date.now() });
    this.save('newsletter_subs', arr);
  }
};