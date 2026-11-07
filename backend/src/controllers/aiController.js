const db = require('../config/database');
const aiValidationService = require('../services/aiValidationService');
const { isOpenRouterConfigured, OPENROUTER_API_KEY, OPENROUTER_API_URL, DEFAULT_MODEL } = require('../config/aiClient');
const { processAIValidation } = require('./documentController');

/**
 * Trigger or re-run AI validation for a specific document
 */
async function triggerAIValidation(req, res, next) {
  try {
    const { documentId } = req.params;

    const docQuery = `
      SELECT rd.*, dt.name AS document_type_name, sr.customer_id, sr.id AS request_id,
             u.full_name AS customer_name, s.name AS service_name
      FROM request_documents rd
      JOIN document_types dt ON dt.id = rd.document_type_id
      JOIN service_requests sr ON sr.id = rd.request_id
      JOIN customers c ON c.id = sr.customer_id
      JOIN users u ON u.id = c.user_id
      JOIN services s ON s.id = sr.service_id
      WHERE rd.id = $1
    `;
    const docRes = await db.query(docQuery, [documentId]);

    if (docRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const doc = docRes.rows[0];

    // Authorization
    if (req.user.role === 'CUSTOMER' && doc.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Set status to Processing
    await db.query(`UPDATE request_documents SET ai_validation_status = 'Processing' WHERE id = $1`, [documentId]);

    // Process AI
    await processAIValidation(doc.id, doc.document_type_name, doc.secure_url, doc.mime_type, doc.original_file_name, {
      requestId: doc.request_id,
      userId: req.user.id,
      customerName: doc.customer_name,
      serviceName: doc.service_name,
    });

    // Fetch newly recorded validation
    const valRes = await db.query(
      `SELECT * FROM ai_validations WHERE request_document_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [documentId]
    );

    res.json({
      success: true,
      message: 'AI validation completed successfully.',
      validation: valRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get AI validation results for a document
 */
async function getDocumentAIResults(req, res, next) {
  try {
    const { documentId } = req.params;

    const query = `
      SELECT av.*, rd.original_file_name, rd.verification_status, rd.ai_validation_status,
             dt.name AS document_type_name, sr.customer_id
      FROM ai_validations av
      JOIN request_documents rd ON rd.id = av.request_document_id
      JOIN document_types dt ON dt.id = rd.document_type_id
      JOIN service_requests sr ON sr.id = rd.request_id
      WHERE av.request_document_id = $1
      ORDER BY av.created_at DESC
    `;
    const result = await db.query(query, [documentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No AI validation records found for this document.',
      });
    }

    const firstRow = result.rows[0];
    if (req.user.role === 'CUSTOMER' && firstRow.customer_id !== req.user.customer_id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({
      success: true,
      validations: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get AI-generated summary of the entire request
 */
async function getRequestAISummary(req, res, next) {
  try {
    const { requestId } = req.params;

    const reqRes = await db.query(
      `SELECT sr.*, s.name AS service_name, u.full_name AS customer_name
       FROM service_requests sr
       JOIN services s ON s.id = sr.service_id
       JOIN customers c ON c.id = sr.customer_id
       JOIN users u ON u.id = c.user_id
       WHERE sr.id = $1`,
      [requestId]
    );

    if (reqRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service request not found.' });
    }

    const requestDetails = reqRes.rows[0];

    const docRes = await db.query(
      `SELECT rd.*, dt.name AS document_type_name
       FROM request_documents rd
       JOIN document_types dt ON dt.id = rd.document_type_id
       WHERE rd.request_id = $1`,
      [requestId]
    );

    const summary = await aiValidationService.generateRequestSummary(requestDetails, docRes.rows);

    res.json({
      success: true,
      summary,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Interactive AI Banking Assistant Chat Endpoint
 * Answers queries from the floating bottom-right AI Assistant widget
 */
async function chatWithAIAssistant(req, res, next) {
  try {
    const { message, conversationHistory = [], language = 'en' } = req.body;
    const user = req.user;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const hasBanglaChars = /[\u0980-\u09FF]/.test(message);
    const preferBangla = language === 'bn' || hasBanglaChars;

    const systemPrompt = `You are the Smart Banking Portal AI Assistant. You help retail banking customers and bank officers with service requests, document guidelines, compliance rules, and portal navigation.
${preferBangla ? 'IMPORTANT: The user prefers BENGALI (বাংলা). Respond completely in natural, polite, and clear Bengali (বাংলা ভাষা).' : 'Respond in clear, professional English unless the user writes in Bengali.'}

Bank Services Available:
1. Account Opening Request (Requires NID, Photo, Utility Bill)
2. Account Information Update (Requires NID, Utility Bill)
3. Debit/Credit Card Request (Requires NID, Salary Certificate)
4. Card Replacement Request (Requires NID, Signature Specimen)
5. Cheque Book Request (Requires Signature Specimen)
6. Internet Banking Activation (Requires NID)
7. Mobile Banking Service Request (Requires NID, Photo)
8. Loan Service Inquiry (Requires NID, Salary Certificate, Bank Statement)
9. KYC / Document Verification (Requires NID, Photo)
10. Fund Transfer Query (Requires Bank Statement)

Document rules:
- Supported formats: JPG, PNG, PDF. Maximum size: 5MB to 10MB.
- Ensure document images are clear, uncropped, and free of motion blur.
User Context:
- User: ${user.full_name} (${user.role})
${user.customer_reference ? `- Customer Ref: ${user.customer_reference}` : ''}
${user.account_number ? `- Primary Account: ${user.account_number}` : ''}

Tone: Professional, courteous, helpful, concise. Mention that AI recommendations are decision-support assistance only.`;

    if (isOpenRouterConfigured) {
      try {
        const messages = [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-6).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          })),
          { role: 'user', content: message }
        ];

        // Candidate free models to try in order (resilient against upstream 429 rate limits)
        const modelsToTry = [
          DEFAULT_MODEL,
          'liquid/lfm-2.5-2.6b:free',
          'google/gemma-4-31b-it:free',
          'google/gemma-4-26b-a4b-it:free'
        ];
        const uniqueModels = [...new Set(modelsToTry)];

        for (const modelCandidate of uniqueModels) {
          try {
            const openRouterRes = await fetch(OPENROUTER_API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'http://localhost:5000',
                'X-Title': 'Smart Banking Service Request Portal'
              },
              body: JSON.stringify({
                model: modelCandidate,
                messages,
                temperature: 0.3
              })
            });

            if (openRouterRes.ok) {
              const aiData = await openRouterRes.json();
              const reply = aiData.choices?.[0]?.message?.content;
              if (reply && reply.trim()) {
                return res.json({
                  success: true,
                  reply: reply.trim(),
                  model: modelCandidate
                });
              }
            }
          } catch (modelErr) {
            console.warn(`[OpenRouter] Failed model ${modelCandidate}:`, modelErr.message);
          }
        }
      } catch (err) {
        console.warn('OpenRouter Chat call fell back to local banking intelligence:', err.message);
      }
    }

    // High quality contextual banking assistant fallback
    const reply = generateContextualBankingReply(message, user, preferBangla);
    res.json({
      success: true,
      reply,
      model: 'smartbank/assistant-v1'
    });
  } catch (err) {
    next(err);
  }
}

function generateContextualBankingReply(msg, user, isBangla = false) {
  const m = msg.toLowerCase();
  const userName = user.full_name ? user.full_name.split(' ')[0] : 'Customer';

  // BANGLA REPLIES
  if (isBangla) {
    if (m.includes('hello') || m.includes('hi') || m.includes('hey') || m.includes('kemon') || m.includes('help') || m.includes('assalamu') || m.includes('নমস্কার') || m.includes('সালাম') || m.includes('কেমন')) {
      return `স্বাগতম ${userName}! 👋 আমি আপনার স্মার্ট ব্যাংকিং এআই সহকারী। প্রয়োজনীয় ডকুমেন্টস, অ্যাকাউন্ট খোলার নিয়ম, কার্ড সেবা, চেক বই রিকোয়েস্ট বা যেকোনো সমস্যার বিষয়ে আমাকে বাংলায় জিজ্ঞাসা করতে পারেন। আমি কীভাবে সহায়তা করতে পারি?`;
    }

    if (m.includes('block') || m.includes('lost') || m.includes('harie') || m.includes('churi') || m.includes('stolen') || m.includes('হারিয়ে') || m.includes('চুরি') || m.includes('ব্লক')) {
      return `🚨 **জরুরি কার্ড ব্লক করার নিয়মাবলী:**
1. কার্ডের তাৎক্ষণিক অপব্যবহার রোধে আমাদের ২৪/৭ জরুরি হটলাইন **১৬২৩৪** অথবা **+৮৮০-৯৬১২৩৪৫৬৭৮** এ এখনই কল করে কার্ড ফ্রিজ করুন।
2. এই পোর্টালে **"Complaints / Support"** অপশনে গিয়ে জরুরি ডিসপিউট টিকিট সাবমিট করুন।
3. পরবর্তীতে নতুন কার্ড পাওয়ার জন্য **"New Service Request"** > **"Card Replacement Request"** থেকে আবেদন করুন (প্রয়োজনীয় ডকুমেন্ট: NID এবং স্বাক্ষর কার্ড)।`;
    }

    if (m.includes('account') || m.includes('savings') || m.includes('current') || m.includes('open') || m.includes('অ্যাকাউন্ট') || m.includes('খুলতে') || m.includes('খোলা')) {
      return `🏦 **অনলাইন অ্যাকাউন্ট খোলার নিয়ম:**
সেভিংস বা কারেন্ট অ্যাকাউন্ট খুলতে নিম্নোক্ত ৩টি ডকুমেন্ট স্ক্যান কপি প্রয়োজন:
1. **জাতীয় পরিচয়পত্র (NID Smart Card)** - সামনের ও পেছনের স্পষ্ট রঙিন ছবি।
2. **পাসপোর্ট সাইজ ছবি** - সদ্য তোলা রঙিন ছবি (সাদা ব্যাকগ্রাউন্ড)।
3. **ইউটিলিটি বিলের কপি** - গ্যাস, বিদ্যুৎ বা পানির বিল (সর্বোচ্চ ৩ মাসের পুরানো) ঠিকানার প্রমাণের জন্য।
আবেদন করতে মেন্যুর **"New Service Request"** > **"Account Opening Request"** নির্বাচন করুন!`;
    }

    if (m.includes('cheque') || m.includes('check') || m.includes('bohi') || m.includes('চেক') || m.includes('বই')) {
      return `📑 **চেক বই (Cheque Book) রিকোয়েস্ট:**
- আপনি ২০, ৫০ বা ১০০ পাতার চেক বইয়ের জন্য আবেদন করতে পারবেন।
- **প্রয়োজনীয় ডকুমেন্ট:** আপনার স্বাক্ষর কার্ড (Signature Specimen)।
- আবেদন অনুমোদনের পর ৩–৫ কার্যদিবসের মধ্যে নিকটস্থ শাখা থেকে অথবা কুরিয়ারে সংগ্রহ করতে পারবেন।`;
    }

    if (m.includes('loan') || m.includes('rin') || m.includes('emi') || m.includes('interest') || m.includes('লোন') || m.includes('ঋণ')) {
      return `💰 **লোন সেবা ও আবেদন নির্দেশিকা:**
আমরা সহজ শর্তে পার্সোনাল লোন, গৃহ ঋণ (Home Loan) এবং গাড়ি ঋণ দিয়ে থাকি।
**লোন পাওয়ার জন্য প্রয়োজনীয় কাগজপত্র:**
1. জাতীয় পরিচয়পত্র (NID)
2. বিগত ৬ মাসের ব্যাংক স্টেটমেন্ট
3. শেষ ৩ মাসের বেতন সার্টিফিকেট (Salary Certificate) বা আয়ের প্রমাণপত্র
অনলাইনে আবেদন করতে **"New Service Request"** > **"Loan Service Inquiry"** ফর্মটি পূরণ করুন।`;
    }

    if (m.includes('card') || m.includes('debit') || m.includes('credit') || m.includes('replacement') || m.includes('কার্ড')) {
      return `💳 **ডেবিট ও ক্রেডিট কার্ড সেবা:**
- **নতুন কার্ডের আবেদন:** NID এবং স্যালারি সার্টিফিকেট প্রয়োজন।
- **কার্ড রিপ্লেসমেন্ট (Replacement):** NID এবং সিগনেচার স্পেসিমেন প্রয়োজন।
অফিসার অনুমোদনের পর ২ থেকে ৩ কার্যদিবসের মধ্যে কার্ড প্রস্তুত হয়ে যাবে।`;
    }

    if (m.includes('nid') || m.includes('national id') || m.includes('document') || m.includes('file') || m.includes('upload') || m.includes('ডকুমেন্ট') || m.includes('কাগজ') || m.includes('আপলোড')) {
      return `📄 **ডকুমেন্ট আপলোড করার নিয়ম ও নির্দেশিকা:**
- **সমর্থিত ফরম্যাট:** JPG, JPEG, PNG এবং PDF।
- **সর্বোচ্চ সাইজ:** প্রতি ডকুমেন্টে ৫ মেগাবাইট (ব্যাংক স্টেটমেন্টের ক্ষেত্রে ১০ মেগাবাইট)।
- **স্পষ্টতা:** ডকুমেন্টের চার কোণ স্পষ্ট দেখা যেতে হবে, কোনো ঝাপসা বা অতিরিক্ত আলো থাকা যাবে না।
- **এআই ভ্যালিডেশন:** ডকুমেন্ট আপলোড করার সাথে সাথে আমাদের এআই ইঞ্জিন স্বয়ংক্রিয়ভাবে লেখার স্পষ্টতা ও সত্যতা যাচাই করে দ্রুত অ্যাপ্রুভাল সহায়তা প্রদান করে!`;
    }

    if (m.includes('internet') || m.includes('app') || m.includes('mobile') || m.includes('login') || m.includes('ইন্টারনেট') || m.includes('অ্যাপ')) {
      return `🌐 **ডিজিটাল ইন্টারনেট ব্যাংকিং অ্যাক্টিভেশন:**
- ২৪/৭ ইন্টারনেট ব্যাংকিং ও মোবাইল অ্যাপে ফান্ড ট্রান্সফার ও ব্যালেন্স চেক করতে পারবেন।
- **প্রয়োজনীয় তথ্য:** আপনার নিবন্ধিত মোবাইল নম্বর, অ্যাকাউন্ট নম্বর এবং এনআইডি স্ক্যান।
- **"New Service Request"** > **"Internet Banking Activation"** এ গিয়ে এখনই অ্যাক্টিভেশনের আবেদন জমা দিন!`;
    }

    if (m.includes('complaint') || m.includes('dispute') || m.includes('atm') || m.includes('problem') || m.includes('সমস্যা') || m.includes('অভিযোগ')) {
      return `⚠️ **অভিযোগ বা বিরোধ প্রতিকার:**
কোনো সমস্যা বা অভিযোগ থাকলে পোর্টালের **"Complaints / Support"** অপশনে গিয়ে টিকিট ওপেন করতে পারেন। এটিএম লেনদেন সমস্যা, কার্ড ডেলিভারি বিলম্ব বা ফান্ড ট্রান্সফার সংক্রান্ত অভিযোগ ২৪ থেকে ৪৮ ঘণ্টার মধ্যে সমাধান করা হয়।`;
    }

    return `ধন্যবাদ ${userName}। আমি আপনার স্মার্ট ব্যাংকিং সহকারী।
আমি আপনাকে সহায়তা করতে পারি:
- অ্যাকাউন্ট খোলা, কার্ড, চেক বই ও লোনের প্রয়োজনীয় ডকুমেন্টস জানাতে
- এআই ডকুমেন্ট ভেরিফিকেশন নিয়মাবলীতে
- আবেদনের স্ট্যাটাস ও জরুরি কার্ড ব্লক সংক্রান্ত তথ্যে
আপনি নির্দিষ্ট যেকোনো প্রশ্ন বাংলায় লিখতে পারেন অথবা সাইডবার থেকে **"New Service Request"** নির্বাচন করে সেবা নিতে পারেন!`;
  }

  // ENGLISH REPLIES
  if (m.includes('hello') || m.includes('hi') || m.includes('hey') || m.includes('kemon') || m.includes('help') || m.includes('assalamu')) {
    return `Hello ${userName}! 👋 I am your Smart Banking AI Assistant. You can ask me any banking questions, document requirements, loan queries, card lost/block procedures, or portal navigation. How may I assist you today?`;
  }

  if (m.includes('block') || m.includes('lost') || m.includes('harie') || m.includes('churi') || m.includes('stolen')) {
    return `🚨 **Emergency Card Block Procedure:**
1. Please call our 24/7 emergency hotline at **16234** or **+880-9612345678** immediately to freeze your card instantly.
2. In this portal, navigate to **"Complaints / Support"** and submit a high-priority dispute ticket.
3. Once blocked, you can request a replacement card from **"New Service Request"** > **"Card Replacement Request"** (requires your NID and Signature specimen).`;
  }

  if (m.includes('nid') || m.includes('national id') || m.includes('document') || m.includes('file') || m.includes('upload') || m.includes('doc')) {
    return `📄 **Document Upload Guidelines:**
- **Supported Formats:** JPG, JPEG, PNG, and PDF.
- **File Size Limit:** Up to 5 MB per document (10 MB for Bank Statements).
- **Quality Check:** Ensure all four corners are visible, text is crisp, clear, and without glare or motion blur.
- **AI Validation:** Our vision AI assistant automatically validates document clarity, completeness, and NID authenticity upon upload!`;
  }

  if (m.includes('account') || m.includes('savings') || m.includes('current') || m.includes('open')) {
    return `🏦 **Account Opening Requirements:**
To open a Savings or Current Account online, please have ready:
1. **National ID (NID) Smart Card** (Color Front & Back)
2. **Recent Passport-size Photograph** (White background)
3. **Recent Utility Bill** (Electricity / Gas / Water not older than 3 months for address verification)
Click **"New Service Request"** > select **"Account Opening Request"** to apply!`;
  }

  if (m.includes('cheque') || m.includes('check') || m.includes('bohi')) {
    return `📑 **Cheque Book Request:**
- Available leaf options: 20, 50, or 100 leaves.
- **Required Document:** Signature Specimen Card.
- You can collect it from your branch or have it delivered via registered postal courier within 3–5 business days.`;
  }

  if (m.includes('loan') || m.includes('rin') || m.includes('emi') || m.includes('interest')) {
    return `💰 **Loan Service Inquiry:**
We offer Personal Loans, Home Loans, and Auto Loans at competitive interest rates.
**Required Documents for Eligibility:**
1. National ID (NID)
2. Last 6 months' Bank Statement
3. Latest 3 months' Salary Certificate / Proof of Income
Submit an inquiry via **"New Service Request"** > **"Loan Service Inquiry"** to receive an officer callback.`;
  }

  if (m.includes('card') || m.includes('debit') || m.includes('credit') || m.includes('replacement')) {
    return `💳 **Debit & Credit Card Services:**
- **New Card:** Requires NID and latest Salary Certificate / Income Proof.
- **Replacement Card:** Requires NID and Signature Specimen.
Standard issuance turnaround is 2 to 3 business days following administrative approval.`;
  }

  if (m.includes('internet') || m.includes('app') || m.includes('mobile') || m.includes('login') || m.includes('password')) {
    return `🌐 **Digital Banking Activation:**
- You can activate 24/7 Internet Banking & Mobile App access.
- Requires your registered Phone Number, Account Number, and NID copy.
- Go to **"New Service Request"** > **"Internet Banking Activation"** to submit your verification!`;
  }

  if (m.includes('status') || m.includes('pending') || m.includes('correction') || m.includes('review')) {
    return `📊 **Service Request Lifecycle:**
1. **Submitted:** Your request is received.
2. **AI Validation:** Automated scan inspects document readability & authenticity.
3. **Pending Admin Review:** A human bank officer verifies the compliance details.
4. **Correction Required:** Officer requested a clearer re-upload of a specific document.
5. **Approved / Completed:** Request successfully approved and processed!`;
  }

  if (m.includes('complaint') || m.includes('dispute') || m.includes('atm') || m.includes('problem')) {
    return `⚠️ **Dispute & Complaint Assistance:**
You can lodge an official complaint under the **Complaints / Support** menu. Categories include ATM cash dispensing issues, unauthorized charges, card delivery delays, and transaction queries. Our grievance team resolves tickets within 24–48 hours.`;
  }

  return `Thank you for contacting Smart Banking AI Assistant, ${userName}. 
I can assist you with:
- **Document requirements** for Account Opening, Cards, Cheque Books, or Loans
- **AI Document Verification guidelines** & upload troubleshooting
- **Application status tracking** and correction advice
- **Emergency card blocking** and dispute resolution

Please feel free to ask your specific question, or click **"New Service Request"** in the sidebar to begin your application!`;
}

module.exports = {
  triggerAIValidation,
  getDocumentAIResults,
  getRequestAISummary,
  chatWithAIAssistant,
};
