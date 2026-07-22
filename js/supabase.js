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
      // Load Supabase from CDN (only dependency)
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      script.onload = () => {
        this.client = window.supabase.createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
        this.connected = true;
        console.log('[Supabase] Connected');
        window.dispatchEvent(new Event('supabase-ready'));
      };
      script.onerror = () => {
        console.warn('[Supabase] Failed to load SDK, using JSON fallback');
      };
      document.head.appendChild(script);
      return true;
    } catch (e) {
      console.warn('[Supabase] Init error:', e);
      return false;
    }
  },
  
  // Generic fetch from table
  async fetchAll(table, orderBy, ascending) {
    if (!this.connected || !this.client) return null;
    try {
      let query = this.client.from(table).select('*');
      if (orderBy) query = query.order(orderBy, { ascending: ascending !== false });
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn(`[Supabase] fetchAll(${table}) error:`, e);
      return null;
    }
  },
  
  async fetchOne(table, id) {
    if (!this.connected || !this.client) return null;
    try {
      const { data, error } = await this.client.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn(`[Supabase] fetchOne(${table}, ${id}) error:`, e);
      return null;
    }
  },
  
  async fetchWhere(table, column, value, orderBy) {
    if (!this.connected || !this.client) return null;
    try {
      let query = this.client.from(table).select('*').eq(column, value);
      if (orderBy) query = query.order(orderBy);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn(`[Supabase] fetchWhere error:`, e);
      return null;
    }
  },
  
  async insert(table, row) {
    if (!this.connected || !this.client) return null;
    try {
      const { data, error } = await this.client.from(table).insert(row).select();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn(`[Supabase] insert(${table}) error:`, e);
      return null;
    }
  },
  
  async update(table, id, updates) {
    if (!this.connected || !this.client) return null;
    try {
      const { data, error } = await this.client.from(table).update(updates).eq('id', id).select();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn(`[Supabase] update(${table}) error:`, e);
      return null;
    }
  },
  
  async delete(table, id) {
    if (!this.connected || !this.client) return null;
    try {
      const { error } = await this.client.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn(`[Supabase] delete(${table}) error:`, e);
      return null;
    }
  },
  
  async getSetting(key) {
    if (!this.connected || !this.client) return null;
    try {
      const { data, error } = await this.client.from('settings').select('value').eq('key', key).single();
      if (error) throw error;
      return data ? data.value : null;
    } catch (e) {
      return null;
    }
  },
  
  // Storage helpers
  getPublicUrl(bucket, path) {
    if (!this.connected || !this.client) return null;
    try {
      const { data } = this.client.storage.from(bucket).getPublicUrl(path);
      return data ? data.publicUrl : null;
    } catch (e) {
      return null;
    }
  },
  
  async uploadFile(bucket, path, file) {
    if (!this.connected || !this.client) return null;
    try {
      const { data, error } = await this.client.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      return this.getPublicUrl(bucket, path);
    } catch (e) {
      console.warn(`[Supabase] upload error:`, e);
      return null;
    }
  },
  
  async deleteFile(bucket, path) {
    if (!this.connected || !this.client) return null;
    try {
      const { error } = await this.client.storage.from(bucket).remove([path]);
      if (error) throw error;
      return true;
    } catch (e) {
      return null;
    }
  },
  
  async listFiles(bucket, folder) {
    if (!this.connected || !this.client) return null;
    try {
      const { data, error } = await this.client.storage.from(bucket).list(folder || '');
      if (error) throw error;
      return data;
    } catch (e) {
      return null;
    }
  }
};