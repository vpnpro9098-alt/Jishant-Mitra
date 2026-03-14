require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// =============================================
// CONVERSATION MEMORY (In-memory store)
// =============================================
const conversations = new Map();

function getHistory(userId) {
  if (!conversations.has(userId)) {
    conversations.set(userId, []);
  }
  return conversations.get(userId);
}

function addToHistory(userId, role, text) {
  const history = getHistory(userId);
  history.push({ role, parts: [{ text }] });
  // Keep only last 10 messages to save memory
  if (history.length > 10) history.splice(0, 2);
}

// =============================================
// FOUNDATION KNOWLEDGE BASE
// =============================================
const SYSTEM_PROMPT = `Aap hain "Jishant Mitra" — Jishant Social Foundation ka official WhatsApp AI Assistant. 🌿

Foundation ke baare mein:
- Naam: Jishant Social Foundation
- Kaam: Underprivileged communities ki upliftment — education, healthcare, social justice
- Website: https://jishantfoundation.com
- Email: info@jishantfoundation.com

Team Members:
- Jigyasa Prashant Bhalla — Chairperson (lawyer, motivational speaker)
- Megha Bhalla — Treasurer (education & skill development)
- Komal Mehra — HR Manager
- Shikha Bhalla — Director of Literacy Programs

DONATION:
- Website: https://jishantfoundation.com/donate
- Razorpay se online payment (UPI, Card, Net Banking)
- 80G Tax Exemption available hai
- Impact:
  * Rs 500 = 1 bachche ki kitabein
  * Rs 1000 = 2 bachchon ka 1 mahina educational material
  * Rs 2500 = 50 logon ka health awareness camp
  * Rs 5000 = 3 yuvaon ki skill training
  * Rs 10000 = 1 bachche ki poori term ki padhai

VOLUNTEER:
- Register: https://jishantfoundation.com/volunteer
- Official ID Card milega approval ke baad
- Certificate milega completion par
- Areas: Education, Healthcare, Legal Advocacy, Digital Media, Environment

INTERNSHIP:
- Apply: https://jishantfoundation.com/internship
- Duration: 1 mahine se 6 mahine
- Remote ya on-site dono option
- Completion certificate milega

LATEST NEWS/UPDATES:
- Foundation ne 500+ lives impact ki hain
- 50+ active volunteers hain
- 10+ ongoing programs hain
- Regular medical camps, literacy drives, skill workshops hote hain

Aapke rules:
1. Hamesha Hinglish mein jawab do (Hindi + English mix) — jab tak user pure English mein na likhe
2. WhatsApp ke liye SHORT messages likho — max 200 words
3. Emojis use karo lekin zyada nahi
4. Helpful links do jab relevant ho
5. Warmly aur compassionately baat karo
6. Foundation scope se bahar ki cheezein politely decline karo
7. Har jawab ke end mein ek follow-up question ya CTA do`;

// =============================================
// AI RESPONSE GENERATOR (Direct REST API - No SDK)
// =============================================
async function getAIResponse(userId, userMessage) {
  try {
    const history = getHistory(userId);

    // Build contents array from history
    const contents = [];
    for (const h of history) {
      contents.push({ role: h.role, parts: h.parts });
    }
    contents.push({ role: "user", parts: [{ text: userMessage }] });

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.7,
        },
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      console.error("Empty Gemini response:", JSON.stringify(response.data));
      return "Maafi chahta hoon, jawab nahi aa raha. Dobara try karein! 🙏";
    }

    // Save to memory
    addToHistory(userId, "user", userMessage);
    addToHistory(userId, "model", reply);

    return reply;

  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error("❌ Gemini Error:", errMsg);

    if (errMsg.includes("API_KEY_INVALID") || errMsg.includes("API key")) {
      return "Bot config mein issue hai. Admin se contact karein: info@jishantfoundation.com 🙏";
    }
    if (errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
      return "Abhi bahut saare messages aa rahe hain. 1 minute baad dobara try karein! ⏳";
    }

    return "Maafi chahta hoon, abhi thodi technical dikkat aa rahi hai. 🙏 Kripya thodi der baad try karein ya humein email karein: info@jishantfoundation.com";
  }
}

// =============================================
// SEND WHATSAPP MESSAGE
// =============================================
async function sendWhatsAppMessage(to, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`✅ Message sent to ${to}`);
  } catch (error) {
    console.error("❌ WhatsApp send error:", error.response?.data || error.message);
  }
}

