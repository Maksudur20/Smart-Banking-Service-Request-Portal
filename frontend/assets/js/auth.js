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
   * Route Guard - Call on top of protected pages
   */
  requireAuth(requiredRole = null) {
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

    return true;
  },

  /**
   * Redirect if already logged in (call on login/register pages)
   */
  redirectIfAuthenticated() {
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
