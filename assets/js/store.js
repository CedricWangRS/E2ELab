/**
 * E2ELab — Store (localStorage wrapper)
 */
var Store = {
  prefix: 'e2elab:',

  get: function (key, fallback) {
    try {
      var val = localStorage.getItem(this.prefix + key);
      return val ? JSON.parse(val) : (fallback || null);
    } catch (e) { return fallback || null; }
  },

  set: function (key, value) {
    try { localStorage.setItem(this.prefix + key, JSON.stringify(value)); }
    catch (e) { console.warn('[E2ELab] Storage failed:', e); }
  },

  getTheme: function () { return this.get('theme', 'dark'); },
  setTheme: function (t) { this.set('theme', t); },
};

window.Store = Store;