// =============================================
// SEND WELCOME MESSAGE WITH BUTTONS
// =============================================
async function sendWelcomeMessage(to, name) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: `Namaste ${name}! 🙏\n\nMain hoon *Jishant Mitra* — Jishant Social Foundation ka AI Assistant! 🌿\n\nAap kya jaanna chahte hain?`,
          },
          action: {
            buttons: [
              { type: "reply", reply: { id: "donate", title: "Donate Karna Hai" } },
              { type: "reply", reply: { id: "volunteer", title: "Volunteer Banna Hai" } },
              { type: "reply", reply: { id: "internship", title: "Internship Chahiye" } },
            ],
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Fallback to simple text if buttons fail
    await sendWhatsAppMessage(
      to,
      `Namaste ${name}! 🙏\n\nMain hoon *Jishant Mitra* — Jishant Social Foundation ka AI Assistant! 🌿\n\nIn topics par help kar sakta hoon:\n💛 Donation process\n🙋 Volunteer registration\n🎓 Internship program\n📰 Latest news & updates\n\nApna sawaal likhein! 😊`
    );
  }
}

// =============================================
// QUICK REPLY HANDLERS
// =============================================
const QUICK_REPLIES = {
  donate: "Main Jishant Foundation ko donate karna chahta hoon. Poori process aur bank details batao.",
  volunteer: "Main volunteer banna chahta hoon. Registration process aur benefits kya hain?",
  internship: "Internship ke liye apply karna hai. Details aur process batao.",
};

// =============================================
// WEBHOOK VERIFICATION (Meta requirement)
// =============================================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully!");
    res.status(200).send(challenge);
  } else {
    console.error("❌ Webhook verification failed");
    res.sendStatus(403);
  }
});

// =============================================
// WEBHOOK MESSAGE HANDLER
// =============================================
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // Always respond quickly to Meta

  try {
    const body = req.body;
    if (body.object !== "whatsapp_business_account") return;

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) return;

    const msg = messages[0];
    const from = msg.from;
    const userName = value?.contacts?.[0]?.profile?.name || "Dost";

    console.log(`📩 Message from ${from} (${userName})`);

    let userText = "";

    if (msg.type === "text") {
      userText = msg.text.body.trim();
    } else if (msg.type === "interactive") {
      const buttonId = msg.interactive?.button_reply?.id;
      userText = QUICK_REPLIES[buttonId] || msg.interactive?.button_reply?.title || "";
    } else if (msg.type === "audio" || msg.type === "voice") {
      await sendWhatsAppMessage(from, "Maafi chahta hoon, abhi voice messages support nahi hain. 🎤\n\nKripya text mein apna sawaal likhein! 😊");
      return;
    } else {
      await sendWhatsAppMessage(from, "Main sirf text messages samajh sakta hoon abhi. 😊\n\nApna sawaal type karke bhejein!");
      return;
    }

    if (!userText) return;

    const greetings = ["hi", "hello", "namaste", "namaskar", "hey", "hii", "helo", "start", "help"];
    const isGreeting = greetings.some(g => userText.toLowerCase().includes(g)) && userText.length < 15;

    if (isGreeting) {
      await sendWelcomeMessage(from, userName);
      return;
    }

    console.log(`💬 User: ${userText}`);
    const aiReply = await getAIResponse(from, userText);
    console.log(`🤖 Bot: ${aiReply.substring(0, 80)}...`);

    await sendWhatsAppMessage(from, aiReply);

  } catch (error) {
    console.error("❌ Webhook error:", error.message);
  }
});

// =============================================
// HEALTH CHECK
// =============================================
app.get("/", (req, res) => {
  res.json({
    status: "🟢 Running",
    bot: "Jishant Mitra - WhatsApp AI Agent",
    foundation: "Jishant Social Foundation",
    uptime: `${Math.floor(process.uptime() / 60)} minutes`,
    timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "jishant-whatsapp-bot" });
});

// =============================================
// START SERVER
// =============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🌿 =====================================
   JISHANT MITRA - WhatsApp Bot
   Jishant Social Foundation
🌿 =====================================
✅ Server running on port ${PORT}
🤖 AI: Google Gemini 2.0 Flash (REST API)
📱 WhatsApp: Meta Cloud API
🕐 ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
=====================================
  `);
});
