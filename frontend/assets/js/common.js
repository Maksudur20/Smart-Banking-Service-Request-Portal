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

  // Comprehensive Bilingual Dictionary (Bengali <-> English)
  dictionary: {
    bnToEn: {
      "স্মার্ট ও নিরাপদ ব্যাংকিংয়ের <span>নতুন দিগন্ত</span>": "A New Era of <span>Smart & Secure Banking</span>",
      "স্মার্ট ও নিরাপদ ব্যাংকিংয়ের নতুন দিগন্ত": "A New Era of Smart & Secure Banking",
      "ঘরে বসেই সহজে অ্যাকাউন্ট ওপেনিং, তাৎক্ষণিক ই-কেওয়াইসি ভেরিফিকেশন, স্লিপ ডিপোজিট এবং নিরাপদ ডিজিটাল ফান্ড ট্রান্সফার সুবিধা।": "Seamless digital account opening, instant e-KYC verification, slip deposits, and secure digital fund transfers.",
      "🏦 অনলাইনে অ্যাকাউন্ট খুলুন": "🏦 Open Account Online",
      "🔑 ইন্টারনেট ব্যাংকিং লগইন": "🔑 Internet Banking Login",
      "🛡️ ব্যাংক অফিসার পোর্টাল": "🛡️ Bank Officer Portal",
      "📞 হেল্পলাইন:": "📞 Helpline:",
      "লগইন করুন": "Sign In",
      "+ নতুন অ্যাকাউন্ট খুলুন": "+ Open New Account",
      "অ্যাকাউন্ট ও ডিপোজিট সেবা": "Account & Deposit Services",
      "প্রাইম সেভিংস, কারেন্ট ও সেলারি অ্যাকাউন্ট। মাত্র ৫০০ টাকা প্রাথমিক জমায় তাৎক্ষণিক ডিজিটাল আবেদন।": "Prime Savings, Current & Salary Accounts. Instant digital application with only 500 BDT initial deposit.",
      "আবেদন করুন →": "Apply Now →",
      "আবেদন করুন &rarr;": "Apply Now &rarr;",
      "কার্ড সেবা ও রিপ্লেসমেন্ট": "Card Services & Replacement",
      "ডুয়াল কারেন্সি ডেবিট ও ক্রেডিট কার্ড। ঢাকা বিভাগে ৪ দিন এবং ঢাকার বাইরে ৫-৬ দিনের মধ্যে শাখা ডেলিভারি।": "Dual currency debit & credit cards. Branch delivery within 4 days in Dhaka and 5-6 days nationwide.",
      "কার্ড সেবা দেখুন →": "Explore Cards →",
      "কার্ড সেবা দেখুন &rarr;": "Explore Cards &rarr;",
      "চেকবই রিকোয়েস্ট": "Cheque Book Request",
      "স্বাক্ষর ভেরিফিকেশনের মাধ্যমে ২০, ৫০ বা ১০০ পাতার চেকবই অর্ডার করুন এবং নির্ধারিত শাখায় গ্রহণ করুন।": "Order 20, 50, or 100-leaf personalized cheque books with signature verification.",
      "চেকবই অর্ডার →": "Order Cheque Book →",
      "চেকবই অর্ডার &rarr;": "Order Cheque Book &rarr;",
      "রিটেইল ও পার্সোনাল লোন": "Retail & Personal Loans",
      "চাকরিজীবী ও ব্যবসায়ীদের জন্য সহজ শর্তে পার্সোনাল লোন, অটো লোন ও হোম লোন সুবিধা।": "Personal loans, auto loans, and home loans with easy terms for salaried and business clients.",
      "লোন যোগ্যতা যাচাই →": "Check Eligibility →",
      "লোন যোগ্যতা যাচাই &rarr;": "Check Eligibility &rarr;",
      "জরুরি কার্ড ব্লকিং বা কাস্টমার সাপোর্ট?": "Emergency Card Blocking or Support?",
      "কার্ড হারিয়ে গেলে বা অননুমোদিত লেনদেনের ক্ষেত্রে অবিলম্বে আমাদের কল সেন্টারে যোগাযোগ করুন।": "Contact our 24/7 call center immediately in case of lost cards or suspicious transactions.",
      "অভিযোগ দাখিল করুন": "Submit Complaint",
      "Smart Banking PLC Bangladesh — লাইসেন্সপ্রাপ্ত আধুনিক ডিজিটাল ব্যাংকিং পোর্টাল।": "Smart Banking PLC Bangladesh — Licensed modern digital banking portal.",
      "গ্রাহক ইন্টারনেট ব্যাংকিং": "Customer Internet Banking",
      "আপনার ব্যাংকিং অ্যাকাউন্ট ও ডিজিটাল সেবা ব্যবস্থাপনায় প্রবেশ করুন": "Sign in to manage your banking account and digital services",
      "ইমেইল ঠিকানা": "Email Address",
      "পাসওয়ার্ড": "Password",
      "🔑 লগইন করুন": "🔑 Sign In",
      "নতুন গ্রাহক?": "New customer?",
      "এখানে নতুন অ্যাকাউন্ট খুলুন": "Open an account here",
      "ব্যাংক অফিসার পোর্টাল লগইন →": "Bank Officer Portal Login →",
      "ব্যাংক অফিসার পোর্টাল লগইন &rarr;": "Bank Officer Portal Login &rarr;",
      "ব্যাংক অফিসার পোর্টাল": "Bank Officer Portal",
      "কর্মকর্তার ইমেইল ও পাসওয়ার্ড দিয়ে এডমিন ড্যাশবোর্ডে প্রবেশ করুন": "Sign in with your officer credentials to access admin dashboard",
      "অফিসার ইমেইল ঠিকানা": "Officer Email Address",
      "গ্রাহক লগইন পোর্টালে যান →": "Go to Customer Portal →",
      "গ্রাহক লগইন পোর্টালে যান &rarr;": "Go to Customer Portal &rarr;",
      "অনলাইন ব্যাংক অ্যাকাউন্ট আবেদন": "Online Bank Account Application",
      "জাতীয় পরিচয়পত্র ও প্রয়োজনীয় ডকুমেন্ট দিয়ে ঘরে বসেই অ্যাকাউন্ট খুলুন": "Open your bank account from home with NID and required documents",
      "১. সাধারণ ও যোগাযোগের তথ্য": "1. General & Contact Information",
      "২. নমিনি ও ব্যক্তিগত তথ্য": "2. Nominee & Personal Information",
      "📁 ৩. ছবি ও ডকুমেন্ট আপলোড": "📁 3. Photo & Document Upload",
      "১. আবেদনকারীর পাসপোর্ট সাইজ ছবি": "1. Applicant Passport Photo",
      "২. আবেদনকারীর নমুনা স্বাক্ষর": "2. Specimen Signature",
      "৩. জাতীয় পরিচয়পত্র - সামনের অংশ": "3. National ID - Front Side",
      "৪. জাতীয় পরিচয়পত্র - পেছনের অংশ": "4. National ID - Back Side",
      "৫. নমিনির পাসপোর্ট সাইজ ছবি": "5. Nominee Passport Photo",
      "৬. নমিনির পরিচয়পত্র / জন্মনিবন্ধন": "6. Nominee ID / Birth Certificate",
      "৭. বর্তমান ঠিকানার প্রমাণ (ইউটিলিটি বিল)": "7. Proof of Current Address (Utility Bill)",
      "৮. আয়ের উৎসের প্রমাণ": "8. Proof of Income Source",
      "📝 আবেদন ও কেওয়াইসি সাবমিট করুন": "📝 Submit Application & KYC",
      "পূর্বেই অ্যাকাউন্ট আছে?": "Already have an account?",
      "সরাসরি লগইন করুন": "Sign In directly",
      "মোট অ্যাকাউন্ট ব্যালেন্স": "Total Account Balance",
      "অ্যাকাউন্ট নম্বর": "Account Number",
      "📥 ডিপোজিট করুন": "📥 Deposit",
      "📤 ফান্ড ট্রান্সফার": "📤 Fund Transfer",
      "টাকা ডিপোজিট": "Deposit Money",
      "ব্যাংক / bKash স্লিপ আপলোড": "Bank / bKash Slip Upload",
      "ফান্ড ট্রান্সফার": "Fund Transfer",
      "অন্য অ্যাকাউন্টে টাকা পাঠান": "Transfer Money to Another Account",
      "আমার কেওয়াইসি": "My KYC",
      "আপলোডকৃত ডকুমেন্ট ও স্ট্যাটাস": "Uploaded Documents & Status",
      "নতুন সার্ভিস রিকোয়েস্ট": "New Service Request",
      "কার্ড, চেকবই ও লোন আবেদন": "Card, Cheque & Loan Requests",
      "আমার অ্যাকাউন্ট বিবরণী": "My Account Details",
      "আমার অ্যাকাউন্ট বিবরণী (Account Details)": "My Account Details",
      "অ্যাকাউন্টের ধরন:": "Account Type:",
      "অ্যাকাউন্ট নম্বর:": "Account Number:",
      "বর্তমান ব্যালেন্স:": "Current Balance:",
      "গ্রাহক রেফারেন্স:": "Customer Reference:",
      "অ্যাকাউন্ট হোল্ডার:": "Account Holder:",
      "+ ডিপোজিট জমা দিন": "+ Make Deposit",
      "সাম্প্রতিক লেনদেন": "Recent Transactions",
      "সব দেখুন →": "View All →",
      "সব দেখুন &rarr;": "View All &rarr;",
      "আমার সার্ভিস আবেদনসমূহ": "My Service Requests",
      "সকল আবেদন →": "View All →",
      "সকল আবেদন &rarr;": "View All &rarr;",
      "🪪 আমার কেওয়াইসি ও ডকুমেন্টস": "🪪 My KYC & Documents",
      "আপলোডকৃত পরিচয়পত্র ও ডকুমেন্টস": "Uploaded Identification & Documents",
      "সকল ফাইল ব্যাংক সার্ভারে এনক্রিপ্টেড সংরক্ষিত": "All files encrypted on bank servers",
      "ডকুমেন্ট পুনরায় আপলোড করুন": "Re-upload Document",
      "ডকুমেন্টের ধরন নির্বাচন করুন": "Select Document Type",
      "আবেদনকারীর পাসপোর্ট ছবি": "Applicant Passport Photo",
      "জাতীয় পরিচয়পত্র - সামনের অংশ": "National ID - Front Side",
      "জাতীয় পরিচয়পত্র - পেছনের অংশ": "National ID - Back Side",
      "আবেদনকারীর নমুনা স্বাক্ষর": "Specimen Signature",
      "নমিনির পাসপোর্ট ছবি": "Nominee Passport Photo",
      "নমিনির পরিচয়পত্র / জন্মনিবন্ধন": "Nominee ID / Birth Certificate",
      "বর্তমান ঠিকানার প্রমাণ (ইউটিলিটি বিল)": "Proof of Current Address (Utility Bill)",
      "আয়ের উৎসের প্রমাণ": "Proof of Income Source",
      "📤 নতুন ফাইল আপলোড করুন": "📤 Upload New File",
      "👤 গ্রাহক প্রোফাইল ও কেওয়াইসি তথ্য": "👤 Customer Profile & KYC Details",
      "ব্যক্তিগত ও ব্যাংকিং তথ্যাবলী": "Personal & Banking Information",
      "🪪 কেওয়াইসি ডকুমেন্টস দেখুন →": "🪪 View KYC Documents →",
      "🪪 কেওয়াইসি ডকুমেন্টস দেখুন &rarr;": "🪪 View KYC Documents &rarr;",
      "গ্রাহক রেফারেন্স আইডি": "Customer Reference ID",
      "পূর্ণ নাম": "Full Name",
      "পিতার নাম": "Father's Name",
      "মাতার নাম": "Mother's Name",
      "বর্তমান ঠিকানা": "Present Address",
      "মোবাইল নম্বর": "Mobile Number",
      "💾 প্রোফাইল তথ্য সংরক্ষণ করুন": "💾 Save Profile Information",
      "👥 নিবন্ধিত গ্রাহক তালিকা": "👥 Registered Customer Directory",
      "সকল ব্যাংক গ্রাহক": "All Bank Customers",
      "নাম, অ্যাকাউন্ট নম্বর বা কাস্টমার রেফারেন্স দিয়ে অনুসন্ধান করুন": "Search by name, account number or reference",
      "গ্রাহক অনুসন্ধান করুন...": "Search customers...",
      "গ্রাহক রেফারেন্স": "Reference",
      "নাম ও যোগাযোগ": "Name & Contact",
      "অ্যাকাউন্টের ধরন": "Account Type",
      "ব্যালেন্স": "Balance",
      "কেওয়াইসি স্ট্যাটাস": "KYC Status",
      "রেজিস্ট্রেশন তারিখ": "Registered Date",
      "অ্যাকশন": "Action",
      "কেওয়াইসি রিভিউ →": "Review KYC →",
      "কেওয়াইসি রিভিউ &rarr;": "Review KYC &rarr;",
      "🪪 কেওয়াইসি ভেরিফিকেশন ডেস্ক": "🪪 KYC Verification Desk",
      "অপেক্ষমাণ আবেদন": "Pending Applications",
      "অনুমোদিত গ্রাহক": "Approved Customers",
      "বাতিলকৃত আবেদন": "Rejected Applications",
      "ফিল্টার:": "Filter:",
      "সকল আবেদন": "All Applications",
      "অপেক্ষমাণ": "Pending",
      "অনুমোদিত": "Approved",
      "বাতিলকৃত": "Rejected",
      "🔄 রিফ্রেশ": "🔄 Refresh",
      "আবেদনকারী তালিকা": "Applicant List",
      "নাম ও ইমেইল": "Name & Email",
      "ডকুমেন্ট সংখ্যা": "Documents",
      "আবেদনের তারিখ": "Application Date",
      "যাচাই করুন →": "Review →",
      "যাচাই করুন &rarr;": "Review →",
      "আবেদনকারীর তথ্য ও ডকুমেন্টস": "Applicant Information & Documents",
      "সংযুক্ত ডকুমেন্টস:": "Attached Documents:",
      "অ্যাডমিন সিদ্ধান্ত ও ভেরিফিকেশন:": "Admin Decision & Verification:",
      "মন্তব্য বা বাতিলের কারণ:": "Remarks / Reason:",
      "❌ আবেদন বাতিল করুন": "❌ Reject Application",
      "⚠️ অতিরিক্ত ডকুমেন্ট তলব করুন": "⚠️ Request Additional Docs",
      "✅ কেওয়াইসি অনুমোদন ও অ্যাকাউন্ট সক্রিয় করুন": "✅ Approve KYC & Activate",
      "💵 ডিপোজিট ভেরিফিকেশন কিউ": "💵 Deposit Verification Queue",
      "পেন্ডিং ও বিগত ডিপোজিট রিকোয়েস্টসমূহ": "Pending & Past Deposit Requests",
      "আইডি": "ID",
      "গ্রাহক ও অ্যাকাউন্ট": "Customer & Account",
      "পরিমাণ": "Amount",
      "পদ্ধতি": "Method",
      "TrxID": "TrxID",
      "প্রেরক": "Sender",
      "স্ট্যাটাস": "Status",
      "তারিখ": "Date",
      "যাচাই ও ক্রেডিট →": "Verify & Credit →",
      "যাচাই ও ক্রেডিট &rarr;": "Verify & Credit &rarr;",
      "স্লিপ দেখুন 📄": "View Slip 📄",
      "ডিপোজিট স্লিপ যাচাই": "Deposit Slip Verification",
      "সংযুক্ত ডিপোজিট স্লিপ:": "Attached Deposit Slip:",
      "অ্যাডমিন মন্তব্য:": "Admin Remarks:",
      "❌ ডিপোজিট বাতিল করুন": "❌ Reject Deposit",
      "✅ অনুমোদন ও অ্যাকাউন্টে জমা করুন": "✅ Approve & Credit Account",
      "🏛️ ব্যাংকিং সেবাসমূহ ও ডকুমেন্ট নির্দেশিকা": "🏛️ Banking Services & Document Requirements",
      "কনফিগারকৃত ব্যাংকিং সেবা তালিকা": "Configured Banking Services Catalogue",
      "১০টি প্রমিত ব্যাংকিং সেবা ক্যাটাগরি এবং সংযুক্ত ডকুমেন্ট ভেরিফিকেশন নিয়মাবলী": "10 standard banking service categories and attached document verification rules",
      "সার্ভিস কোড": "Service Code",
      "সেবার নাম": "Service Name",
      "ক্যাটাগরি": "Category",
      "বিবরণ": "Description",
      "প্রসেসিং সময়": "Processing Time",
      "প্রয়োজনীয় ডকুমেন্ট": "Required Documents",
      "💳 লাইভ ব্যাংকিং ট্রানজেকশন লেজার": "💳 Live Banking Transaction Ledger",
      "লেনদেন রেফারেন্স ও ট্রানজেকশন ইতিহাস": "Transaction References & History",
      "লেনদেন আইডি": "TxID",
      "অ্যাকাউন্ট": "Account",
      "লেনদেনের ধরন": "Transaction Type",
      "ডিপোজিট": "Deposit",
      "উইথড্রয়াল": "Withdrawal",
      "ট্রান্সফার": "Transfer",
      "ফি / চার্জ": "Fee / Charge",
      "রেফারেন্স / নোট": "Reference / Note",
      "সময় ও তারিখ": "Date & Time",
      "🗂️ অ্যাকাউন্ট ক্লোজার রিভিউ কিউ": "🗂️ Account Closure Review Queue",
      "আবেদন রেফারেন্স": "Request ID",
      "আবেদনের কারণ": "Reason",
      "ব্যালেন্স নিষ্পত্তি": "Balance Settlement",
      "পর্যালোচনা ও অনুমোদন →": "Review & Approve →",
      "পর্যালোচনা ও অনুমোদন &rarr;": "Review & Approve &rarr;",
      "নিরাপদ সাইন আউট": "Secure Sign Out",
      "লগআউট": "Sign Out",
      "Admin Dashboard": "অ্যাডমিন ড্যাশবোর্ড",
      "Customer Internet Banking": "গ্রাহক ইন্টারনেট ব্যাংকিং",
      "Total Customers": "মোট গ্রাহক",
      "KYC Pending": "কেওয়াইসি পেন্ডিং",
      "Deposits": "ডিপোজিটসমূহ",
      "Service Requests": "সার্ভিস আবেদনসমূহ",
      "Recent Transactions": "সাম্প্রতিক লেনদেন",
      "Pending Verifications": "অপেক্ষমাণ ভেরিফিকেশন",
      "View All": "সব দেখুন",
      "টাকা পাঠান": "Send Money",
      "প্রাপকের অ্যাকাউন্ট নম্বর": "Recipient Account Number",
      "ট্রান্সফারের পরিমাণ": "Transfer Amount",
      "রেফারেন্স / নোট": "Reference / Note",
      "📤 তাৎক্ষণিক ফান্ড ট্রান্সফার সম্পন্ন করুন": "📤 Complete Instant Transfer",
      "আমার লেনদেন হিস্ট্রি": "My Transaction History",
      "নতুন ডিপোজিট সাবমিট করুন": "Submit New Deposit",
      "আপনার রিসিভার অ্যাকাউন্ট নম্বর:": "Your Receiving Account Number:",
      "ডিপোজিটের পরিমাণ": "Deposit Amount",
      "ডিপোজিট মেথড": "Deposit Method",
      "প্রেরকের নাম ও মোবাইল নম্বর": "Sender Name & Mobile",
      "ট্রানজেকশন আইডি (TrxID)": "Transaction ID (TrxID)",
      "ডিপোজিটের তারিখ": "Deposit Date",
      "ডিপোজিট স্লিপ / মানি রিসিট আপলোড": "Deposit Slip / Receipt Upload",
      "📥 ডিপোজিট রিকোয়েস্ট জমা দিন": "📥 Submit Deposit Request",
      "নতুন অভিযোগ বা জিজ্ঞাসা দাখিল করুন": "Submit a New Complaint or Query",
      "অভিযোগের ক্যাটাগরি": "Complaint Category",
      "বিষয়": "Subject",
      "বিস্তারিত বিবরণ": "Detailed Description",
      "অভিযোগ দাখিল করুন →": "Submit Complaint Ticket →",
      "অভিযোগ দাখিল করুন &rarr;": "Submit Complaint Ticket &rarr;",
      "আমার দাখিলকৃত অভিযোগসমূহ ও সমাধান": "My Registered Complaints & Resolutions",
      "টিকেট #": "Ticket #",
      "দাখিলের তারিখ": "Submitted Date",
      "ব্যাংকের সমাধান মন্তব্য": "Resolution Remarks",
      "আবেদন আইডি": "Request ID",
      "গ্রাহকের নাম ও রেফারেন্স": "Customer Name & Ref",
      "ডকুমেন্টস": "Documents",
      "⚙️ ফি ম্যানেজমেন্ট": "⚙️ Fee Management",
      "অনলাইন ব্যাংক অ্যাকাউন্ট আবেদন ও ই-কেওয়াইসি": "Online Bank Account Application & e-KYC",
      "বাংলাদেশ ব্যাংকের নিয়ম অনুযায়ী সঠিক তথ্য ও প্রয়োজনীয় কাগজপত্র সংযুক্ত করে আবেদন সম্পন্ন করুন।": "Complete your application with accurate details and required KYC documents.",
      "১. আবেদনকারীর ব্যক্তিগত তথ্য": "1. Personal Information",
      "২. নমিনির তথ্য": "2. Nominee Information",
      "৩. ছবি ও ডকুমেন্ট আপলোড": "3. Photo & Document Upload",
      "আবেদনকারীর পূর্ণ নাম": "Full Legal Name",
      "পিতার নাম": "Father's Name",
      "মাতার নাম": "Mother's Name",
      "জন্ম তারিখ": "Date of Birth",
      "জাতীয় পরিচয়পত্র নম্বর": "NID Number",
      "পেশা ও মাসিক আয়": "Occupation & Monthly Income",
      "বর্তমান ঠিকানা": "Present Address",
      "স্থায়ী ঠিকানা": "Permanent Address",
      "নমিনির নাম": "Nominee Name",
      "সম্পর্ক": "Relationship",
      "নমিনির NID / জন্মনিবন্ধন নম্বর": "Nominee NID / Birth Cert No",
      "চাকরিজীবী": "Salaried",
      "ব্যবসায়ী": "Business",
      "পেশাজীবী": "Self-employed",
      "শিক্ষার্থী": "Student",
      "গৃহিণী": "Homemaker",
      "স্বামী / স্ত্রী": "Spouse",
      "পিতা": "Father",
      "মাতা": "Mother",
      "পুত্র": "Son",
      "কন্যা": "Daughter",
      "ভাই": "Brother",
      "বোন": "Sister",
      "অন্যান্য": "Other",
      "🔑 লগইন": "🔑 Sign In"
    },
    enToBn: {}
  },

  _initDict() {
    if (Object.keys(this.dictionary.enToBn).length === 0) {
      for (const [bn, en] of Object.entries(this.dictionary.bnToEn)) {
        this.dictionary.enToBn[en] = bn;
        const cleanBn = bn.replace(/<[^>]+>/g, '').trim();
        const cleanEn = en.replace(/<[^>]+>/g, '').trim();
        if (cleanEn && cleanBn) {
          this.dictionary.enToBn[cleanEn] = cleanBn;
        }
      }
    }
  },

  setPortalLanguage(lang) {
    if (lang !== 'bn' && lang !== 'en') lang = 'bn';
    localStorage.setItem('smartbank_portal_lang', lang);
    localStorage.setItem('smartbank_ai_lang', lang);
    this.aiLang = lang;

    // Update switcher buttons UI immediately
    document.querySelectorAll('.lang-switch-pill .lang-btn').forEach(btn => {
      if ((lang === 'bn' && (btn.classList.contains('lang-btn-bn') || btn.innerText.includes('বাংলা'))) ||
          (lang === 'en' && (btn.classList.contains('lang-btn-en') || btn.innerText.includes('English')))) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (this.currentSidebarType === 'customer') {
      this.renderCustomerSidebar(this.activeSidebarPage);
    } else if (this.currentSidebarType === 'admin') {
      this.renderAdminSidebar(this.activeSidebarPage);
    }

    this.applyPortalTranslations();

    // Call dynamic loaders if available on the current page
    const loaders = [
      'loadApplications',
      'loadCustomers',
      'loadDeposits',
      'loadServices',
      'loadKYCData',
      'loadTransactions',
      'loadRequests',
      'loadComplaints',
      'loadDashboardData',
      'initDashboard',
      'loadProfile',
      'loadClosureRequests',
      'loadClosureStatus'
    ];
    loaders.forEach(fnName => {
      if (typeof window[fnName] === 'function') {
        try { window[fnName](); } catch (e) {}
      }
    });

    if (typeof window.onPortalLanguageChange === 'function') {
      try { window.onPortalLanguageChange(lang); } catch (e) {}
    }

    document.dispatchEvent(new CustomEvent('portalLanguageChanged', { detail: { lang } }));
  },

  isHomePage() {
    const p = (window.location.pathname || '').toLowerCase();
    return p === '/' || p === '' || p.endsWith('/index.html') || p === '/index.html' || p === 'index.html';
  },

  mountLanguageSwitcher() {
    // Remove existing switchers from DOM
    document.querySelectorAll('.lang-switch-pill').forEach(el => el.remove());
    const floatWrap = document.getElementById('floating-lang-pill-wrap');
    if (floatWrap) floatWrap.remove();
    const floatContainer = document.getElementById('floating-lang-container');
    if (floatContainer) floatContainer.remove();

    // Language toggle option MUST ONLY appear on the Home page (index.html)!
    if (!this.isHomePage()) {
      return;
    }

    const lang = this.getLanguage();
    const pill = document.createElement('div');
    pill.className = 'lang-switch-pill';
    pill.title = lang === 'bn' ? 'ভাষা পরিবর্তন (বাংলা / English)' : 'Switch Language (Bangla / English)';
    pill.innerHTML = `
      <button type="button" class="lang-btn lang-btn-bn ${lang === 'bn' ? 'active' : ''}">বাংলা</button>
      <button type="button" class="lang-btn lang-btn-en ${lang === 'en' ? 'active' : ''}">English</button>
    `;

    const bnBtn = pill.querySelector('.lang-btn-bn');
    const enBtn = pill.querySelector('.lang-btn-en');
    if (bnBtn) bnBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); window.UI.setPortalLanguage('bn'); };
    if (enBtn) enBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); window.UI.setPortalLanguage('en'); };

    // On Home page, mount cleanly inside .landing-nav-actions
    const landingNav = document.querySelector('.landing-nav-actions');
    if (landingNav) {
      landingNav.insertBefore(pill, landingNav.firstChild);
    } else {
      const header = document.querySelector('.landing-header') || document.body;
      header.appendChild(pill);
    }
  },

  applyPortalTranslations() {
    this._initDict();
    const lang = this.getLanguage();
    document.documentElement.lang = lang;

    // 1. Elements with explicit data-bn and data-en
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

    // 2. Global dictionary translations for elements without explicit data attributes
    const dict = lang === 'en' ? this.dictionary.bnToEn : this.dictionary.enToBn;
    if (dict) {
      const candidates = document.querySelectorAll(
        'h1, h2, h3, h4, h5, h6, p, label, a, button, span, th, td, option, .card-title, .card-subtitle, .page-heading, .brand-sub'
      );
      candidates.forEach(el => {
        if (el.hasAttribute('data-bn') || el.closest('.lang-switch-pill')) return;

        const raw = el.innerHTML.trim();
        if (dict[raw]) {
          el.innerHTML = dict[raw];
          return;
        }

        if (el.children.length === 0) {
          const txt = el.textContent.trim();
          if (dict[txt]) {
            el.textContent = dict[txt];
          }
        }
      });

      // Also translate input/textarea placeholders
      document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(input => {
        if (input.hasAttribute('data-bn')) return;
        const ph = input.getAttribute('placeholder').trim();
        if (dict[ph]) {
          input.setAttribute('placeholder', dict[ph]);
        }
      });
    }
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
