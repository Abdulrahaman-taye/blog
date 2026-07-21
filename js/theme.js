// Finance ISL - Theme Manager
const ThemeManager = {
  themes: ['light', 'dark', 'green', 'gold'],
  currentTheme: 'light',
  
  init() {
    const saved = StorageManager.getTheme();
    if (saved && this.themes.includes(saved)) {
      this.currentTheme = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.currentTheme = 'dark';
    }
    this.applyTheme(this.currentTheme);
  },
  
  applyTheme(theme) {
    if (!this.themes.includes(theme)) theme = 'light';
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    StorageManager.saveTheme(theme);
    const colors = { light: '#1a5632', dark: '#0f172a', green: '#065f46', gold: '#92400e' };
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', colors[theme] || colors.light);
  },
  
  toggleTheme() {
    const idx = this.themes.indexOf(this.currentTheme);
    const next = this.themes[(idx + 1) % this.themes.length];
    this.applyTheme(next);
    return this.currentTheme;
  },
  
  getThemeName(theme) {
    return { light: 'Light', dark: 'Dark', green: 'Emerald', gold: 'Golden' }[theme] || theme;
  },
  
  markManualSelection() {
    const p = StorageManager.loadPreferences();
    p.manuallySetTheme = true;
    StorageManager.savePreferences(p);
  }
};