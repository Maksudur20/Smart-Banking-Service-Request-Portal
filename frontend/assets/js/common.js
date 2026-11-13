/* ====================================================================
   SMART BANKING SERVICE REQUEST PORTAL - COMMON UI UTILITIES
   Sidebar, Navigation, Status Badges, and Floating AI Assistant
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
      case 'Cleared':
        badgeClass = 'badge-completed';
        break;
      default:
        badgeClass = 'badge-draft';
    }

    return `<span class="badge ${badgeClass}">${s}</span>`;
  },

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

  formatCurrency(amount, currency = 'BDT') {
    const num = parseFloat(amount || 0);
    return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  getLanguage() {
    return localStorage.getItem('smartbank_portal_lang') || 'bn';
  },

  setPortalLanguage(lang) {
    localStorage.setItem('smartbank_portal_lang', lang);
    localStorage.setItem('smartbank_ai_lang', lang);
    this.aiLang = lang;
    if (this.currentSidebarType === 'customer') {
      this.renderCustomerSidebar(this.activeSidebarPage);
    } else if (this.currentSidebarType === 'admin') {
      this.renderAdminSidebar(this.activeSidebarPage);
    }
    this.mountLanguageSwitcher();
    this.applyPortalTranslations();
    if (typeof window.onPortalLanguageChange === 'function') {
      try { window.onPortalLanguageChange(lang); } catch (e) {}
    }
  },

  mountLanguageSwitcher() {
    const lang = this.getLanguage();
    document.querySelectorAll('.lang-switch-pill').forEach(el => el.remove());

    const pill = document.createElement('div');
    pill.className = 'lang-switch-pill';
    pill.title = lang === 'bn' ? 'ভাষা পরিবর্তন (বাংলা / English)' : 'Switch Language (Bangla / English)';
    pill.innerHTML = `
      <button type="button" class="lang-btn ${lang === 'bn' ? 'active' : ''}" onclick="window.UI.setPortalLanguage('bn')">বাংলা</button>
      <button type="button" class="lang-btn ${lang === 'en' ? 'active' : ''}" onclick="window.UI.setPortalLanguage('en')">English</button>
    `;

    // Try finding top navbar right section
    let rightNav = document.querySelector('.top-navbar .top-nav-right');
    const topNavbar = document.querySelector('.top-navbar');
    const authHeader = document.querySelector('.auth-header');
    const landingNav = document.querySelector('.landing-nav-actions');

    if (!rightNav && topNavbar) {
      rightNav = document.createElement('div');
      rightNav.className = 'top-nav-right';
      topNavbar.appendChild(rightNav);
    }

    if (rightNav) {
      rightNav.insertBefore(pill, rightNav.firstChild);
    } else if (authHeader) {
      authHeader.appendChild(pill);
    } else if (landingNav) {
      landingNav.insertBefore(pill, landingNav.firstChild);
    }
  },

  applyPortalTranslations() {
    const lang = this.getLanguage();
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-bn][data-en]').forEach(el => {
      const txt = el.getAttribute(`data-${lang}`);
      if (txt) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = txt;
        } else {
          el.innerHTML = txt;
        }
      }
    });
  },

  /**
   * Renders Customer Sidebar into container with id="app-sidebar"
   */
  renderCustomerSidebar(activePage = '') {
    this.currentSidebarType = 'customer';
    this.activeSidebarPage = activePage;
    const lang = this.getLanguage();
    const user = window.Auth.getUser() || {};
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;

    const isBn = lang === 'bn';

    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <div class="brand-icon">SB</div>
        <div>
          <span class="brand-text">Smart Banking</span>
          <span class="brand-sub">${isBn ? 'গ্রাহক পোর্টাল' : 'Customer Portal'}</span>
        </div>
      </div>
      <div class="sidebar-nav">
        <span class="nav-section-title">${isBn ? 'ব্যাংকিং ও লেনদেন' : 'Banking & Transfers'}</span>
        <a href="/customer/dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
          <span>📊</span> ${isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}
        </a>
        <a href="/customer/deposit.html" class="nav-item ${activePage === 'deposit' ? 'active' : ''}">
          <span>📥</span> ${isBn ? 'টাকা ডিপোজিট' : 'Deposit Money'}
        </a>
        <a href="/customer/transfer.html" class="nav-item ${activePage === 'transfer' ? 'active' : ''}">
          <span>📤</span> ${isBn ? 'ফান্ড ট্রান্সফার' : 'Fund Transfer'}
        </a>
        <a href="/customer/kyc.html" class="nav-item ${activePage === 'kyc' ? 'active' : ''}">
          <span>🪪</span> ${isBn ? 'আমার কেওয়াইসি' : 'My KYC & Docs'}
        </a>

        <span class="nav-section-title">${isBn ? 'সেবা ও আবেদনসমূহ' : 'Services & Requests'}</span>
        <a href="/customer/services.html" class="nav-item ${activePage === 'services' ? 'active' : ''}">
          <span>🏦</span> ${isBn ? 'ব্যাংকিং সেবাসমূহ' : 'Banking Services'}
        </a>
        <a href="/customer/service-request.html" class="nav-item ${activePage === 'new-request' ? 'active' : ''}">
          <span>📝</span> ${isBn ? 'নতুন সেবার আবেদন' : 'New Service Request'}
        </a>
        <a href="/customer/requests.html" class="nav-item ${activePage === 'requests' ? 'active' : ''}">
          <span>📋</span> ${isBn ? 'আমার আবেদনসমূহ' : 'My Requests'}
        </a>
        <a href="/customer/account-closure.html" class="nav-item ${activePage === 'account-closure' ? 'active' : ''}">
          <span>🗂️</span> ${isBn ? 'অ্যাকাউন্ট ক্লোজার' : 'Account Closure'}
        </a>
        
        <span class="nav-section-title">${isBn ? 'সহায়তা ও প্রোফাইল' : 'Support & Profile'}</span>
        <a href="/customer/notifications.html" class="nav-item ${activePage === 'notifications' ? 'active' : ''}">
          <span>🔔</span> ${isBn ? 'নোটিফিকেশন' : 'Notifications'}
          <span class="nav-badge" id="sidebar-unread-badge" style="display:none;">0</span>
        </a>
        <a href="/customer/complaints.html" class="nav-item ${activePage === 'complaints' ? 'active' : ''}">
          <span>💬</span> ${isBn ? 'অভিযোগ ও সহায়তা' : 'Complaints / Support'}
        </a>
        <a href="/customer/profile.html" class="nav-item ${activePage === 'profile' ? 'active' : ''}">
          <span>👤</span> ${isBn ? 'আমার প্রোফাইল' : 'My Profile'}
        </a>
      </div>
      <div class="sidebar-footer">
        <div class="user-mini-profile">
          <div class="user-avatar">${(user.full_name || 'C')[0].toUpperCase()}</div>
          <div class="user-info-text">
            <div class="user-name">${user.full_name || (isBn ? 'গ্রাহক' : 'Customer')}</div>
            <div class="user-role-badge">${user.customer_reference || (isBn ? 'গ্রাহক' : 'Customer')}</div>
          </div>
        </div>
        <button onclick="window.Auth.logout()" class="btn btn-secondary btn-sm" title="${isBn ? 'লগআউট' : 'Log Out'}" style="padding: 6px 10px;">
          🚪
        </button>
      </div>
    `;

    this.updateNotificationBadge();
    this.initFloatingAIAssistant();
    this.mountLanguageSwitcher();
    this.applyPortalTranslations();
  },

  /**
   * Renders Admin Sidebar into container with id="app-sidebar"
   */
  renderAdminSidebar(activePage = '') {
    this.currentSidebarType = 'admin';
    this.activeSidebarPage = activePage;
    const lang = this.getLanguage();
    const user = window.Auth.getUser() || {};
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;

    const isBn = lang === 'bn';

    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <div class="brand-icon" style="background: linear-gradient(135deg, #0ea5e9, #0284c7);">SB</div>
        <div>
          <span class="brand-text">Smart Banking</span>
          <span class="brand-sub">${isBn ? 'অ্যাডমিন অপারেশনস' : 'Admin Operations'}</span>
        </div>
      </div>
      <div class="sidebar-nav">
        <span class="nav-section-title">${isBn ? 'ভেরিফিকেশন ও অপারেশনস' : 'Verification & Operations'}</span>
        <a href="/admin/admin-dashboard.html" class="nav-item ${activePage === 'dashboard' ? 'active' : ''}">
          <span>📈</span> ${isBn ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin Dashboard'}
        </a>
        <a href="/admin/admin-kyc.html" class="nav-item ${activePage === 'kyc' ? 'active' : ''}">
          <span>🪪</span> ${isBn ? 'কেওয়াইসি ভেরিফিকেশন' : 'KYC Verifications'}
        </a>
        <a href="/admin/admin-deposits.html" class="nav-item ${activePage === 'deposits' ? 'active' : ''}">
          <span>💵</span> ${isBn ? 'ডিপোজিট ভেরিফিকেশন' : 'Deposit Verifications'}
        </a>
        <a href="/admin/admin-account-closure.html" class="nav-item ${activePage === 'account-closure' ? 'active' : ''}">
          <span>🗂️</span> ${isBn ? 'অ্যাকাউন্ট ক্লোজার রিভিউ' : 'Account Closure Queue'}
        </a>
        <a href="/admin/admin-requests.html" class="nav-item ${activePage === 'requests' ? 'active' : ''}">
          <span>📑</span> ${isBn ? 'সার্ভিস আবেদন রিভিউ' : 'Request Review Queue'}
        </a>
        <a href="/admin/admin-customers.html" class="nav-item ${activePage === 'customers' ? 'active' : ''}">
          <span>👥</span> ${isBn ? 'গ্রাহক ডিরেক্টরি' : 'Customer Directory'}
        </a>
        <a href="/admin/admin-services.html" class="nav-item ${activePage === 'services' ? 'active' : ''}">
          <span>⚙️</span> ${isBn ? 'সেবা ক্যাটালগ' : 'Service Catalog'}
        </a>

        <span class="nav-section-title">${isBn ? 'পর্যবেক্ষণ ও নিরাপত্তা' : 'Oversight & Monitoring'}</span>
        <a href="/admin/admin-complaints.html" class="nav-item ${activePage === 'complaints' ? 'active' : ''}">
          <span>⚠️</span> ${isBn ? 'অভিযোগ ডেস্ক' : 'Complaints Desk'}
        </a>
        <a href="/admin/admin-transactions.html" class="nav-item ${activePage === 'transactions' ? 'active' : ''}">
          <span>💳</span> ${isBn ? 'লাইভ লেনদেন' : 'Live Transactions'}
        </a>
        <a href="/admin/admin-reports.html" class="nav-item ${activePage === 'reports' ? 'active' : ''}">
          <span>📊</span> ${isBn ? 'রিপোর্টস ও অ্যানালিটিক্স' : 'Analytics & Reports'}
        </a>
        <a href="/admin/admin-audit-logs.html" class="nav-item ${activePage === 'audit' ? 'active' : ''}">
          <span>🛡️</span> ${isBn ? 'নিরাপত্তা ও অডিট লগ' : 'Security & Audit Logs'}
        </a>
      </div>
      <div class="sidebar-footer">
        <div class="user-mini-profile">
          <div class="user-avatar" style="background:#0284c7;">A</div>
          <div class="user-info-text">
            <div class="user-name">${user.full_name || 'Admin'}</div>
            <div class="user-role-badge">${isBn ? 'অ্যাডমিন ওয়ার্কস্পেস' : 'Admin Workspace'}</div>
          </div>
        </div>
        <button onclick="window.Auth.logout()" class="btn btn-secondary btn-sm" title="${isBn ? 'লগআউট' : 'Log Out'}" style="padding: 6px 10px;">
          🚪
        </button>
      </div>
    `;

    this.initFloatingAIAssistant();
    this.mountLanguageSwitcher();
    this.applyPortalTranslations();
  },

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
    } catch (e) {}
  },

  aiLang: localStorage.getItem('smartbank_ai_lang') || 'bn',

  /**
   * Initializes the Floating AI Assistant at the Bottom-Right Corner
   */
  initFloatingAIAssistant() {
    if (document.getElementById('floatingAIWidget')) return;

    const user = window.Auth.getUser() || {};
    const firstName = (user.full_name || 'there').split(' ')[0];

    const widget = document.createElement('div');
    widget.id = 'floatingAIWidget';
    widget.innerHTML = `
      <!-- Floating Bottom-Right AI Button -->
      <button id="aiToggleBtn" class="ai-floating-btn" title="Smart Banking AI Assistant / এআই সহকারী">
        <span style="font-size:1.2rem;">🤖</span>
        <span>AI Assistant</span>
      </button>

      <!-- Popup AI Chat Window -->
      <div id="aiChatWindow" class="ai-chat-window">
        <div class="ai-chat-header">
          <div class="ai-chat-title">
            <span>✨</span>
            <span id="aiHeaderTitle">Smart Banking AI</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <!-- Language Switcher Toggle -->
            <div class="ai-lang-toggle" id="aiLangToggle" title="Language / ভাষা পরিবর্তন">
              <button type="button" class="ai-lang-btn ${this.aiLang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
              <button type="button" class="ai-lang-btn ${this.aiLang === 'bn' ? 'active' : ''}" data-lang="bn">বাংলা</button>
            </div>
            <button id="aiCloseBtn" class="ai-chat-close" title="Close">&times;</button>
          </div>
        </div>

        <div id="aiChatBody" class="ai-chat-body">
          <!-- Populated by renderAIWelcomeMessage() -->
        </div>

        <form id="aiChatForm" class="ai-chat-footer">
          <input type="text" id="aiInputText" placeholder="ব্যাংকিং সংক্রান্ত প্রশ্ন বাংলায় লিখুন..." autocomplete="off">
          <button type="submit" id="aiSendBtn" title="Send / পাঠান">➤</button>
        </form>
      </div>
    `;

    document.body.appendChild(widget);

    // Render initial welcome message based on saved language
    this.renderAIWelcomeMessage(firstName);

    const toggleBtn = document.getElementById('aiToggleBtn');
    const closeBtn = document.getElementById('aiCloseBtn');
    const chatWindow = document.getElementById('aiChatWindow');
    const chatForm = document.getElementById('aiChatForm');
    const input = document.getElementById('aiInputText');
    const langBtns = widget.querySelectorAll('.ai-lang-btn');

    toggleBtn.addEventListener('click', () => {
      chatWindow.classList.toggle('open');
      if (chatWindow.classList.contains('open')) {
        input.focus();
      }
    });

    closeBtn.addEventListener('click', () => {
      chatWindow.classList.remove('open');
    });

    langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedLang = btn.dataset.lang;
        this.setAILanguage(selectedLang, firstName);
      });
    });

    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      this.sendAIMessage(text);
      input.value = '';
    });
  },

  setAILanguage(lang, firstName) {
    this.aiLang = lang;
    this.chatHistory = [];
    localStorage.setItem('smartbank_ai_lang', lang);

    const widget = document.getElementById('floatingAIWidget');
    if (!widget) return;

    widget.querySelectorAll('.ai-lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    const user = window.Auth.getUser() || {};
    const name = firstName || (user.full_name || 'there').split(' ')[0];
    this.renderAIWelcomeMessage(name);
  },

  renderAIWelcomeMessage(firstName) {
    this.chatHistory = [];
    const chatBody = document.getElementById('aiChatBody');
    const input = document.getElementById('aiInputText');
    const headerTitle = document.getElementById('aiHeaderTitle');
    if (!chatBody) return;

    if (this.aiLang === 'bn') {
      if (headerTitle) headerTitle.innerText = 'স্মার্ট ব্যাংকিং এআই';
      if (input) input.placeholder = 'ব্যাংকিং সংক্রান্ত প্রশ্ন বাংলায় লিখুন...';

      chatBody.innerHTML = `
        <div class="ai-msg bot">
          <strong>Smart Banking PLC এআই ব্যাংকিং সহকারী</strong>।<br>
          প্রয়োজনীয় ডকুমেন্টস, সেবার নিয়ম বা যেকোনো সহায়তার জন্য সরাসরি প্রশ্ন লিখুন বা নিচের অপশন নির্বাচন করুন:
          <div class="ai-prompt-chips">
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('account')">🏦 অ্যাকাউন্ট খোলার নিয়ম</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('card')">💳 কার্ড সেবা ও রিপ্লেসমেন্ট</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('cheque')">📑 চেকবই রিকোয়েস্ট</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('loan')">💰 লোন আবেদন</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('block')">🚨 কার্ড হারানো / ব্লক</span>
          </div>
        </div>
      `;
    } else {
      if (headerTitle) headerTitle.innerText = 'Smart Banking AI';
      if (input) input.placeholder = 'Ask AI banking assistant...';

      chatBody.innerHTML = `
        <div class="ai-msg bot">
          <strong>Smart Banking PLC AI Banking Assistant</strong>.<br>
          Please type your specific banking question or select a service option below:
          <div class="ai-prompt-chips">
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('account')">Account Opening Docs</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('card')">Card Replacement</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('cheque')">Cheque Book</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('loan')">Loan Inquiry</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('block')">Lost Card / Block</span>
          </div>
        </div>
      `;
    }
  },

  sendQuickAIQuestion(topicKey) {
    // Exact Bangladesh Banking Guidelines customized for Smart Banking PLC
    const guides = {
      account: {
        query: 'সেভিংস অ্যাকাউন্ট খোলার নিয়ম ও প্রয়োজনীয় ডকুমেন্টস কী কী?',
        bn: `🏦 <strong>Smart Banking PLC — অ্যাকাউন্ট খোলার নিয়মাবলী (Account Opening)</strong><br><br>
📄 <strong>প্রয়োজনীয় কাগজপত্র:</strong><br>
1. জাতীয় পরিচয়পত্র (NID) অথবা পাসপোর্ট / জন্মনিবন্ধন।<br>
2. আবেদনকারীর ২ কপি পাসপোর্ট সাইজ রঙিন ছবি।<br>
3. নমিনির NID / জন্মনিবন্ধন / পাসপোর্ট ও ১ কপি ছবি।<br>
4. বর্তমান ঠিকানার প্রমাণ (বিদ্যুৎ / গ্যাস / পানির বিল - সর্বোচ্চ ৩ মাসের)।<br>
5. <strong>পেশা ও আয়ের প্রমাণ:</strong><br>
&nbsp;&nbsp;• চাকরিজীবী: Salary Certificate / Pay Slip / Job ID।<br>
&nbsp;&nbsp;• ব্যবসায়ী: Trade License।<br>
&nbsp;&nbsp;• স্বনির্ভর (Self-employed): Professional Certificate।<br>
6. প্রযোজ্য ক্ষেত্রে e-TIN / Tax Return Submission Proof।<br>
7. পূরণ করা Account Opening Form।<br><br>
🔄 <strong>ধাপে ধাপে আবেদন প্রক্রিয়া:</strong><br>
1. অ্যাকাউন্টের ধরন (Smart Savings / Current) নির্বাচন করুন।<br>
2. পোর্টালে <strong>"New Service Request"</strong> > <strong>"Account Opening Request"</strong> এ যান।<br>
3. প্রয়োজনীয় কাগজপত্র প্রস্তুত করুন ও নমিনির তথ্য দিন।<br>
4. অনলাইনে আবেদন জমা দিন (অথবা নিকটস্থ Smart Banking শাখায় দিন)।<br>
5. ব্যাংকের KYC ও এআই ডকুমেন্ট যাচাই শেষে অ্যাকাউন্ট সক্রিয় হবে।<br><br>
💡 <em>বিশেষ দ্রষ্টব্য: Smart Savings Account-এর প্রাথমিক জমা ৫০০ টাকা। ১৮ বছরের কম বয়সীদের ক্ষেত্রে অভিভাবকের মাধ্যমে হিসাব খুলতে হবে।</em><br><br>
<a href="/customer/service-request.html" class="btn btn-primary btn-sm" style="display:inline-block; margin-top:6px; color:#fff; text-decoration:none;">📝 অনলাইনে আবেদন করুন</a>`
      },
      card: {
        query: 'কার্ড সেবা ও রিপ্লেসমেন্ট পাওয়ার নিয়ম কী?',
        bn: `💳 <strong>Smart Banking PLC — কার্ড সেবা ও রিপ্লেসমেন্ট (Card Service & Replacement)</strong><br><br>
📄 <strong>প্রয়োজনীয় কাগজপত্র:</strong><br>
1. Smart Banking Account Number।<br>
2. জাতীয় পরিচয়পত্র (NID) ও পাসপোর্ট সাইজ ছবি।<br>
3. স্বাক্ষরসহ Debit Card Application Form।<br>
4. পুরোনো কার্ড (ক্ষতিগ্রস্ত বা নষ্ট হলে)।<br><br>
🔄 <strong>ধাপে ধাপে আবেদন প্রক্রিয়া:</strong><br>
1. Smart Banking-এর সক্রিয় ব্যাংক অ্যাকাউন্ট থাকতে হবে।<br>
2. পোর্টালে <strong>"New Service Request"</strong> > <strong>"Card Replacement Request"</strong> নির্বাচন করুন।<br>
3. প্রয়োজনীয় তথ্য পূরণ করে NID ও স্বাক্ষরের কপি আপলোড করুন।<br>
4. ব্যাংক আবেদন যাচাই করে নতুন কার্ড প্রস্তুত করবে।<br>
5. <strong>MySmartBank App</strong> অথবা Contact Center (16218)-এর মাধ্যমে কার্ড অ্যাক্টিভেশন ও গোপন PIN সেট করুন।<br><br>
⏱️ <strong>সম্ভাব্য সময়সীমা:</strong><br>
• ঢাকা শাখা: ৪ দিনের মধ্যে।<br>
• ঢাকার বাইরের মেট্রো শাখা: ৫ দিনের মধ্যে।<br>
• গ্রামীণ শাখা: ৬ দিনের মধ্যে।<br><br>
<a href="/customer/service-request.html" class="btn btn-primary btn-sm" style="display:inline-block; margin-top:6px; color:#fff; text-decoration:none;">💳 কার্ডের আবেদন করুন</a>`
      },
      cheque: {
        query: 'নতুন চেকবই নেওয়ার আবেদন কীভাবে করব?',
        bn: `📑 <strong>Smart Banking PLC — চেকবই রিকোয়েস্ট (Cheque Book Request)</strong><br><br>
📄 <strong>প্রয়োজনীয় তথ্য ও কাগজপত্র:</strong><br>
1. Smart Banking Account Number ও অ্যাকাউন্টের নাম।<br>
2. অ্যাকাউন্টধারীর স্বাক্ষর (Signature Specimen)।<br>
3. নিবন্ধিত মোবাইল নম্বর।<br>
4. প্রয়োজনীয় চেকের পাতার সংখ্যা (২০, ৫০ বা ১০০ পাতা)।<br><br>
🔄 <strong>ধাপে ধাপে আবেদন প্রক্রিয়া:</strong><br>
1. <strong>MySmartBank App</strong> অথবা ওয়েব পোর্টালে লগইন করুন।<br>
2. <strong>"New Service Request"</strong> > <strong>"Cheque Book Request"</strong> নির্বাচন করুন।<br>
3. অ্যাকাউন্ট সিলেক্ট করে চেকের পাতার সংখ্যা উল্লেখ করুন।<br>
4. আবেদন Submit করুন।<br>
5. ব্যাংক স্বাক্ষর যাচাইয়ের পর ২–৪ দিনের মধ্যে চেকবই রেডি হয়ে যাবে।<br><br>
💰 <em>ফি: ব্যাংকের সর্বশেষ Schedule of Charges অনুযায়ী নির্ধারিত হবে।</em><br><br>
<a href="/customer/service-request.html" class="btn btn-primary btn-sm" style="display:inline-block; margin-top:6px; color:#fff; text-decoration:none;">📑 চেকবই রিকোয়েস্ট করুন</a>`
      },
      loan: {
        query: 'লোন আবেদন ও প্রয়োজনীয় কাগজপত্র কী কী?',
        bn: `💰 <strong>Smart Banking PLC — লোন আবেদন নির্দেশিকা (Loan Application Guide)</strong><br><br>
🎯 <strong>প্রয়োজনীয় যোগ্যতা:</strong><br>
• Personal Loan-এর ক্ষেত্রে ন্যূনতম বয়স ২২–৬৫ বছর।<br>
• নিয়মিত আয়ের উৎস ও ব্যাংকের CIB শর্ত পূরণ করতে হবে।<br>
• একজন পার্সোনাল গ্যারান্টর (Personal Guarantor) থাকতে হবে।<br><br>
📄 <strong>প্রয়োজনীয় কাগজপত্র:</strong><br>
1. পূরণ করা Loan Application Form।<br>
2. আবেদনকারীর NID / Passport ও সাম্প্রতিক ছবি।<br>
3. Guarantor-এর NID ও ছবি।<br>
4. সর্বশেষ Utility Bill ও আয়ের প্রমাণ (Salary Certificate / Pay Slip)।<br>
5. সর্বশেষ ৬ মাসের Bank Statement।<br>
6. প্রযোজ্য ক্ষেত্রে e-TIN ও অফিস আইডি।<br><br>
🔄 <strong>ধাপে ধাপে আবেদন প্রক্রিয়া:</strong><br>
1. লোনের ধরন নির্বাচন করুন (Personal, Home, Auto, Education)।<br>
2. পোর্টালে <strong>"New Service Request"</strong> > <strong>"Loan Service Inquiry"</strong> এ যান।<br>
3. আয়ের তথ্য ও স্টেটমেন্ট আপলোড করুন।<br>
4. ব্যাংক কর্মকর্তা CIB ও ডকুমেন্ট যাচাই করে লোন এগ্রিমেন্ট ও ডিসবার্সমেন্ট সম্পন্ন করবেন।<br><br>
<a href="/customer/service-request.html" class="btn btn-primary btn-sm" style="display:inline-block; margin-top:6px; color:#fff; text-decoration:none;">💰 লোনের আবেদন করুন</a>`
      },
      block: {
        query: 'আমার এটিএম কার্ড হারিয়ে গেছে, জরুরি ব্লক করব কীভাবে?',
        bn: `🚨 <strong>Smart Banking PLC — কার্ড হারানো / জরুরি ব্লক (Lost / Block Card)</strong><br><br>
⚠️ <strong>জরুরি সেবা — যা প্রয়োজন হতে পারে:</strong><br>
Smart Banking Account Number, কার্ডধারীর নাম, নিবন্ধিত মোবাইল নম্বর।<br><br>
🔄 <strong>ধাপে ধাপে তাৎক্ষণিক করণীয়:</strong><br>
1. কার্ড হারিয়ে বা চুরি হলে দ্রুত ব্যাংককে জানান।<br>
2. <strong>MySmartBank App</strong>-এ লগইন করে <strong>Card Management</strong> > <strong>Block Card</strong> দিয়ে সাথে সাথে কার্ড ফ্রিজ করুন।<br>
3. অথবা নিচের ২৪/৭ জরুরি হটলাইনে কল করে ব্লক নিশ্চিত করুন।<br>
4. অননুমোদিত লেনদেন হয়ে থাকলে <strong>"Complaints / Support"</strong>-এ অভিযোগ দায়ের করুন।<br>
5. পরবর্তীতে নতুন কার্ড পেতে <strong>"Card Replacement Request"</strong> করুন।<br><br>
📞 <strong>Smart Banking 24/7 Contact Center:</strong><br>
• <strong>বাংলাদেশ থেকে কল:</strong> <strong>16218</strong> (টোল-ফ্রি ২৪/৭)<br>
• <strong>বিদেশ থেকে কল:</strong> <strong>+88 09610016218</strong><br>
• <strong>ইমেইল:</strong> contactcenter@smartbank.com.bd<br><br>
🔒 <em>সতর্কতা: কার্ড হারালে অবিলম্বে ব্লক করুন। কখনো কারো সাথে PIN, CVV বা OTP শেয়ার করবেন না।</em><br><br>
<a href="/customer/complaints.html" class="btn btn-danger btn-sm" style="display:inline-block; margin-top:6px; color:#fff; text-decoration:none;">⚠️ জরুরি অভিযোগ জমা দিন</a>`
      }
    };

    if (guides[topicKey]) {
      const g = guides[topicKey];
      if (!this.chatHistory) this.chatHistory = [];
      this.chatHistory.push({ role: 'user', content: g.query });
      this.chatHistory.push({ role: 'assistant', content: g.bn.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() });

      // Display immediate formatted card in chat body
      const chatBody = document.getElementById('aiChatBody');
      if (chatBody) {
        const userDiv = document.createElement('div');
        userDiv.className = 'ai-msg user';
        userDiv.innerText = g.query;
        chatBody.appendChild(userDiv);

        const botDiv = document.createElement('div');
        botDiv.className = 'ai-msg bot';
        botDiv.innerHTML = g.bn;
        chatBody.appendChild(botDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
      }
      return;
    }

    this.sendAIMessage(topicKey);
  },

  async sendAIMessage(userText) {
    const chatBody = document.getElementById('aiChatBody');
    if (!chatBody) return;

    if (!this.chatHistory) this.chatHistory = [];

    // Append user message bubble
    const userDiv = document.createElement('div');
    userDiv.className = 'ai-msg user';
    userDiv.innerText = userText;
    chatBody.appendChild(userDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Append typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-msg bot';
    typingDiv.id = 'aiTypingBubble';
    typingDiv.innerHTML = this.aiLang === 'bn' ? '<em>উত্তর তৈরি হচ্ছে... 🤖</em>' : '<em>Thinking... 🤖</em>';
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Send history + current message
    const historyPayload = this.chatHistory.slice(-8);

    try {
      const res = await window.api.post('/api/ai/chat', {
        message: userText,
        conversationHistory: historyPayload,
        history: historyPayload,
        language: this.aiLang
      });

      typingDiv.remove();

      const replyText = res.reply || (this.aiLang === 'bn' ? 'আমি আপনার ব্যাংকিং সহায়তায় প্রস্তুত।' : 'I am ready to help with your banking inquiries.');

      // Record in local conversation history for multi-turn conversational flow
      this.chatHistory.push({ role: 'user', content: userText });
      this.chatHistory.push({ role: 'assistant', content: replyText });

      const botDiv = document.createElement('div');
      botDiv.className = 'ai-msg bot';
      // Format markdown bold & linebreaks
      botDiv.innerHTML = replyText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
      chatBody.appendChild(botDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
    } catch (err) {
      typingDiv.innerHTML = `<span style="color:var(--danger);">${this.aiLang === 'bn' ? 'দুঃখিত, এআই সার্ভিসের সাথে সংযোগ করা যায়নি। আবার চেষ্টা করুন।' : 'Sorry, could not connect to AI service. Please try again.'}</span>`;
    }
  }
};

window.UI = UI;

// Automatically initialize Floating AI Assistant & Language Switcher on every page
if (typeof document !== 'undefined') {
  const initCommon = () => {
    if (window.UI) {
      window.UI.mountLanguageSwitcher();
      window.UI.applyPortalTranslations();
      window.UI.initFloatingAIAssistant();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommon);
  } else {
    initCommon();
  }
}
