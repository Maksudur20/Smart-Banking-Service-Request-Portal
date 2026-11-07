/* ====================================================================
   SMART BANKING SERVICE REQUEST PORTAL - AUTH & ROUTE GUARD
   Handles Authentication, Role-based Route Protection, and Logout
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
      window.location.href = isTryingAdmin ? '/admin-login.html' : '/login.html';
      return false;
    }

    const user = this.getUser();

    if (requiredRole && user.role !== requiredRole) {
      if (user.role === 'ADMIN') {
        window.location.href = '/admin/admin-dashboard.html';
      } else {
        window.location.href = '/customer/dashboard.html';
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
        window.location.href = '/admin/admin-dashboard.html';
      } else {
        window.location.href = '/customer/dashboard.html';
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
      if (window.api) {
        window.api.clearSession();
      } else {
        localStorage.clear();
      }
      window.location.href = '/login.html';
    }
  }
};

window.Auth = Auth;

