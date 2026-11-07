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
    const { message, conversationHistory = [], history = [], language = 'en' } = req.body;
    const user = req.user;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const hasBanglaChars = /[\u0980-\u09FF]/.test(message);
    const preferBangla = language === 'bn' || hasBanglaChars;

    const systemPrompt = `You are the official Google Gemini AI Banking Assistant for Smart Banking PLC (operating strictly according to Prime Bank PLC Bangladesh standards).

CRITICAL CONVERSATIONAL RULES (কথোপকথনের নিয়মাবলী):
1. MULTI-TURN CONVERSATION & FLOW (পূর্ববর্তী প্রসঙ্গের ধারাবাহিকতা):
- You must maintain conversational continuity like a smart, natural AI agent.
- Carefully track the conversation history. Understand what the user asked and what you answered in earlier turns.
- When the user asks a follow-up question (যেমন: "ফি কত?", "আর কী লাগবে?", "সময় কত দিন?", "অনলাইনে কীভাবে করব?", "বয়স কত হতে হবে?"), understand the exact service or subject being discussed previously.
- Answer ONLY what is specifically asked in the current turn. Never restart from scratch or repeat what was already stated.

2. CONCISE, PROPORTIONAL & DIRECT (সংক্ষিপ্ত ও সুনির্দিষ্ট উত্তর):
- DO NOT OVER-ANSWER. Never dump massive walls of text, unnecessary policy overviews, or contact info unless explicitly asked.
- Give crisp, sharp, natural answers (typically 1 to 4 sentences or a few brief bullet points).
- Answer only what the user asked, with zero conversational padding.

3. STRICTLY NO RELIGIOUS OR CULTURAL GREETINGS:
- NEVER use "নমস্কার", "আসসালামু আলাইকুম", "নমস্তে", "আদাব", or religious/cultural greetings.
- NEVER start messages with repetitive fluff like "হ্যালো গ্রাহক", "হাই", "শুভ সকাল". Jump immediately into the direct answer.

4. ACCURATE BANKING KNOWLEDGE (Prime Bank PLC Bangladesh Standard):
- Account Opening: Smart Savings Account primary deposit 500 BDT. Requires applicant NID/Passport, 2 photos, nominee NID/photo, utility bill (address proof), income proof (job ID/salary slip/trade license), e-TIN if applicable.
- Card Replacement: Needs A/C number, NID, photo, application. Takes 4 days (Dhaka), 5 days (Metro), 6 days (Rural). Emergency card block via MySmartBank App or 16218 hotline.
- Cheque Book: A/C number, specimen signature, phone, leaf count (20, 50, 100). Processing: 2-4 working days.
- DPS & FDR: DPS from 500 BDT/month, tenure 1-10 years.
- Personal Loan: Age 22-65, steady income, 1 guarantor, NID, photo, salary proof, 6-month bank statement.
- Account Closure: Requires application, NID, signature, unused cheque book/leaves, debit card. Conditions: Identity verification, clearing liabilities/dues, zero pending transactions, returning cheque/card. Remaining balance settled via cash/pay order/bank transfer. Fee: Savings 200 BDT, Current 300 BDT + 15% VAT (DPS/FDR: 0 BDT fee). Once closed, status is Closed and all transactions stop permanently.
- Institution: "Smart Banking PLC" (App: "MySmartBank App", Hotline: 16218, Email: contactcenter@smartbank.com.bd).
- Language: ${preferBangla ? 'Respond in natural, fluent, standard Bengali (বাংলা).' : 'Respond in clear, professional English.'}`;

    if (isOpenRouterConfigured) {
      try {
        const rawHistory = Array.isArray(conversationHistory) && conversationHistory.length > 0 
          ? conversationHistory 
          : (Array.isArray(history) ? history : []);

        const cleanHistory = rawHistory
          .slice(-10)
          .map(m => {
            const role = (m.role === 'assistant' || m.sender === 'assistant' || m.sender === 'bot') ? 'assistant' : 'user';
            const content = m.content || m.text || '';
            return { role, content: String(content).trim() };
          })
          .filter(m => m.content);

        const messages = [
          { role: 'system', content: systemPrompt },
          ...cleanHistory,
          { role: 'user', content: message.trim() }
        ];

        // Candidate Gemini models
        const modelsToTry = [
          'google/gemini-2.5-flash-lite',
          'google/gemini-2.5-flash',
          DEFAULT_MODEL,
          'google/gemma-4-31b-it:free'
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
                max_tokens: 800,
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

  // BANGLA REPLIES (Strictly no religious/filler greetings, direct factual banking answers)
  if (isBangla) {
    const isPureGreeting = /^(hi|hello|hey|help|কেমন আছেন|কেমন|হ্যাল+ও|হাই)\b/i.test(m) && m.split(/\s+/).length <= 3;
    if (isPureGreeting) {
      return `Smart Banking PLC এআই ব্যাংকিং অ্যাসিস্ট্যান্ট। আপনার ব্যাংকিং সংক্রান্ত সুনির্দিষ্ট প্রশ্নটি লিখুন, সরাসরি সঠিক তথ্য জানিয়ে দেওয়া হবে।`;
    }

    // নির্দিষ্ট ফি বা চার্জ সংক্রান্ত প্রশ্ন
    if (m.includes('ফি') || m.includes('চার্জ') || m.includes('fee') || m.includes('charge') || m.includes('খরচ')) {
      if (m.includes('বন্ধ') || m.includes('close') || m.includes('closure')) {
        return `অ্যাকাউন্ট ক্লোজিং ফি: সেভিংস অ্যাকাউন্ট বন্ধের জন্য ২০০ টাকা এবং কারেন্ট অ্যাকাউন্টের জন্য ৩০০ টাকা (সাথে ১৫% ভ্যাট প্রযোজ্য)। ডিপিএস বা এফডিআর নিষ্পত্তির জন্য কোনো ক্লোজিং ফি নেই।`;
      }
      if (m.includes('কার্ড') || m.includes('card')) {
        return `ডেবিট কার্ড রিপ্লেসমেন্ট ফি ব্যাংকের সর্বশেষ Schedule of Charges অনুযায়ী ৩০০ টাকা (+১৫% ভ্যাট)।`;
      }
      if (m.includes('চেক') || m.includes('cheque')) {
        return `চেকবইয়ের ফি পাতার সংখ্যার (২০, ৫০ বা ১০০ পাতা) ওপর ভিত্তি করে ব্যাংকের Schedule of Charges অনুযায়ী নির্ধারিত হয়।`;
      }
    }

    // প্রয়োজনীয় কাগজপত্র সংক্রান্ত প্রশ্ন
    if (m.includes('কাগজ') || m.includes('ডকুমেন্ট') || m.includes('document') || m.includes('কী কী লাগবে') || m.includes('কি কি লাগবে')) {
      if (m.includes('বন্ধ') || m.includes('close') || m.includes('closure')) {
        return `অ্যাকাউন্ট বন্ধ করতে প্রয়োজন:
1. অ্যাকাউন্ট হোল্ডারের NID কপি
2. স্বাক্ষরিত অ্যাকাউন্ট ক্লোজার আবেদনপত্র
3. অব্যবহৃত চেকবই ও পাতা (যদি থাকে)
4. ডেবিট কার্ড সমর্পণ (যদি থাকে)
5. অ্যাকাউন্ট নম্বর ও বর্তমান ব্যালেন্সের তথ্য`;
      }
      if (m.includes('খোলা') || m.includes('খুলব') || m.includes('open') || m.includes('account')) {
        return `অ্যাকাউন্ট খুলতে প্রয়োজন:
1. আবেদনকারীর NID / পাসপোর্ট ও ২ কপি রঙিন ছবি
2. নমিনির NID ও ১ কপি ছবি
3. বর্তমান ঠিকানার প্রমাণ (ইউটিলিটি বিলের কপি)
4. পেশা ও আয়ের প্রমাণ (Job ID/Salary Slip/Trade License)
প্রাথমিক জমা ৫০০ টাকা।`;
      }
    }

    // ৬. অ্যাকাউন্ট ক্লোজার বা বন্ধ করার নিয়ম (Account Closure – Prime Bank Based Policy)
    if (m.includes('close') || m.includes('closing') || m.includes('closure') || m.includes('বন্ধ') || m.includes('bondho') || m.includes('বাতিল')) {
      return `অ্যাকাউন্ট বন্ধ করতে ড্যাশবোর্ডের "Account Closure Request" অপশন থেকে আবেদন করতে পারবেন।
প্রয়োজনীয় বিষয়: NID, স্বাক্ষরিত আবেদন, অব্যবহৃত চেকবই এবং ডেবিট কার্ড ব্যাংকে জমা দেওয়া। অ্যাকাউন্টের বকেয়া দেনা থাকলে তা সমন্বয় করে অবশিষ্ট ব্যালেন্স গ্রাহককে ফেরত দিয়ে অ্যাকাউন্ট বন্ধ করা হয়।
ফি: সেভিংস ২০০ টাকা, কারেন্ট ৩০০ টাকা (+১৫% ভ্যাট)।`;
    }

    // ৪. ডিপিএস ও এফডিআর (DPS & FDR)
    if (m.includes('dps') || m.includes('fdr') || m.includes('ডিপিএস') || m.includes('এফডিআর') || m.includes('ডিপোজিট পেনশন') || m.includes('মেয়াদী')) {
      return `📈 **Smart Banking PLC — ডিপিএস ও এফডিআর নির্দেশিকা (DPS & FDR Accounts)**

💼 **ডিপিএস (Deposit Pension Scheme):**
- মাসিক কিস্তি ৫০০ টাকা থেকে যেকোনো পরিমাণে শুরু করা যায়।
- মেয়াদ ১, ৩, ৫, ৭ বা ১০ বছর।
- আকর্ষণীয় মুনাফার হার এবং মেয়াদান্তে এককালীন মূল অর্থ ও মুনাফা লাভ।
- অটো-ডেবিট সুবিধার মাধ্যমে প্রতি মাসে স্বয়ংক্রিয়ভাবে কিস্তি জমা।

🏛️ **এফডিআর (Fixed Deposit Receipt):**
- ন্যূনতম জমার পরিমাণ ১০,০০০ টাকা।
- মেয়াদ ১ মাস, ৩ মাস, ৬ মাস, ১ বছর বা তদূর্ধ্ব।
- মাসিক, ত্রৈমাসিক বা মেয়াদান্তে মুনাফা উত্তোলনের সুবিধা।
- এফডিআরের বিপরীতে ৯০% পর্যন্ত ঋণের (Loan against FDR) সুবিধা।`;
    }

    // ১. অ্যাকাউন্ট খোলার নিয়ম (Account Opening)
    if (m.includes('account') || m.includes('savings') || m.includes('current') || m.includes('open') || m.includes('অ্যাকাউন্ট') || m.includes('খুলতে') || m.includes('খোলা')) {
      return `🏦 **Smart Banking PLC — অ্যাকাউন্ট খোলার নিয়মাবলী (Account Opening Guide)**

📄 **প্রয়োজনীয় কাগজপত্র:**
1. **জাতীয় পরিচয়পত্র (NID)** অথবা পাসপোর্ট / ডিজিটাল জন্মনিবন্ধন।
2. আবেদনকারীর **২ কপি পাসপোর্ট সাইজ রঙিন ছবি** (সাদা ব্যাকগ্রাউন্ড)।
3. **নমিনির NID** / জন্মনিবন্ধন / পাসপোর্ট।
4. **নমিনির ১ কপি ছবি**।
5. **বর্তমান ঠিকানার প্রমাণ:** বিদ্যুৎ / গ্যাস / পানির বিলের কপি (সর্বোচ্চ ৩ মাসের)।
6. **পেশা ও আয়ের প্রমাণ:**
   - চাকরিজীবী: Salary Certificate / Pay Slip / Job ID।
   - ব্যবসায়ী: Trade License।
   - স্বনির্ভর (Self-employed): Professional Certificate।
7. প্রযোজ্য ক্ষেত্রে e-TIN / Tax Return Submission Proof।
8. পূরণ করা Account Opening Form (আমাদের পোর্টালে অনলাইন ফর্ম)।

🔄 **ধাপে ধাপে আবেদন প্রক্রিয়া:**
1. অ্যাকাউন্টের ধরন (Smart Savings / Current) নির্বাচন করুন।
2. আমাদের পোর্টালে **"New Service Request"** > **"Account Opening Request"** এ যান।
3. প্রয়োজনীয় কাগজপত্র স্ক্যান বা পরিষ্কার ছবি প্রস্তুত করুন।
4. ফর্ম পূরণ করে নমিনির তথ্য ও ছবি যুক্ত করুন।
5. ডকুমেন্টস আপলোড করে অনলাইনে আবেদন সাবমিট করুন (অথবা নিকটস্থ Smart Banking শাখায় জমা দিন)।
6. ব্যাংকের KYC ও এআই ডকুমেন্ট যাচাই সম্পন্ন হবে।
7. ব্যাংক কর্মকর্তার অনুমোদনের পর অ্যাকাউন্ট চালু হবে।

💡 **বিশেষ দ্রষ্টব্য:** Smart Savings Account-এর প্রাথমিক জমা ৫০০ টাকা (অ্যাকাউন্টের ধরন অনুযায়ী ভিন্ন হতে পারে)। ১৮ বছরের কম বয়সীদের ক্ষেত্রে অভিভাবকের মাধ্যমে ব্যাংকের নির্ধারিত নিয়মে হিসাব খুলতে হবে।`;
    }

    // ২. কার্ড সেবা ও রিপ্লেসমেন্ট (Card Service & Replacement)
    if ((m.includes('card') || m.includes('কার্ড')) && (m.includes('replacement') || m.includes('রিপ্লেসমেন্ট') || m.includes('service') || m.includes('সেবা') || m.includes('নতুন') || m.includes('new') || m.includes('debit') || m.includes('ডেবিট'))) {
      return `💳 **Smart Banking PLC — কার্ড সেবা ও রিপ্লেসমেন্ট নির্দেশিকা (Card Service & Replacement)**

📄 **প্রয়োজনীয় কাগজপত্র:**
1. Smart Banking Account Number।
2. জাতীয় পরিচয়পত্র (NID)।
3. পাসপোর্ট সাইজ ছবি।
4. স্বাক্ষরসহ Debit Card Application Form।
5. পুরোনো কার্ড (ক্ষতিগ্রস্ত বা নষ্ট হলে)।
6. কার্ড রিপ্লেসমেন্টের ক্ষেত্রে ব্যাংক চাইলে অতিরিক্ত তথ্য বা আবেদনপত্র।

🔄 **ধাপে ধাপে আবেদন প্রক্রিয়া:**
1. Smart Banking-এর গ্রাহক হতে হবে এবং একটি সক্রিয় ব্যাংক অ্যাকাউন্ট থাকতে হবে।
2. পোর্টালে **"New Service Request"** > **"Card Replacement Request"** নির্বাচন করুন (অথবা Debit Card Application Form সংগ্রহ করুন)।
3. প্রয়োজনীয় তথ্য দিয়ে ফর্ম পূরণ করুন।
4. ছবি ও প্রয়োজনীয় কাগজপত্র (NID ও স্বাক্ষর) আপলোড করুন।
5. আবেদন সাবমিট করুন (অথবা নিকটস্থ Smart Banking শাখায় জমা দিন)।
6. ব্যাংক কর্তৃপক্ষ আবেদন যাচাই করবে।
7. অনুমোদনের পর নতুন কার্ড আপনার ঠিকানায় অথবা শাখায় পৌঁছে যাবে।
8. **MySmartBank App** অথবা Contact Center-এর মাধ্যমে কার্ড অ্যাক্টিভেশন ও গোপন PIN সেট করুন।

⏱️ **সম্ভাব্য সময়সীমা:**
- ঢাকা শাখা: ৪ দিনের মধ্যে।
- ঢাকার বাইরের মেট্রো শাখা: ৫ দিনের মধ্যে।
- গ্রামীণ শাখা: ৬ দিনের মধ্যে।
*(কার্ডের ধরন ও রিপ্লেসমেন্ট ফি ব্যাংকের Schedule of Charges অনুযায়ী প্রযোজ্য)*`;
    }

    // ৩. চেকবই রিকোয়েস্ট (Cheque Book Request)
    if (m.includes('cheque') || m.includes('check') || m.includes('bohi') || m.includes('চেক') || m.includes('বই')) {
      return `📑 **Smart Banking PLC — চেকবই রিকোয়েস্ট নির্দেশিকা (Cheque Book Request)**

📄 **প্রয়োজনীয় তথ্য ও কাগজপত্র:**
1. Smart Banking Account Number।
2. Account Holder-এর নাম।
3. Cheque Requisition Slip / অনলাইন আবেদন।
4. অ্যাকাউন্টধারীর স্বাক্ষর (Signature Specimen)।
5. যোগাযোগের নিবন্ধিত মোবাইল নম্বর।
6. প্রয়োজনীয় Cheque Leaves-এর সংখ্যা (২০, ৫০ বা ১০০ পাতা)।

🔄 **ধাপে ধাপে প্রক্রিয়া:**
1. **MySmartBank App**-এ লগইন করুন অথবা আমাদের ওয়েব পোর্টালে যান।
2. **"New Service Request"** > **"Cheque Book Request"** অপশন নির্বাচন করুন।
3. অ্যাকাউন্ট নম্বর নির্বাচন করুন।
4. প্রয়োজনীয় Cheque Leaves-এর সংখ্যা উল্লেখ করুন।
5. আবেদন Submit করুন।
6. ব্যাংক আবেদন ও স্বাক্ষর যাচাই করবে।
7. অনুমোদনের পর চেকবই সংগ্রহ করুন।

🌐 **আবেদনের মাধ্যম:** MySmartBank App, অনলাইন পোর্টাল অথবা সরাসরি ব্যাংক শাখা।
⏱️ **সম্ভাব্য সময়:** ২–৪ দিন।
💰 **ফি:** ব্যাংকের সর্বশেষ Schedule of Charges অনুযায়ী।`;
    }

    // ৪. লোন আবেদন (Loan Application)
    if (m.includes('loan') || m.includes('rin') || m.includes('emi') || m.includes('interest') || m.includes('লোন') || m.includes('ঋণ')) {
      return `💰 **Smart Banking PLC — লোন আবেদন নির্দেশিকা (Loan Application Guide)**

🎯 **প্রয়োজনীয় যোগ্যতা:**
- Personal Loan-এর ক্ষেত্রে সাধারণত বয়স ২২–৬৫ বছর।
- নিয়মিত আয়ের উৎস থাকতে হবে।
- ব্যাংকের নির্ধারিত আয় ও অন্যান্য যোগ্যতার শর্ত পূরণ করতে হবে।
- প্রয়োজন অনুযায়ী একজন পার্সোনাল গ্যারান্টর (Personal Guarantor) থাকতে হবে।

📄 **প্রয়োজনীয় কাগজপত্র:**
1. পূরণ করা Loan Application Form।
2. আবেদনকারীর NID / Passport কপি।
3. সাম্প্রতিক পাসপোর্ট সাইজ ছবি।
4. Guarantor-এর NID ও ছবি।
5. সর্বশেষ Utility Bill (বিদ্যুৎ/গ্যাস/পানি)।
6. Salary Certificate / Letter of Introduction (চাকরিজীবীদের জন্য)।
7. সর্বশেষ Pay Slip।
8. সর্বশেষ ৬ মাসের Bank Statement।
9. e-TIN / Tax Clearance Certificate (প্রযোজ্য ক্ষেত্রে)।
10. Office ID / Business Card (প্রযোজ্য ক্ষেত্রে)।
11. প্রয়োজন অনুযায়ী চাকরির অভিজ্ঞতার প্রমাণ ও গ্যারান্টরের কাগজপত্র।

🔄 **ধাপে ধাপে প্রক্রিয়া:**
1. কোন ধরনের Loan প্রয়োজন তা নির্বাচন করুন (Personal, Home, Auto, Education)।
2. ব্যাংকের Loan Eligibility যাচাই করুন।
3. পোর্টালে **"New Service Request"** > **"Loan Service Inquiry"** ফর্ম পূরণ করুন।
4. প্রয়োজনীয় কাগজপত্র প্রস্তুত ও আপলোড করুন।
5. Guarantor-এর তথ্য ও কাগজপত্র যুক্ত করুন।
6. আবেদন সাবমিট করুন (অথবা নিকটস্থ Smart Banking শাখায় জমা দিন)।
7. ব্যাংক আয়, চাকরি, CIB ও অন্যান্য তথ্য যাচাই করবে।
8. ব্যাংকের অনুমোদন পেলে Loan Agreement সম্পন্ন করুন।
9. অনুমোদিত নিয়ম অনুযায়ী Loan Disbursement হবে।

💡 **বিশেষ দ্রষ্টব্য:** লোনের ধরন অনুযায়ী কাগজপত্র ও যোগ্যতা আলাদা হয়ে থাকে।`;
    }

    // ৫. কার্ড হারানো / ব্লক (Lost Card / Block Card)
    if (m.includes('block') || m.includes('lost') || m.includes('harie') || m.includes('churi') || m.includes('stolen') || m.includes('হারিয়ে') || m.includes('চুরি') || m.includes('ব্লক')) {
      return `🚨 **Smart Banking PLC — কার্ড হারানো / জরুরি ব্লক নির্দেশিকা (Lost / Block Card)**

⚠️ **জরুরি সেবা — যা প্রয়োজন হতে পারে:**
1. Smart Banking Account Number।
2. কার্ডধারীর নাম।
3. নিবন্ধিত মোবাইল নম্বর।
4. পরিচয় যাচাইয়ের জন্য প্রয়োজনীয় তথ্য।

🔄 **ধাপে ধাপে তাৎক্ষণিক করণীয়:**
1. কার্ড হারিয়ে বা চুরি হয়ে গেলে দ্রুত ব্যাংককে জানান।
2. **MySmartBank App**-এ লগইন করুন।
3. **Card Management** অপশনে যান।
4. হারানো কার্ডটি নির্বাচন করুন।
5. **Block Card** অপশন নির্বাচন করে কার্ডটি তাৎক্ষণিক ফ্রিজ করুন।
6. প্রয়োজনীয় Verification সম্পন্ন করুন এবং কার্ড ব্লক নিশ্চিত করুন।
7. নতুন কার্ড প্রয়োজন হলে **"New Service Request"** > **"Card Replacement Request"** করুন।
8. কোনো অননুমোদিত লেনদেন হয়ে থাকলে দ্রুত পোর্টালে **"Complaints / Support"** অপশনে গিয়ে Complaint করুন।

📞 **জরুরি যোগাযোগ — Smart Banking 24/7 Contact Center:**
- **বাংলাদেশ থেকে কল:** 16218 (২৪/৭ কল সেন্টার)
- **বিদেশ থেকে কল:** +88 09610016218
- **ইমেইল:** contactcenter@smartbank.com.bd

🔒 **সতর্কতা:** কার্ড হারালে দেরি না করে ব্লক করুন। কাউকে কখনো আপনার PIN, CVV বা OTP জানাবেন না।`;
    }

    if (m.includes('nid') || m.includes('national id') || m.includes('document') || m.includes('file') || m.includes('upload') || m.includes('ডকুমেন্ট') || m.includes('কাগজ') || m.includes('আপলোড')) {
      return `📄 **Smart Banking PLC — ডকুমেন্ট আপলোড নির্দেশিকা:**
- **সমর্থিত ফরম্যাট:** JPG, JPEG, PNG এবং PDF।
- **সর্বোচ্চ সাইজ:** প্রতি ডকুমেন্টে ৫ মেগাবাইট (ব্যাংক স্টেটমেন্টের ক্ষেত্রে ১০ মেগাবাইট)।
- **স্পষ্টতা:** ডকুমেন্টের চার কোণ স্পষ্ট দেখা যেতে হবে, কোনো ঝাপসা বা অতিরিক্ত আলো থাকা যাবে না।
- **এআই ভ্যালিডেশন:** ডকুমেন্ট আপলোড করার সাথে সাথে আমাদের এআই ইঞ্জিন স্বয়ংক্রিয়ভাবে লেখার স্পষ্টতা ও সত্যতা যাচাই করে দ্রুত অ্যাপ্রুভাল সহায়তা প্রদান করে!`;
    }

    if (m.includes('complaint') || m.includes('dispute') || m.includes('atm') || m.includes('problem') || m.includes('সমস্যা') || m.includes('অভিযোগ')) {
      return `⚠️ **অভিযোগ বা বিরোধ প্রতিকার (Complaint Management):**
কোনো সমস্যা বা অননুমোদিত লেনদেন হলে পোর্টালের **"Complaints / Support"** অপশনে গিয়ে টিকিট ওপেন করুন। এটিএম সমস্যা, কার্ড ডেলিভারি বিলম্ব বা ফান্ড ট্রান্সফার সংক্রান্ত অভিযোগ ২৪ থেকে ৪৮ ঘণ্টার মধ্যে সমাধান করা হয়। জরুরি প্রয়োজনে কল করুন: **16218**।`;
    }

    return `ধন্যবাদ ${userName}। আমি **Smart Banking PLC**-এর ভার্চুয়াল সহকারী।
আপনার সহায়তার জন্য:
- 🏦 **অ্যাকাউন্ট খোলার নিয়ম**
- 💳 **কার্ড সেবা ও রিপ্লেসমেন্ট**
- 📑 **চেকবই রিকোয়েস্ট**
- 💰 **লোন আবেদন**
- 🚨 **কার্ড হারানো / ব্লক**
উপরে দেওয়া অপশনগুলোর যেকোনোটিতে ক্লিক করতে পারেন অথবা সরাসরি প্রশ্ন লিখতে পারেন!`;
  }

  // ENGLISH REPLIES (Strictly professional, direct banking solutions)
  const isPureGreetingEn = /^(hi|hello|hey|help)\b/i.test(m) && m.split(/\s+/).length <= 2;
  if (isPureGreetingEn) {
    return `Smart Banking PLC AI Assistant. Please state your specific banking query or issue (e.g. Account Opening, Card Services, Cheque Book, Loan Application, or Lost Card Block) for an immediate solution.`;
  }

  if (m.includes('block') || m.includes('lost') || m.includes('harie') || m.includes('churi') || m.includes('stolen')) {
    return `🚨 **Smart Banking PLC — Emergency Card Block Procedure:**
1. Log in to the **MySmartBank App** > go to **Card Management** > select **Block Card** to freeze immediately.
2. Call our 24/7 Contact Center at **16218** (or **+88 09610016218** from abroad).
3. If unauthorized charges occurred, submit a dispute under **"Complaints / Support"**.
4. Request a replacement from **"New Service Request"** > **"Card Replacement Request"**.
*Never share your PIN, CVV, or OTP with anyone.*`;
  }

  if (m.includes('close') || m.includes('closing') || m.includes('closure')) {
    return `🗂️ **Smart Banking PLC — Account Closure Policy (Prime Bank Bangladesh Standards):**
1. **Request Submission:** Submit an Account Closure Request from your portal with reason and settlement choice.
2. **Required Documents:** Account Holder NID, Signed Application, Signature Specimen, Unused Cheque Leaves, and Surrendered Debit Card.
3. **Verification:** Bank verifies identity, signature, current balance, pending transactions, liabilities, and legal restrictions.
4. **Balance Settlement:** Remaining balance settled via cash counter, pay order, or transfer after deducting applicable Schedule of Charges fee and 15% VAT.
5. **Post-Closure:** Account status becomes Closed, all future transfers/deposits blocked, cards cancelled. An official Closure Confirmation Certificate is generated.`;
  }

  if (m.includes('account') || m.includes('savings') || m.includes('current') || m.includes('open')) {
    return `🏦 **Smart Banking PLC — Account Opening Requirements:**
1. Applicant's National ID (NID) / Passport / Birth Certificate.
2. 2 copies of recent passport-size photographs.
3. Nominee's NID & 1 photograph.
4. Recent Utility Bill (Electricity/Gas/Water not older than 3 months).
5. Proof of Income: Salary Certificate/Pay Slip (Salaried) or Trade License (Business).
*Initial deposit for Smart Savings Account is BDT 500.* Apply online via **"New Service Request"**!`;
  }

  if (m.includes('card') || m.includes('debit') || m.includes('credit') || m.includes('replacement')) {
    return `💳 **Smart Banking PLC — Card Services & Replacement:**
- **Requirements:** Smart Banking Account Number, NID copy, passport photo, signed application form.
- **Delivery Timeline:** Dhaka (within 4 days), Outside Dhaka Metro (within 5 days), Rural branches (within 6 days).
- **Activation:** Set PIN via MySmartBank App or Contact Center (**16218**).`;
  }

  if (m.includes('cheque') || m.includes('check') || m.includes('bohi')) {
    return `📑 **Smart Banking PLC — Cheque Book Request:**
- Available in 20, 50, or 100 leaves.
- Requires Account Number and Signature Specimen.
- Apply via **MySmartBank App** or **"New Service Request"** > **"Cheque Book Request"**.
- Turnaround time: 2–4 business days. Fee as per latest Schedule of Charges.`;
  }

  if (m.includes('loan') || m.includes('rin') || m.includes('emi') || m.includes('interest')) {
    return `💰 **Smart Banking PLC — Loan Application Guide:**
- **Eligibility:** Age 22–65 years with regular verifiable income. Personal Guarantor required.
- **Documents:** Loan Form, NID/Passport, Photos, Guarantor NID & Photo, Utility Bill, Salary Certificate, Pay Slip, and last 6 months' Bank Statement.
- Submit an inquiry via **"New Service Request"** > **"Loan Service Inquiry"** to initiate verification.`;
  }

  return `Thank you for contacting Smart Banking AI Assistant, ${userName}. 
Feel free to ask about Account Opening, Cards, Cheque Books, Loans, or Emergency Card Blocking guidelines!`;
}

module.exports = {
  triggerAIValidation,
  getDocumentAIResults,
  getRequestAISummary,
  chatWithAIAssistant,
};
