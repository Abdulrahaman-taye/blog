// Finance ISL - Router
const Router = {
  routes: {},
  currentRoute: '/',
  previousRoute: null,
  history: [],
  
  init() {
    window.addEventListener('hashchange', () => this.handleRouteChange());
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.route) this.handleRoute(e.state.route, false);
    });
    this.handleRouteChange();
  },
  
  register(path, handler) {
    this.routes[path] = handler;
  },
  
  navigate(path, addToHistory = true) {
    if (this.currentRoute) {
      StorageManager.saveScrollPosition(this.currentRoute, window.scrollY);
    }
    if (addToHistory) {
      window.history.pushState({ route: path }, '', '#' + path);
      this.history.push(this.currentRoute);
    }
    this.previousRoute = this.currentRoute;
    this.currentRoute = path;
    this.handleRoute(path, addToHistory);
  },
  
  handleRouteChange() {
    const hash = window.location.hash.slice(1) || '/';
    this.handleRoute(hash, false);
  },
  
  handleRoute(path, addToHistory = true) {
    StorageManager.saveLastVisited(path);
    const { route, params } = this.parseRoute(path);
    const handler = this.findRouteHandler(route);
    
    if (handler) {
      try {
        handler(params);
      } catch (err) {
        console.error('[Router] Handler error:', err);
      }
      const savedPos = StorageManager.getScrollPosition(path);
      if (savedPos && !addToHistory) {
        setTimeout(() => window.scrollTo(0, savedPos), 100);
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      this.handle404();
    }
  },
  
  // FIXED: subtopic check comes FIRST
  parseRoute(path) {
    const parts = path.split('/').filter(p => p);
    const params = {};
    let route = '/';
    
    if (parts.length === 0) return { route: '/', params };
    
    // MUST check subtopic BEFORE category
    if (parts[0] === 'category' && parts.length >= 4 && parts[2] === 'subtopic') {
      route = '/category/:id/subtopic/:subtopic';
      params.id = parts[1];
      params.subtopic = parts[3];
    } else if (parts[0] === 'post' && parts[1]) {
      route = '/post/:slug';
      params.slug = parts[1];
    } else if (parts[0] === 'category' && parts[1]) {
      route = '/category/:id';
      params.id = parts[1];
    } else if (['about', 'glossary', 'faqs', 'downloads', 'search'].includes(parts[0])) {
      route = '/' + parts[0];
    }
    
    return { route, params };
  },
  
  findRouteHandler(route) {
    if (this.routes[route]) return this.routes[route];
    
    const routeParts = route.split('/').filter(p => p);
    
    for (const [pattern, handler] of Object.entries(this.routes)) {
      const patternParts = pattern.split('/').filter(p => p);
      if (patternParts.length !== routeParts.length) continue;
      
      let match = true;
      for (let i = 0; i < patternParts.length; i++) {
        if (!patternParts[i].startsWith(':') && patternParts[i] !== routeParts[i]) {
          match = false;
          break;
        }
      }
      
      if (match) return handler;
    }
    
    return null;
  },
  
  handle404() {
    const el = document.getElementById('main-content');
    if (el) {
      el.innerHTML = `
        <div class="container" style="padding:100px 0;text-align:center;">
          <h1 style="font-size:4rem;color:var(--primary);">404</h1>
          <h2>Page Not Found</h2>
          <p style="color:var(--text-secondary);margin:16px 0 32px;">The page doesn't exist.</p>
          <a href="#/" class="btn btn-primary">Go Home</a>
        </div>`;
    }
  }
};