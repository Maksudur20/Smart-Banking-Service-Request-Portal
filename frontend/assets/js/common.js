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
    this.initFloatingAIAssistant();
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
        <div class="brand-icon" style="background: linear-gradient(135deg, #0ea5e9, #0284c7);">SB</div>
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
          <div class="user-avatar">${(user.full_name || 'A')[0].toUpperCase()}</div>
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

    this.initFloatingAIAssistant();
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
    const chatBody = document.getElementById('aiChatBody');
    const input = document.getElementById('aiInputText');
    const headerTitle = document.getElementById('aiHeaderTitle');
    if (!chatBody) return;

    if (this.aiLang === 'bn') {
      if (headerTitle) headerTitle.innerText = 'স্মার্ট ব্যাংকিং এআই';
      if (input) input.placeholder = 'ব্যাংকিং সংক্রান্ত প্রশ্ন বাংলায় লিখুন...';

      chatBody.innerHTML = `
        <div class="ai-msg bot">
          স্বাগতম ${firstName}! 👋 আমি আপনার <strong>স্মার্ট ব্যাংকিং এআই সহকারী</strong>। 
          প্রয়োজনীয় ডকুমেন্টস, সেবার নিয়ম বা যেকোনো সহায়তার জন্য আমাকে বাংলায় প্রশ্ন করতে পারেন।
          <div class="ai-prompt-chips">
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('সেভিংস অ্যাকাউন্ট খুলতে কী কী ডকুমেন্ট ও নিয়ম দরকার?')">🏦 অ্যাকাউন্ট খোলার নিয়ম</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('কার্ড হারিয়ে গেলে বা রিপ্লেসমেন্ট পেতে কী করতে হবে?')">💳 কার্ড সেবা ও রিপ্লেসমেন্ট</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('নতুন চেকবই নেওয়ার নিয়ম ও কত পাতা পাওয়া যায়?')">📑 চেকবই রিকোয়েস্ট</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('লোন পাওয়ার যোগ্যতা ও প্রয়োজনীয় ডকুমেন্টস কী কী?')">💰 লোন আবেদন</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('আমার এটিএম কার্ড হারিয়ে গেছে, জরুরি ব্লক করব কীভাবে?')">🚨 কার্ড হারানো / ব্লক</span>
          </div>
        </div>
      `;
    } else {
      if (headerTitle) headerTitle.innerText = 'Smart Banking AI';
      if (input) input.placeholder = 'Ask AI banking assistant...';

      chatBody.innerHTML = `
        <div class="ai-msg bot">
          Hello ${firstName}! 👋 I am your <strong>AI Banking Assistant</strong>. 
          Ask me about required documents, application rules, or service guides!
          <div class="ai-prompt-chips">
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('What documents are required to open a savings account?')">Account Opening Docs</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('How does AI document verification work?')">AI Verification Guide</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('What are the card replacement requirements?')">Card Replacement</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('What are the documents and eligibility for a personal loan?')">Loan Service Inquiry</span>
            <span class="ai-chip" onclick="UI.sendQuickAIQuestion('My ATM card is lost, how can I block it immediately?')">Lost Card / Block</span>
          </div>
        </div>
      `;
    }
  },

  sendQuickAIQuestion(text) {
    this.sendAIMessage(text);
  },

  async sendAIMessage(userText) {
    const chatBody = document.getElementById('aiChatBody');
    if (!chatBody) return;

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

    try {
      const res = await window.api.post('/api/ai/chat', {
        message: userText,
        language: this.aiLang
      });

      typingDiv.remove();

      const botDiv = document.createElement('div');
      botDiv.className = 'ai-msg bot';
      // Format markdown bold & linebreaks
      botDiv.innerHTML = (res.reply || (this.aiLang === 'bn' ? 'আমি আপনার ব্যাংকিং সহায়তায় প্রস্তুত।' : 'I am ready to help with your banking inquiries.'))
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
