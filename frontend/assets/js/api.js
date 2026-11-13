/* ====================================================================
   SMART BANKING SERVICE REQUEST PORTAL - API CLIENT
   Fetch API wrapper with Token and Toast Handling
   ==================================================================== */

const API_BASE_URL = window.location.origin.includes(':5000') 
  ? '' 
  : 'http://localhost:5000';

class ApiClient {
  constructor() {
    this.tokenKey = 'smart_bank_token';
    this.userKey = 'smart_bank_user';
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  getUser() {
    try {
      const data = localStorage.getItem(this.userKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  setUser(user) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = options.headers || {};

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        const isEn = (localStorage.getItem('smartbank_portal_lang') === 'en');
        if (endpoint.includes('/auth/login')) {
          let errData = {};
          try { errData = await response.json(); } catch (e) {}
          throw new Error(errData.message || (isEn ? 'Invalid email or password.' : 'ভুল ইমেইল বা পাসওয়ার্ড।'));
        }
        this.clearSession();
        // Redirect to login if on protected page
        if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
          window.location.href = window.location.pathname.includes('/admin/') ? '/admin-login.html' : '/login.html';
        }
        throw new Error(isEn ? 'Session expired. Please log in again.' : 'সেশন মেয়াদোত্তীর্ণ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।');
      }

      // If returning CSV or binary
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/csv')) {
        return response.blob();
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Global API instance
window.api = new ApiClient();

// Toast notification helper
window.showToast = function(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  // Auto-translate toast if UI dictionary is available
  if (window.UI && typeof window.UI.getLanguage === 'function' && window.UI.dictionary) {
    const lang = window.UI.getLanguage();
    if (lang === 'en' && window.UI.dictionary.bnToEn) {
      message = window.UI.dictionary.bnToEn[message] || message;
    } else if (lang === 'bn' && window.UI.dictionary.enToBn) {
      message = window.UI.dictionary.enToBn[message] || message;
    }
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

