// Finance ISL - Main Application
const App = {
  isInitialized: false,
  isOnline: navigator.onLine,
  
  async init() {
    console.log('Initializing Finance ISL...');
    
    try {
      ThemeManager.init();
      
      // Init Supabase connection (non-blocking)
      SupabaseClient.init();
      
      // Wait a moment for Supabase to connect, then load content
      await new Promise(resolve => {
        if (SupabaseClient.connected) { resolve(); return; }
        const timeout = setTimeout(resolve, 2000); // 2s max wait
        window.addEventListener('supabase-ready', () => { clearTimeout(timeout); resolve(); }, { once: true });
      });
      
      const contentLoaded = await ContentManager.init();
      console.log('Content loaded:', contentLoaded, 'Source:', ContentManager.source);
      
      this.setupEventListeners();
      this.initRouter();
      this.renderUI();
      this.setupPullToRefresh();
      this.setupConnectivityDetection();
      this.registerServiceWorker();
      
      this.isInitialized = true;
      console.log('Finance ISL ready');
      this.hideLoadingScreen();
    } catch (error) {
      console.error('Init error:', error);
      this.hideLoadingScreen();
    }
  },
  
  setupEventListeners() {
    document.getElementById('menu-toggle')?.addEventListener('click', () => this.toggleSidebar());
    document.getElementById('sidebar-close')?.addEventListener('click', () => this.closeSidebar());
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => this.closeSidebar());
    document.getElementById('search-btn')?.addEventListener('click', () => this.openSearch());
    document.getElementById('search-close')?.addEventListener('click', () => this.closeSearch());
    document.getElementById('search-input')?.addEventListener('input', (e) => this.handleSearch(e.target.value));
    document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('fab-contact')?.addEventListener('click', () => this.toggleContactModal());
    document.getElementById('contact-close')?.addEventListener('click', () => this.closeContactModal());
    document.getElementById('contact-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleContactSubmit(e.target); });
    document.getElementById('back-to-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    
    window.addEventListener('scroll', () => {
      const btn = document.getElementById('back-to-top');
      if (btn) btn.classList.toggle('visible', window.scrollY > 300);
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { this.closeSearch(); this.closeContactModal(); this.closeSidebar(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); this.openSearch(); }
    });
  },
  
  initRouter() {
    Router.register('/', () => this.renderHomePage());
    Router.register('/post/:slug', (p) => this.renderPostPage(p.slug));
    Router.register('/category/:id', (p) => this.renderCategoryPage(p.id));
    Router.register('/category/:id/subtopic/:subtopic', (p) => this.renderSubtopicPage(p.id, p.subtopic));
    Router.register('/about', () => this.renderAboutPage());
    Router.register('/glossary', () => this.renderGlossaryPage());
    Router.register('/faqs', () => this.renderFAQsPage());
    Router.register('/downloads', () => this.renderDownloadsPage());
    Router.register('/search', () => this.renderSearchPage());
    Router.init();
  },
  
  renderUI() {
    this.renderNavigation();
    this.renderFooter();
  },
  
  // ===== NAVIGATION =====
  renderNavigation() {
    const navMenu = document.getElementById('nav-menu');
    if (!navMenu) return;
    
    const categories = ContentManager.getCategories();
    if (!categories.length) {
      navMenu.innerHTML = '<p style="padding:16px;color:#999;">Menu loading...</p>';
      return;
    }
    
    let html = '';
    categories.forEach(item => {
      const subs = item.subtopics || [];
      
      if (subs.length === 0) {
        // No subtopics (About) - header is clickable
        html += `<div class="nav-item">
          <div class="nav-item-header" onclick="App.navigateTo('/${item.id}')" style="cursor:pointer;">
            <div class="nav-item-header-left">
              <div class="nav-item-icon">${this.getIcon(item.icon)}</div>
              <div class="nav-item-title">${item.title}</div>
            </div>
          </div>
        </div>`;
      } else {
        // Check if any subtopic is a dedicated page
        const hasBlogSubs = subs.some(s => !s.type || s.type === 'blog');
        
        html += `<div class="nav-item">
          <div class="nav-item-header" onclick="App.toggleNavItem(this)">
            <div class="nav-item-header-left">
              <div class="nav-item-icon">${this.getIcon(item.icon)}</div>
              <div class="nav-item-title">${item.title}</div>
            </div>
            <div class="nav-item-arrow">${this.getIcon('chevron-down')}</div>
          </div>
          <div class="nav-submenu">
            ${hasBlogSubs ? `<a class="nav-submenu-item" onclick="App.navigateTo('/category/${item.id}')">All ${item.title}</a>` : ''}
            ${subs.map(sub => {
              // If subtopic has type "page", link to its dedicated page
              if (sub.type === 'page' && sub.page) {
                return `<a class="nav-submenu-item" onclick="App.navigateTo('${sub.page}')">${sub.title}</a>`;
              }
              // Otherwise link to blog subtopic category
              return `<a class="nav-submenu-item" onclick="App.navigateTo('/category/${item.id}/subtopic/${sub.id}')">${sub.title}</a>`;
            }).join('')}
          </div>
        </div>`;
      }
    });
    
    navMenu.innerHTML = html;
    
    // Also render desktop navigation
    this.renderDesktopNav(categories);
  },
  
  // ===== DESKTOP NAV =====
  renderDesktopNav(categories) {
    const desktopNav = document.getElementById('desktop-nav');
    if (!desktopNav) return;
    
    let html = '';
    categories.forEach(item => {
      const subs = item.subtopics || [];
      
      if (subs.length === 0) {
        // No subtopics (About) - simple link
        html += `<div class="desktop-nav-item">
          <a class="desktop-nav-link" onclick="App.navigateTo('/${item.id}')">${item.title}</a>
        </div>`;
      } else {
        html += `<div class="desktop-nav-item">
          <a class="desktop-nav-link" onclick="App.navigateTo('/category/${item.id}')">
            ${item.title}
            ${this.getIcon('chevron-down')}
          </a>
          <div class="desktop-dropdown">
            ${subs.map(sub => {
              if (sub.type === 'page' && sub.page) {
                return `<a class="desktop-dropdown-item" onclick="App.navigateTo('${sub.page}')">${sub.title}</a>`;
              }
              return `<a class="desktop-dropdown-item" onclick="App.navigateTo('/category/${item.id}/subtopic/${sub.id}')">${sub.title}</a>`;
            }).join('')}
          </div>
        </div>`;
      }
    });
    
    desktopNav.innerHTML = html;
  },
  
  // ===== FOOTER =====
  renderFooter() {
    const footer = document.getElementById('footer');
    if (!footer) return;
    
    const categories = ContentManager.getCategories().filter(c => c.id !== 'about');
    const config = ContentManager.getAppConfig();
    const copyright = config.app?.copyright || '© 2026 Finance ISL';
    
    footer.innerHTML = `<div class="container"><div class="footer-grid">
      <div class="footer-section">
        <h3 class="footer-section-title">Finance ISL</h3>
        <p style="color:rgba(255,255,255,0.8);margin-bottom:16px;line-height:1.6;">Your comprehensive resource for Islamic finance knowledge and business ethics.</p>
      </div>
      <div class="footer-section">
        <h3 class="footer-section-title">Quick Links</h3>
        <div class="footer-links">
          <a href="#/" class="footer-link" onclick="App.navigateTo('/')">Home</a>
          <a href="#/about" class="footer-link" onclick="App.navigateTo('/about')">About</a>
          <a href="#/glossary" class="footer-link" onclick="App.navigateTo('/glossary')">Glossary</a>
          <a href="#/faqs" class="footer-link" onclick="App.navigateTo('/faqs')">FAQs</a>
          <a href="#/downloads" class="footer-link" onclick="App.navigateTo('/downloads')">Downloads</a>
        </div>
      </div>
      <div class="footer-section">
        <h3 class="footer-section-title">Categories</h3>
        <div class="footer-links">
          ${categories.map(c => `<a href="#/category/${c.id}" class="footer-link" onclick="App.navigateTo('/category/${c.id}')">${c.title}</a>`).join('')}
        </div>
      </div>
      <div class="footer-section">
        <h3 class="footer-section-title">Newsletter</h3>
        <p class="footer-newsletter-text">Subscribe for the latest updates.</p>
        <form class="footer-newsletter-form" id="newsletter-form">
          <input type="text" class="footer-newsletter-input" placeholder="Your name" name="name" required>
          <input type="email" class="footer-newsletter-input" placeholder="Your email" name="email" required>
          <button type="submit" class="footer-newsletter-btn">Subscribe</button>
        </form>
      </div>
    </div>
    <div class="footer-bottom"><p class="footer-copyright">${copyright}</p></div></div>`;
    
    document.getElementById('newsletter-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleNewsletterSubmit(e.target); });
  },
  
  // ===== HOME PAGE =====
  renderHomePage() {
    const el = document.getElementById('main-content');
    if (!el) return;
    
    const featured = ContentManager.getFeaturedPosts();
    const recent = ContentManager.getRecentPosts(9);
    const categories = ContentManager.getCategories().filter(c => c.id !== 'about');
    
    el.innerHTML = `
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">Welcome to Finance ISL</h1>
          <p class="hero-subtitle">Your comprehensive resource for Islamic finance knowledge, business ethics, and Sharia-compliant economic principles.</p>
          <div class="hero-search">
            <input type="text" class="hero-search-input" placeholder="Search articles, topics, and resources..." id="hero-search-input">
            <button class="hero-search-btn" onclick="App.handleHeroSearch()">Search</button>
          </div>
        </div>
      </section>
      
      ${featured.length > 0 ? `
        <section class="section">
          <div class="container">
            <div class="section-header">
              <h2 class="section-title">Featured Articles</h2>
              <p class="section-subtitle">Explore our most popular articles on Islamic finance.</p>
            </div>
            <div class="posts-grid">
              ${featured.map((post, i) => this.renderPostCard(post, i === 0)).join('')}
            </div>
          </div>
        </section>
      ` : ''}
      
      <section class="section" style="background-color:var(--background-alt);">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">Latest Articles</h2>
            <p class="section-subtitle">Stay updated with our newest content.</p>
          </div>
          <div class="category-filter">
            <button class="category-filter-btn active" onclick="App.filterPosts('all',this)">All</button>
            ${categories.map(c => `<button class="category-filter-btn" onclick="App.filterPosts('${c.id}',this)">${c.title}</button>`).join('')}
          </div>
          <div class="posts-grid" id="posts-grid">
            ${recent.map(post => this.renderPostCard(post)).join('')}
          </div>
        </div>
      </section>
    `;
    
    document.getElementById('hero-search-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleHeroSearch();
    });
  },
  
  // ===== POST CARD =====
  renderPostCard(post, featured = false) {
    if (!post) return '';
    const cat = ContentManager.getCategoryById(post.category);
    const author = ContentManager.getAuthorById(post.author) || {};
    const initials = ContentManager.getAuthorInitials(author.name);
    const readingTime = ContentManager.calculateReadingTime(post);
    
    return `
      <article class="post-card ${featured ? 'featured-post' : ''}" onclick="App.navigateTo('/post/${post.id}')">
        <div class="post-card-image">
          <img src="${post.featuredImage?.src || ''}" alt="${post.featuredImage?.alt || post.title}" loading="lazy" onerror="this.style.display='none'">
          <span class="post-card-category">${cat?.title || post.category}</span>
        </div>
        <div class="post-card-content">
          <div class="post-card-meta">
            <span>${ContentManager.formatDate(post.publishedDate)}</span>
            <span>${readingTime}</span>
          </div>
          <h3 class="post-card-title">${post.title}</h3>
          <p class="post-card-excerpt">${post.excerpt || ''}</p>
          <div class="post-card-tags">
            ${post.subtopic ? `<span class="post-card-tag">${post.subtopic.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>` : ''}
          </div>
          <div class="post-card-footer">
            <div class="post-card-author">
              <div class="post-card-author-avatar">${initials}</div>
              <span class="post-card-author-name">${author.name || ''}</span>
            </div>
            <span class="post-card-reading-time">${readingTime}</span>
          </div>
        </div>
      </article>
    `;
  },
  
  // ===== POST PAGE =====
  renderPostPage(slug) {
    const post = ContentManager.getPostBySlug(slug);
    if (!post) { Router.handle404(); return; }
    
    const el = document.getElementById('main-content');
    if (!el) return;
    
    const cat = ContentManager.getCategoryById(post.category);
    const related = ContentManager.getRelatedPosts(post.id, 3);
    const author = ContentManager.getAuthorById(post.author) || {};
    const readingTime = ContentManager.calculateReadingTime(post);
    const subtopic = post.subtopic || '';
    
    StorageManager.markAsRead(post.id);
    
    el.innerHTML = `
      <article class="post-detail">
        <div class="post-detail-header">
          <nav class="post-detail-breadcrumb">
            <a href="#/" onclick="App.navigateTo('/')">Home</a><span>/</span>
            <a href="#/category/${post.category}" onclick="App.navigateTo('/category/${post.category}')">${cat?.title || post.category}</a>
            ${subtopic ? `<span>/</span><a href="#/category/${post.category}/subtopic/${subtopic}" onclick="App.navigateTo('/category/${post.category}/subtopic/${subtopic}')">${subtopic.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</a>` : ''}
          </nav>
          <h1 class="post-detail-title">${post.title}</h1>
          <div class="post-detail-meta">
            <div class="post-detail-author">
              <div class="post-detail-author-avatar">${ContentManager.getAuthorInitials(author.name)}</div>
              <div class="post-detail-author-info">
                <span class="post-detail-author-name">${author.name || ''}</span>
                <span class="post-detail-author-role">${author.bio || ''}</span>
              </div>
            </div>
            <span class="post-detail-date">${ContentManager.formatDate(post.publishedDate)}</span>
            <span class="post-detail-reading-time">${readingTime}</span>
          </div>
        </div>
        
        ${post.featuredImage ? `
          <figure class="post-detail-featured-image">
            <img src="${post.featuredImage.src}" alt="${post.featuredImage.alt}" onerror="this.style.display='none'">
            ${post.featuredImage.caption ? `<figcaption>${post.featuredImage.caption}</figcaption>` : ''}
          </figure>
        ` : ''}
        
        <div class="article-content">${this.renderContentBlocks(post.content)}</div>
        
        ${subtopic ? `
          <div class="post-detail-tags">
            <strong>Topic:</strong>
            <span class="post-detail-tag" onclick="App.navigateTo('/category/${post.category}/subtopic/${subtopic}')">${subtopic.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
          </div>
        ` : ''}
        
        ${post.tags?.length ? `
          <div class="post-detail-tags" style="border-top:none;margin-top:0;">
            <strong>Tags:</strong>
            ${post.tags.map(t => `<span class="post-detail-tag" onclick="App.searchByTag('${t}')">${t}</span>`).join('')}
          </div>
        ` : ''}
        
        <div class="share-section">
          <h3 class="share-section-title">Share this article</h3>
          <div class="share-buttons">
            <button class="share-btn" onclick="App.share('twitter','${post.title.replace(/'/g, "\\'")}')">${this.getIcon('twitter')}</button>
            <button class="share-btn" onclick="App.share('facebook')">${this.getIcon('facebook')}</button>
            <button class="share-btn" onclick="App.share('linkedin')">${this.getIcon('linkedin')}</button>
            <button class="share-btn" onclick="App.copyLink()">${this.getIcon('link')}</button>
          </div>
        </div>
        
        ${related.length > 0 ? `
          <div class="related-posts">
            <h2 class="related-posts-title">Related Articles</h2>
            <div class="related-posts-grid">${related.map(p => this.renderPostCard(p)).join('')}</div>
          </div>
        ` : ''}
      </article>
    `;
  },
  
  // ===== CONTENT BLOCKS =====
  renderContentBlocks(content) {
    if (!content || !Array.isArray(content)) return '';
    return content.map(b => {
      switch (b.type) {
        case 'paragraph': return `<p>${b.text || ''}</p>`;
        case 'heading': return `<h${b.level || 2}>${b.text || ''}</h${b.level || 2}>`;
        case 'list':
          const tag = b.style === 'ordered' ? 'ol' : 'ul';
          return `<${tag}>${(b.items || []).map(i => `<li>${i}</li>`).join('')}</${tag}>`;
        case 'quote': return `<blockquote><p>${b.text || ''}</p>${b.source ? `<cite>— ${b.source}</cite>` : ''}</blockquote>`;
        case 'table': return `<table>${b.caption ? `<caption>${b.caption}</caption>` : ''}<thead><tr>${(b.headers||[]).map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${(b.rows||[]).map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
        case 'video': return `<div class="video-container"><iframe src="${b.url}" title="${b.title||''}" allowfullscreen loading="lazy"></iframe></div>`;
        case 'image': return `<figure><img src="${b.src}" alt="${b.alt||''}" loading="lazy" onerror="this.style.display='none'">${b.caption?`<figcaption>${b.caption}</figcaption>`:''}</figure>`;
        case 'callout': return `<div class="callout callout-${b.style||'info'}"><div class="callout-title">${b.title||''}</div><p>${b.text||''}</p></div>`;
        default: return '';
      }
    }).join('');
  },
  
  // ===== CATEGORY PAGE =====
  renderCategoryPage(catId) {
    const cat = ContentManager.getCategoryById(catId);
    if (!cat) { Router.handle404(); return; }
    
    const el = document.getElementById('main-content');
    if (!el) return;
    
    const posts = ContentManager.getPostsByCategory(catId);
    // Only show blog-type subtopics in filter
    const subs = (cat.subtopics || []).filter(s => !s.type || s.type === 'blog');
    
    el.innerHTML = `
      <section class="section">
        <div class="container">
          <div class="section-header">
            <h1 class="section-title">${cat.title}</h1>
            <p class="section-subtitle">${cat.description || ''}</p>
          </div>
          ${subs.length > 0 ? `
            <div class="category-filter" style="margin-bottom:32px;">
              <button class="category-filter-btn active" onclick="App.filterBySubtopic('${catId}','all',this)">All</button>
              ${subs.map(s => `<button class="category-filter-btn" onclick="App.filterBySubtopic('${catId}','${s.id}',this)">${s.title}</button>`).join('')}
            </div>
          ` : ''}
          <div class="posts-grid" id="category-posts-grid">
            ${posts.length > 0 ? posts.map(p => this.renderPostCard(p)).join('') : '<p style="text-align:center;color:var(--text-muted);padding:48px 0;grid-column:1/-1;">No articles found yet.</p>'}
          </div>
        </div>
      </section>
    `;
  },
  
  // ===== SUBTOPIC PAGE =====
  renderSubtopicPage(catId, subId) {
    const cat = ContentManager.getCategoryById(catId);
    if (!cat) { Router.handle404(); return; }
    
    const el = document.getElementById('main-content');
    if (!el) return;
    
    const allSubs = cat.subtopics || [];
    const sub = allSubs.find(s => s.id === subId);
    const title = sub?.title || subId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const posts = ContentManager.getPostsBySubtopic(subId);
    // Only show blog-type subtopics in filter
    const blogSubs = allSubs.filter(s => !s.type || s.type === 'blog');
    
    el.innerHTML = `
      <section class="section">
        <div class="container">
          <div class="section-header">
            <nav class="post-detail-breadcrumb" style="justify-content:center;margin-bottom:16px;">
              <a href="#/" onclick="App.navigateTo('/')">Home</a><span>/</span>
              <a href="#/category/${catId}" onclick="App.navigateTo('/category/${catId}')">${cat.title}</a><span>/</span>
              <span style="color:var(--text);font-weight:600;">${title}</span>
            </nav>
            <h1 class="section-title">${title}</h1>
            <p class="section-subtitle">${sub?.description || 'Articles about ' + title}</p>
          </div>
          ${blogSubs.length > 0 ? `
            <div class="category-filter" style="margin-bottom:32px;">
              <button class="category-filter-btn" onclick="App.navigateTo('/category/${catId}')">All ${cat.title}</button>
              ${blogSubs.map(s => `<button class="category-filter-btn ${s.id === subId ? 'active' : ''}" onclick="App.navigateTo('/category/${catId}/subtopic/${s.id}')">${s.title}</button>`).join('')}
            </div>
          ` : ''}
          <div class="posts-grid">
            ${posts.length > 0 ? posts.map(p => this.renderPostCard(p)).join('') : '<p style="text-align:center;color:var(--text-muted);padding:48px 0;grid-column:1/-1;">No articles found for this topic yet.</p>'}
          </div>
        </div>
      </section>
    `;
  },
  
  // ===== ABOUT PAGE =====
  renderAboutPage() {
    const el = document.getElementById('main-content');
    if (!el) return;
    
    const about = ContentManager.getAbout();
    if (!about) {
      el.innerHTML = '<div class="container" style="padding:100px 0;text-align:center;"><h1>About</h1><p>Content unavailable.</p></div>';
      return;
    }
    
    el.innerHTML = `
      <div class="about-container container">
        <div class="about-hero">
          <h1 class="about-hero-title">${about.title || 'About'}</h1>
          <p class="about-hero-subtitle">${about.subtitle || ''}</p>
        </div>
        <p class="about-description">${about.description || ''}</p>
        
        ${about.mission && about.vision ? `
          <div class="about-section">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:32px;">
              <div style="padding:32px;background:var(--surface);border-radius:12px;box-shadow:0 2px 8px var(--shadow);">
                <h3 style="color:var(--primary);margin-bottom:16px;">${about.mission.title}</h3>
                <p style="color:var(--text-secondary);line-height:1.8;">${about.mission.content}</p>
              </div>
              <div style="padding:32px;background:var(--surface);border-radius:12px;box-shadow:0 2px 8px var(--shadow);">
                <h3 style="color:var(--primary);margin-bottom:16px;">${about.vision.title}</h3>
                <p style="color:var(--text-secondary);line-height:1.8;">${about.vision.content}</p>
              </div>
            </div>
          </div>
        ` : ''}
        
        ${about.stats ? `
          <div class="about-stats">
            ${Object.entries(about.stats).map(([k, v]) => `<div class="about-stat"><div class="about-stat-number">${v}</div><div class="about-stat-label">${k.replace(/([A-Z])/g, ' $1').trim()}</div></div>`).join('')}
          </div>
        ` : ''}
        
        ${about.values ? `
          <div class="about-section">
            <h2 class="about-section-title">Our Values</h2>
            <div class="about-values">
              ${about.values.map(v => `<div class="about-value-card"><div class="about-value-icon">${this.getIcon(v.icon || 'star')}</div><h3 class="about-value-title">${v.title}</h3><p class="about-value-description">${v.description}</p></div>`).join('')}
            </div>
          </div>
        ` : ''}
        
        ${about.team?.members ? `
          <div class="about-section">
            <h2 class="about-section-title">Our Team</h2>
            <div class="about-team">
              ${about.team.members.map(m => `
                <div class="about-team-member">
                  <div class="about-team-avatar">${m.name.split(' ').map(n => n[0]).join('')}</div>
                  <h3 class="about-team-name">${m.name}</h3>
                  <p class="about-team-role">${m.role}</p>
                  <p class="about-team-specialization">${m.specialization || ''}</p>
                  <p class="about-team-bio">${m.bio || ''}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${about.history?.milestones ? `
          <div class="about-section">
            <h2 class="about-section-title">Our Journey</h2>
            <div style="max-width:600px;margin:0 auto;">
              ${about.history.milestones.map((m, i) => `
                <div style="display:flex;gap:24px;margin-bottom:24px;padding-bottom:24px;border-bottom:${i < about.history.milestones.length - 1 ? '1px solid var(--border)' : 'none'};">
                  <div style="font-size:1.5rem;font-weight:700;color:var(--primary);min-width:60px;">${m.year}</div>
                  <div style="color:var(--text-secondary);line-height:1.6;">${m.event}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },
  
  // ===== GLOSSARY PAGE =====
  renderGlossaryPage() {
    const el = document.getElementById('main-content');
    if (!el) return;
    
    const glossary = ContentManager.getGlossaryByLetter();
    const letters = Object.keys(glossary);
    
    el.innerHTML = `
      <div class="glossary-container container">
        <div class="section-header">
          <h1 class="section-title">Islamic Finance Glossary</h1>
          <p class="section-subtitle">A comprehensive glossary of Islamic finance terms.</p>
        </div>
        <div class="glossary-search">
          <div class="glossary-search-icon">${this.getIcon('search')}</div>
          <input type="text" class="glossary-search-input" placeholder="Search terms..." id="glossary-search-input" oninput="App.searchGlossary(this.value)">
        </div>
        ${letters.length > 0 ? `
          <div class="glossary-letter-nav">
            ${letters.map(l => `<button class="glossary-letter-btn" onclick="document.getElementById('glossary-${l}').scrollIntoView({behavior:'smooth'})">${l}</button>`).join('')}
          </div>
        ` : ''}
        <div id="glossary-content">
          ${letters.map(letter => `
            <div class="glossary-group" id="glossary-${letter}">
              <h2 class="glossary-group-title">${letter}</h2>
              ${glossary[letter].map(t => `
                <div class="glossary-item">
                  <h3 class="glossary-item-term">${t.term}</h3>
                  ${t.arabic ? `<p class="glossary-item-arabic">${t.arabic}</p>` : ''}
                  ${t.pronunciation ? `<p class="glossary-item-pronunciation">${t.pronunciation}</p>` : ''}
                  <p class="glossary-item-definition">${t.definition}</p>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  // ===== FAQs PAGE =====
  renderFAQsPage() {
    const el = document.getElementById('main-content');
    if (!el) return;
    
    el.innerHTML = `
      <div class="faqs-container container">
        <div class="section-header">
          <h1 class="section-title">Frequently Asked Questions</h1>
          <p class="section-subtitle">Find answers to common questions about Islamic finance.</p>
        </div>
        ${ContentManager.getFAQs().map(cat => `
          <div class="faq-category">
            <h2 class="faq-category-title">${cat.category}</h2>
            ${cat.questions.map(q => `
              <div class="faq-item">
                <div class="faq-question" onclick="App.toggleFAQ(this)">
                  <span class="faq-question-text">${q.question}</span>
                  <span class="faq-question-icon">${this.getIcon('chevron-down')}</span>
                </div>
                <div class="faq-answer"><p>${q.answer}</p></div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `;
  },
  
  // ===== DOWNLOADS PAGE =====
  renderDownloadsPage() {
    const el = document.getElementById('main-content');
    if (!el) return;
    
    el.innerHTML = `
      <div class="downloads-container container">
        <div class="section-header">
          <h1 class="section-title">Templates & Tools</h1>
          <p class="section-subtitle">Professional templates and practical tools for Islamic finance practitioners.</p>
        </div>
        <div class="downloads-grid">
          ${ContentManager.getDownloads().map(d => `
            <div class="download-card">
              <div class="download-card-image">
                <img src="${d.image}" alt="${d.name}" loading="lazy" onerror="this.style.display='none'">
                <span class="download-card-format">${d.format}</span>
              </div>
              <div class="download-card-content">
                <h3 class="download-card-title">${d.name}</h3>
                <p class="download-card-description">${d.description}</p>
                <div class="download-card-meta">
                  <span>${d.size}</span>
                  <span>${(d.downloadCount || 0).toLocaleString()} downloads</span>
                </div>
                <button class="download-card-btn" onclick="App.showToast('Downloading ${d.name}...','success')">
                  ${this.getIcon('download')} Download ${d.format.toUpperCase()}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  // ===== SEARCH PAGE =====
  renderSearchPage() {
    const el = document.getElementById('main-content');
    if (!el) return;
    el.innerHTML = `
      <section class="section"><div class="container"><div class="section-header"><h1 class="section-title">Search</h1></div>
        <div style="max-width:600px;margin:0 auto;">
          <input type="text" class="form-input" placeholder="Search..." id="page-search-input" style="width:100%;margin-bottom:32px;" oninput="App.handlePageSearch(this.value)">
          <div id="page-search-results"><p style="text-align:center;color:var(--text-muted);">Enter a search term.</p></div>
        </div>
      </div></section>
    `;
  },
  
  // ===== ACTIONS =====
  toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('active');
    document.getElementById('menu-toggle')?.classList.toggle('active');
    document.body.style.overflow = document.getElementById('sidebar')?.classList.contains('open') ? 'hidden' : '';
  },
  
  closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
    document.getElementById('menu-toggle')?.classList.remove('active');
    document.body.style.overflow = '';
  },
  
  toggleNavItem(el) {
    const item = el.closest('.nav-item');
    if (!item) return;
    document.querySelectorAll('.nav-item.open').forEach(i => { if (i !== item) i.classList.remove('open'); });
    item.classList.toggle('open');
  },
  
  navigateTo(path) {
    this.closeSidebar();
    Router.navigate(path);
  },
  
  openSearch() {
    document.getElementById('search-modal')?.classList.add('active');
    setTimeout(() => document.getElementById('search-input')?.focus(), 300);
  },
  
  closeSearch() {
    document.getElementById('search-modal')?.classList.remove('active');
  },
  
  // ===== SEARCH =====
  handleSearch(query) {
    const container = document.getElementById('search-results');
    if (!container) return;
    
    if (!query || query.length < 2) {
      container.innerHTML = `<div class="search-empty">${this.getIcon('search')}<h3>Start typing to search</h3></div>`;
      return;
    }
    
    const results = ContentManager.searchPostsWithHighlight(query);
    this.renderSearchResults(results, query, container);
  },
  
  renderSearchResults(results, query, container) {
    if (results.length === 0) {
      container.innerHTML = `<div class="search-empty">${this.getIcon('search')}<h3>No results found</h3><p>Try different keywords.</p></div>`;
      return;
    }
    
    const escQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escQ})`, 'gi');
    const labels = { title: 'Title', excerpt: 'Description', tags: 'Tag', content: 'Content', subtopic: 'Topic' };
    const classes = { title: 'title-match', excerpt: 'excerpt-match', tags: 'tag-match', content: 'content-match', subtopic: 'subtopic-match' };
    
    container.innerHTML = results.map(r => {
      const post = r.post;
      const cat = ContentManager.getCategoryById(post.category);
      const badges = r.matchSources.map(s => `<span class="search-match-badge ${classes[s] || ''}">${labels[s] || s}</span>`).join('');
      const title = r.matchSources.includes('title') ? post.title.replace(regex, '<mark>$1</mark>') : post.title;
      const excerpt = r.matchSources.includes('excerpt') ? (post.excerpt || '').replace(regex, '<mark>$1</mark>') : (post.excerpt || '');
      const snippet = r.matchSources.includes('content') && r.contentSnippet ? 
        `<div class="search-content-snippet"><span class="snippet-label">Found in article:</span><p class="snippet-text">${r.contentSnippet.replace(regex, '<mark>$1</mark>')}</p></div>` : '';
      
      return `<div class="search-result-item" onclick="App.closeSearch();App.navigateTo('/post/${post.slug}')">
        <div class="search-result-header">
          <div class="search-result-category">${cat?.title || post.category}</div>
          <div class="search-match-indicators">${badges}</div>
        </div>
        <h3 class="search-result-title">${title}</h3>
        <p class="search-result-excerpt">${excerpt}</p>
        ${snippet}
      </div>`;
    }).join('');
  },
  
  handleHeroSearch() {
    const input = document.getElementById('hero-search-input');
    if (input?.value.trim()) {
      StorageManager.addSearchHistory(input.value.trim());
      this.openSearch();
      const si = document.getElementById('search-input');
      if (si) { si.value = input.value.trim(); this.handleSearch(input.value.trim()); }
    }
  },
  
  handlePageSearch(query) {
    const c = document.getElementById('page-search-results');
    if (!c) return;
    if (!query || query.length < 2) { c.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Enter a search term.</p>'; return; }
    const results = ContentManager.searchPostsWithHighlight(query);
    c.innerHTML = results.length > 0 ? results.map(r => this.renderPostCard(r.post)).join('') : '<p style="text-align:center;color:var(--text-muted);">No results found.</p>';
  },
  
  filterPosts(cat, btn) {
    document.querySelectorAll('.category-filter-btn').forEach(b => b.classList.remove('active'));
    btn?.classList.add('active');
    const posts = cat === 'all' ? ContentManager.getRecentPosts(9) : ContentManager.getPostsByCategory(cat);
    const grid = document.getElementById('posts-grid');
    if (grid) grid.innerHTML = posts.length > 0 ? posts.map(p => this.renderPostCard(p)).join('') : '<p style="text-align:center;color:var(--text-muted);padding:48px 0;grid-column:1/-1;">No articles found.</p>';
  },
  
  filterBySubtopic(catId, subId, btn) {
    document.querySelectorAll('.category-filter-btn').forEach(b => b.classList.remove('active'));
    btn?.classList.add('active');
    const posts = subId === 'all' ? ContentManager.getPostsByCategory(catId) : ContentManager.getPostsBySubtopic(subId);
    const grid = document.getElementById('category-posts-grid');
    if (grid) grid.innerHTML = posts.length > 0 ? posts.map(p => this.renderPostCard(p)).join('') : '<p style="text-align:center;color:var(--text-muted);padding:48px 0;grid-column:1/-1;">No articles found.</p>';
  },
  
  toggleTheme() {
    const t = ThemeManager.toggleTheme();
    ThemeManager.markManualSelection();
    this.showToast(`Theme: ${ThemeManager.getThemeName(t)}`, 'success');
  },
  
  toggleContactModal() { document.getElementById('contact-modal')?.classList.toggle('active'); },
  closeContactModal() { document.getElementById('contact-modal')?.classList.remove('active'); },
  toggleFAQ(el) { el.closest('.faq-item')?.classList.toggle('open'); },
  searchByTag(tag) { this.openSearch(); const si = document.getElementById('search-input'); if (si) { si.value = tag; this.handleSearch(tag); } },
  
  // ===== FORMS (WEB3FORMS) =====
  async handleContactSubmit(form) {
    const name = form.querySelector('[name="name"]')?.value.trim();
    const email = form.querySelector('[name="email"]')?.value.trim();
    const message = form.querySelector('[name="message"]')?.value.trim();
    const btn = form.querySelector('.form-submit');
    
    if (!name || !email || !message) { this.showToast('Please fill in all fields', 'error'); return; }
    
    btn.disabled = true; btn.textContent = 'Sending...';
    
    const accessKey = ContentManager.getWeb3FormsKey();
    
    if (!accessKey || accessKey === 'YOUR_ACCESS_KEY_HERE') {
      const subject = encodeURIComponent(`Finance ISL Contact from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
      window.open(`mailto:${ContentManager.getContactEmail()}?subject=${subject}&body=${body}`);
      this.showToast('Opening email client...', 'info');
      StorageManager.saveContactForm({ name, email, message });
      form.reset(); this.closeContactModal();
      btn.disabled = false; btn.textContent = 'Send Message';
      return;
    }
    
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_key: accessKey, name, email, message, subject: `Finance ISL Contact from ${name}`, from_name: 'Finance ISL Website' })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast('Message sent successfully!', 'success');
        form.reset(); this.closeContactModal();
      } else throw new Error('Failed');
    } catch (err) {
      this.showToast('Failed. Opening email client...', 'warning');
      const subject = encodeURIComponent(`Finance ISL Contact from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
      window.open(`mailto:${ContentManager.getContactEmail()}?subject=${subject}&body=${body}`);
    }
    
    btn.disabled = false; btn.textContent = 'Send Message';
  },
  
  async handleNewsletterSubmit(form) {
    const name = form.querySelector('[name="name"]')?.value.trim();
    const email = form.querySelector('[name="email"]')?.value.trim();
    if (!name || !email) { this.showToast('Please fill in all fields', 'error'); return; }
    
    StorageManager.saveNewsletterSubscriber({ name, email });
    
    const accessKey = ContentManager.getWeb3FormsKey();
    
    if (!accessKey || accessKey === 'YOUR_ACCESS_KEY_HERE') {
      const subject = encodeURIComponent(`New Newsletter Subscriber: ${name}`);
      const body = encodeURIComponent(`New Newsletter Subscription\n\nName: ${name}\nEmail: ${email}\nDate: ${new Date().toLocaleString()}`);
      window.open(`mailto:${ContentManager.getContactEmail()}?subject=${subject}&body=${body}`);
      this.showToast(`Thank you ${name}!`, 'success');
      form.reset();
      return;
    }
    
    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_key: accessKey, name, email, message: `New Newsletter Subscription\n\nName: ${name}\nEmail: ${email}\nDate: ${new Date().toLocaleString()}`, subject: `New Subscriber: ${name}`, from_name: 'Finance ISL Newsletter' })
      });
    } catch (err) {}
    
    this.showToast(`Thank you ${name}!`, 'success');
    form.reset();
  },
  
  // ===== PULL TO REFRESH =====
  setupPullToRefresh() {
    let startY = 0, pulling = false;
    const main = document.getElementById('main-content');
    if (!main) return;
    
    main.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) { startY = e.touches[0].pageY; pulling = true; }
    });
    
    main.addEventListener('touchmove', (e) => {
      if (!pulling) return;
      if (e.touches[0].pageY - startY > 100) {
        document.getElementById('pull-to-refresh')?.classList.add('active');
      }
    });
    
    main.addEventListener('touchend', async () => {
      const ptr = document.getElementById('pull-to-refresh');
      if (ptr?.classList.contains('active')) {
        this.showToast('Refreshing...', 'info');
        try {
          await ContentManager.init();
          this.renderUI();
          Router.handleRouteChange();
          this.showToast('Content updated!', 'success');
        } catch (e) {
          this.showToast('Using cached content', 'warning');
        }
        ptr.classList.remove('active');
      }
      pulling = false;
    });
  },
  
  // ===== CONNECTIVITY =====
  setupConnectivityDetection() {
    const banner = document.getElementById('offline-banner');
    window.addEventListener('online', () => {
      this.isOnline = true;
      banner?.classList.remove('visible');
      this.showToast('Back online!', 'success');
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      banner?.classList.add('visible');
    });
    if (!navigator.onLine) banner?.classList.add('visible');
  },
  
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try { await navigator.serviceWorker.register('/sw.js'); } catch (e) {}
    }
  },
  
  showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `toast toast-${type} visible`;
    setTimeout(() => t.classList.remove('visible'), 4000);
  },
  
  hideLoadingScreen() {
    const ls = document.getElementById('loading-screen');
    if (ls) { ls.style.opacity = '0'; setTimeout(() => ls.style.display = 'none', 300); }
  },
  
  share(platform, title) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title || document.title);
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}`
    };
    if (urls[platform]) window.open(urls[platform], '_blank');
  },
  
  copyLink() {
    navigator.clipboard?.writeText(window.location.href).then(() => this.showToast('Link copied!', 'success'));
  },
  
  searchGlossary(query) {
    const terms = ContentManager.searchGlossary(query);
    const c = document.getElementById('glossary-content');
    if (!c) return;
    if (terms.length === 0) { c.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:48px 0;">No terms found.</p>'; return; }
    
    const grouped = {};
    terms.forEach(t => { const l = t.term.charAt(0).toUpperCase(); if (!grouped[l]) grouped[l] = []; grouped[l].push(t); });
    
    c.innerHTML = Object.keys(grouped).sort().map(letter => `
      <div class="glossary-group" id="glossary-${letter}">
        <h2 class="glossary-group-title">${letter}</h2>
        ${grouped[letter].map(t => `
          <div class="glossary-item">
            <h3 class="glossary-item-term">${t.term}</h3>
            ${t.arabic ? `<p class="glossary-item-arabic">${t.arabic}</p>` : ''}
            ${t.pronunciation ? `<p class="glossary-item-pronunciation">${t.pronunciation}</p>` : ''}
            <p class="glossary-item-definition">${t.definition}</p>
          </div>
        `).join('')}
      </div>
    `).join('');
  },
  
  getIcon(name) {
    const icons = {
      'menu': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
      'close': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      'search': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      'sun': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
      'moon': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
      'leaf': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75"/></svg>',
      'star': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
      'briefcase': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      'bank': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 22 7 12 2"/><line x1="2" y1="17" x2="22" y2="17"/><line x1="2" y1="7" x2="2" y2="17"/><line x1="22" y1="7" x2="22" y2="17"/><line x1="7" y1="7" x2="7" y2="17"/><line x1="12" y1="7" x2="12" y2="17"/><line x1="17" y1="7" x2="17" y2="17"/><line x1="2" y1="22" x2="22" y2="22"/></svg>',
      'balance': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"/><path d="M5 8l7-5 7 5"/><path d="M5 8v8a3 3 0 0 0 3 3h1"/><path d="M19 8v8a3 3 0 0 1-3 3h-1"/></svg>',
      'book': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
      'info': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      'chevron-down': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
      'arrow-up': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
      'download': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
      'twitter': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>',
      'facebook': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
      'linkedin': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
      'link': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
      'refresh': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
      'users': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      'heart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      'lightbulb': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>',
      'shield': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      'file': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>'
    };
    return icons[name] || icons['file'];
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());