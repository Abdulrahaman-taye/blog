// Finance ISL - Supabase Client
const SupabaseClient = {
  client: null,
  connected: false,
  
  init() {
    if (typeof ENV === 'undefined' || !ENV.SUPABASE_URL || ENV.SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
      console.log('[Supabase] No credentials configured, using JSON files');
      return false;
    }
    try {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      script.onload = () => {
        this.client = window.supabase.createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
        this.connected = true;
        console.log('[Supabase] Connected');
        window.dispatchEvent(new Event('supabase-ready'));
      };
      script.onerror = () => console.warn('[Supabase] Failed to load SDK');
      document.head.appendChild(script);
      return true;
    } catch (e) { console.warn('[Supabase] Init error:', e); return false; }
  },
  
  // DB helpers
  async fetchAll(table, orderBy, asc) {
    if (!this.connected || !this.client) return null;
    try {
      let q = this.client.from(table).select('*');
      if (orderBy) q = q.order(orderBy, { ascending: asc !== false });
      const { data, error } = await q;
      if (error) throw error;
      return data;
    } catch (e) { console.warn(`[Supabase] fetchAll(${table}):`, e); return null; }
  },
  
  async fetchOne(table, id) {
    if (!this.connected || !this.client) return null;
    try {
      const { data, error } = await this.client.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    } catch (e) { return null; }
  },
  
  async insert(table, row) {
    if (!this.connected || !this.client) return null;
    try {
      const { data, error } = await this.client.from(table).insert(row).select();
      if (error) throw error;
      return data;
    } catch (e) { console.warn(`[Supabase] insert(${table}):`, e); return null; }
  },
  
  async update(table, id, updates) {
    if (!this.connected || !this.client) return null;
    try {
      const { data, error } = await this.client.from(table).update(updates).eq('id', id).select();
      if (error) throw error;
      return data;
    } catch (e) { return null; }
  },
  
  async delete(table, id) {
    if (!this.connected || !this.client) return null;
    try {
      const { error } = await this.client.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) { return null; }
  },
  
  async getSetting(key) {
    if (!this.connected || !this.client) return null;
    try {
      const { data } = await this.client.from('settings').select('value').eq('key', key).single();
      return data ? data.value : null;
    } catch (e) { return null; }
  },
  
  // Save contact message to DB
  async saveContactMessage(name, email, message) {
    if (!this.connected || !this.client) return false;
    try {
      const { error } = await this.client.from('contact_messages').insert({ name, email, message });
      return !error;
    } catch (e) { return false; }
  },
  
  // Save newsletter subscriber to DB
  async saveSubscriber(name, email) {
    if (!this.connected || !this.client) return { success: false };
    try {
      const { data, error } = await this.client.from('newsletter_subscribers').insert({ name, email }).select();
      if (error) {
        if (error.code === '23505') return { success: false, duplicate: true };
        throw error;
      }
      return { success: true, data };
    } catch (e) { return { success: false }; }
  },
  
  // Storage helpers
  getPublicUrl(bucket, path) {
    if (!this.connected || !this.client) return null;
    try {
      const { data } = this.client.storage.from(bucket).getPublicUrl(path);
      return data ? data.publicUrl : null;
    } catch (e) { return null; }
  },
  
  async uploadFile(bucket, file, folder) {
    if (!this.connected || !this.client) return null;
    try {
      // Generate unique filename to avoid conflicts
      const ext = file.name.split('.').pop().toLowerCase();
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      const fileName = folder ? `${folder}/${baseName}-${uniqueId}.${ext}` : `${baseName}-${uniqueId}.${ext}`;
      
      const { data, error } = await this.client.storage.from(bucket).upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (error) throw error;
      return this.getPublicUrl(bucket, fileName);
    } catch (e) {
      console.warn('[Supabase] Upload error:', e);
      return null;
    }
  },
  
  async deleteFile(bucket, path) {
    if (!this.connected || !this.client) return null;
    try {
      const { error } = await this.client.storage.from(bucket).remove([path]);
      return !error;
    } catch (e) { return null; }
  },
  
  async listFiles(bucket, folder) {
    if (!this.connected || !this.client) return null;
    try {
      const { data } = await this.client.storage.from(bucket).list(folder || '');
      return data;
    } catch (e) { return null; }
  }
};
