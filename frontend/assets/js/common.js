/* ====================================================================
   SMART BANKING SERVICE REQUEST PORTAL - COMMON UI UTILITIES
   Sidebar, Navigation, Status Badges, and Formatters
   ==================================================================== */

const UI = {
  /**
   * Generates color-coded status badge HTML matching blueprint Section 10
   */
  renderStatusBadge(status) {
    const s = status || 'Draft';
    let badgeClass = 'badge-draft';

    switch (s) {
      case 'Submitted':
        badgeClass = 'badge-submitted';
        break;
      case 'Document Review':
        badgeClass = 'badge-doc-review';
        break;
      case 'AI Validation':
        badgeClass = 'badge-ai-validation';
        break;
      case 'Pending Admin Review':
        badgeClass = 'badge-pending-admin';
        break;
      case 'Approved':
        badgeClass = 'badge-approved';
        break;
      case 'Completed':
        badgeClass = 'badge-completed';
        break;
      case 'Correction Required':
        badgeClass = 'badge-correction';
        break;
      case 'Rejected':
        badgeClass = 'badge-rejected';
        break;
      case 'Cancelled':
        badgeClass = 'badge-cancelled';
        break;
      case 'Open':
        badgeClass = 'badge-submitted';
        break;
      case 'In Review':
        badgeClass = 'badge-doc-review';
        break;
      case 'Resolved':
        badgeClass = 'badge-completed';
        break;
      case 'Closed':
        badgeClass = 'badge-draft';
        break;
      case 'Suspicious':
        badgeClass = 'badge-rejected';
        break;
      case 'Under_Review':
        badgeClass = 'badge-doc-review';
        break;
      case 'Normal':
        badgeClass = 'badge-approved';
        break;
      default:
        badgeClass = 'badge-draft';
    }

    return `<span class="badge ${badgeClass}">${s}</span>`;
  },

  /**
   * Format ISO date string into readable format: "Nov 7, 2026, 03:30 PM"
   */
  formatDateTime(isoString) {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatDateOnly(isoString) {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  /**
   * Format currency amount: "BDT 25,000.00"
   */
  formatCurrency(amount, currency = 'BDT') {
    const num = parseFloat(amount || 0);
    return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  /**
   * Renders Customer Sidebar into container with id="app-sidebar"
   */
  renderCustomerSidebar(activePage = '') {
    const user = window.Auth.getUser() || {};
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;

    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <div class="brand-icon">SB</div>
        <div>
          <span class="brand-text">Smart Banking</span>
          <span class="brand-sub">Customer Portal</span>
        </div>
      </div>
      <div class="sidebar-nav">
        <span class="nav-section-title">Menu</span>
        <a href="/customer/dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
          <span>📊</span> Dashboard
        </a>
        <a href="/customer/services.html" class="nav-item ${activePage === 'services' ? 'active' : ''}">
          <span>🏦</span> Banking Services
        </a>
        <a href="/customer/service-request.html" class="nav-item ${activePage === 'new-request' ? 'active' : ''}">
          <span>📝</span> New Service Request
        </a>
        <a href="/customer/requests.html" class="nav-item ${activePage === 'requests' ? 'active' : ''}">
          <span>📋</span> My Requests
        </a>
        
        <span class="nav-section-title">Support & Alerts</span>
        <a href="/customer/notifications.html" class="nav-item ${activePage === 'notifications' ? 'active' : ''}">
          <span>🔔</span> Notifications
          <span class="nav-badge" id="sidebar-unread-badge" style="display:none;">0</span>
        </a>
        <a href="/customer/complaints.html" class="nav-item ${activePage === 'complaints' ? 'active' : ''}">
          <span>💬</span> Complaints / Support
        </a>
        <a href="/customer/profile.html" class="nav-item ${activePage === 'profile' ? 'active' : ''}">
          <span>👤</span> My Profile
        </a>
      </div>
      <div class="sidebar-footer">
        <div class="user-mini-profile">
          <div class="user-avatar">${(user.full_name || 'C')[0].toUpperCase()}</div>
          <div class="user-info-text">
            <div class="user-name">${user.full_name || 'Customer'}</div>
            <div class="user-role-badge">${user.customer_reference || 'Customer'}</div>
          </div>
        </div>
        <button onclick="window.Auth.logout()" class="btn btn-secondary btn-sm" title="Log Out" style="padding: 6px 10px;">
          🚪
        </button>
      </div>
    `;

    this.updateNotificationBadge();
  },

  /**
   * Renders Admin Sidebar into container with id="app-sidebar"
   */
  renderAdminSidebar(activePage = '') {
    const user = window.Auth.getUser() || {};
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;

    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <div class="brand-icon" style="background: linear-gradient(135deg, #10b981, #047857);">SB</div>
        <div>
          <span class="brand-text">Smart Banking</span>
          <span class="brand-sub">Admin Operations</span>
        </div>
      </div>
      <div class="sidebar-nav">
        <span class="nav-section-title">Operations</span>
        <a href="/admin/admin-dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
          <span>📈</span> Admin Dashboard
        </a>
        <a href="/admin/admin-requests.html" class="nav-item ${activePage === 'requests' ? 'active' : ''}">
          <span>📑</span> Request Review Queue
        </a>
        <a href="/admin/admin-customers.html" class="nav-item ${activePage === 'customers' ? 'active' : ''}">
          <span>👥</span> Customer Directory
        </a>
        <a href="/admin/admin-services.html" class="nav-item ${activePage === 'services' ? 'active' : ''}">
          <span>⚙️</span> Service Catalog
        </a>

        <span class="nav-section-title">Oversight & Monitoring</span>
        <a href="/admin/admin-complaints.html" class="nav-item ${activePage === 'complaints' ? 'active' : ''}">
          <span>⚠️</span> Complaints Desk
        </a>
        <a href="/admin/admin-transactions.html" class="nav-item ${activePage === 'transactions' ? 'active' : ''}">
          <span>🔍</span> Transaction Monitoring
        </a>
        <a href="/admin/admin-reports.html" class="nav-item ${activePage === 'reports' ? 'active' : ''}">
          <span>📊</span> Reports & Analytics
        </a>
        <a href="/admin/admin-audit-logs.html" class="nav-item ${activePage === 'audit' ? 'active' : ''}">
          <span>🛡️</span> Security Audit Logs
        </a>
      </div>
      <div class="sidebar-footer">
        <div class="user-mini-profile">
          <div class="user-avatar" style="background:#047857;">${(user.full_name || 'A')[0].toUpperCase()}</div>
          <div class="user-info-text">
            <div class="user-name">${user.full_name || 'Officer'}</div>
            <div class="user-role-badge">Administrator</div>
          </div>
        </div>
        <button onclick="window.Auth.logout()" class="btn btn-secondary btn-sm" title="Log Out" style="padding: 6px 10px;">
          🚪
        </button>
      </div>
    `;
  },

  /**
   * Updates unread notification count
   */
  async updateNotificationBadge() {
    try {
      if (!window.Auth.isLoggedIn()) return;
      const res = await window.api.get('/api/notifications', { limit: 1 });
      const count = res.unreadCount || 0;

      const sidebarBadge = document.getElementById('sidebar-unread-badge');
      if (sidebarBadge) {
        if (count > 0) {
          sidebarBadge.innerText = count;
          sidebarBadge.style.display = 'inline-block';
        } else {
          sidebarBadge.style.display = 'none';
        }
      }

      const topDot = document.getElementById('top-notification-dot');
      if (topDot) {
        topDot.style.display = count > 0 ? 'block' : 'none';
      }
    } catch (e) {
      // Ignore background notification count check errors
    }
  }
};

window.UI = UI;

