/* ====================================================================
   SMART BANKING SERVICE REQUEST PORTAL - AUTH & ROUTE GUARD
   Handles Authentication, Role-based Route Protection, and Logout.
   Strict Banking Security Rule: Any Back or Forward browser navigation
   terminates the authenticated session and forces re-entry of
   User ID / Email and Password across all roles (Admin & Customer).
   ==================================================================== */

const Auth = {
  getToken() {
    return window.api ? window.api.getToken() : localStorage.getItem('smart_bank_token');
  },

  getUser() {
    return window.api ? window.api.getUser() : JSON.parse(localStorage.getItem('smart_bank_user') || 'null');
  },

  isLoggedIn() {
    return Boolean(this.getToken() && this.getUser());
  },

  isAdmin() {
    const user = this.getUser();
    return Boolean(user && user.role === 'ADMIN');
  },

  isCustomer() {
    const user = this.getUser();
    return Boolean(user && user.role === 'CUSTOMER');
  },

  /**
   * Terminate session on any Back/Forward navigation
   * Enforces banking security: every back/forward movement requires re-entering ID/Email and Password.
   */
  forceLogoutOnBackForward(reason = 'back_forward_nav') {
    const user = this.getUser();
    const isAdminPath = window.location.pathname.includes('/admin/') || (user && user.role === 'ADMIN');

    // Wipe token and user from storage immediately
    if (window.api) {
      window.api.clearSession();
    }
    try {
      localStorage.removeItem('smart_bank_token');
      localStorage.removeItem('smart_bank_user');
      sessionStorage.clear();
    } catch (e) {}

    // Asynchronously notify backend server
    try {
      if (window.api && typeof window.api.post === 'function') {
        window.api.post('/api/auth/logout', {}).catch(() => {});
      }
    } catch (e) {}

    // Determine target login page
    const targetUrl = isAdminPath 
      ? '/admin-login.html?session=expired&reason=back_nav' 
      : '/login.html?session=expired&reason=back_nav';

    // Replace history entry so user cannot forward/back into protected state
    window.location.replace(targetUrl);
  },

  /**
   * Trap browser Back and Forward button events on protected pages
   */
  trapBackForward() {
    if (window._bfTrapped) return;
    window._bfTrapped = true;

    // 1. Check if page was loaded via Back/Forward navigation
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0 && navEntries[0].type === 'back_forward') {
        this.forceLogoutOnBackForward('history_load');
        return;
      }
      if (window.performance && window.performance.navigation && window.performance.navigation.type === 2) {
        this.forceLogoutOnBackForward('history_load');
        return;
      }
    } catch (e) {}

    // 2. Listen to bfcache restore (browser Back-Forward Cache)
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        this.forceLogoutOnBackForward('bfcache');
      }
    });

    // 3. Push a state and listen for popstate (user clicks Back or Forward in browser)
    try {
      window.history.pushState({ protectedPage: true, path: window.location.pathname }, '', window.location.href);
    } catch (e) {}

    window.addEventListener('popstate', (event) => {
      // User pressed the browser Back or Forward button!
      this.forceLogoutOnBackForward('popstate_back_forward');
    });
  },

  /**
   * Route Guard - Call on top of protected pages
   */
  requireAuth(requiredRole = null) {
    // Check back/forward navigation first
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0 && navEntries[0].type === 'back_forward') {
        this.forceLogoutOnBackForward('back_forward_entry');
        return false;
      }
      if (window.performance && window.performance.navigation && window.performance.navigation.type === 2) {
        this.forceLogoutOnBackForward('back_forward_entry');
        return false;
      }
    } catch (e) {}

    if (!this.isLoggedIn()) {
      const isTryingAdmin = window.location.pathname.includes('/admin/') || window.location.pathname.includes('admin');
      window.location.replace(isTryingAdmin ? '/admin-login.html' : '/login.html');
      return false;
    }

    const user = this.getUser();

    if (requiredRole && user.role !== requiredRole) {
      if (user.role === 'ADMIN') {
        window.location.replace('/admin/admin-dashboard.html');
      } else {
        window.location.replace('/customer/dashboard.html');
      }
      return false;
    }

    // Attach trap for subsequent Back/Forward clicks while browsing
    this.trapBackForward();

    return true;
  },

  /**
   * Redirect if already logged in (call on login/register pages)
   */
  redirectIfAuthenticated() {
    // If arriving with reason=back_nav or session=expired, ALWAYS clear token and force login
    if (window.location.search.includes('reason=back_nav') || window.location.search.includes('session=expired')) {
      if (window.api) window.api.clearSession();
      try {
        localStorage.removeItem('smart_bank_token');
        localStorage.removeItem('smart_bank_user');
        sessionStorage.clear();
      } catch (e) {}
      return;
    }

    if (this.isLoggedIn()) {
      const user = this.getUser();
      if (user.role === 'ADMIN') {
        window.location.replace('/admin/admin-dashboard.html');
      } else {
        window.location.replace('/customer/dashboard.html');
      }
    }
  },

  /**
   * Global Logout
   */
  async logout() {
    try {
      if (window.api && this.getToken()) {
        await window.api.post('/api/auth/logout', {});
      }
    } catch (e) {
      // Continue client-side logout even if server fails
    } finally {
      const isAdmin = this.isAdmin();
      if (window.api) {
        window.api.clearSession();
      } else {
        localStorage.clear();
      }
      try { sessionStorage.clear(); } catch (e) {}
      window.location.replace(isAdmin ? '/admin-login.html' : '/login.html');
    }
  }
};

window.Auth = Auth;
