# 🚀 Jishant Mitra WhatsApp Bot - Deploy Guide
## Step by Step - 30 Minute Setup

---

## 📁 STEP 1: GitHub par Code Upload Karo

1. **github.com** par jaao → Login karo
2. **"New repository"** button dabao (green button, top right)
3. Repository name: `jishant-whatsapp-bot`
4. **Public** select karo
5. **"Create repository"** dabao

6. Ab apne computer par yeh files ek folder mein rakhein:
   - `index.js`
   - `package.json`
   - `.gitignore`
   - `.env.example`
   - `README.md`

7. GitHub page par **"uploading an existing file"** link dabao
8. Saari files drag & drop karo
9. **"Commit changes"** dabao

✅ GitHub done!

---

## 🚀 STEP 2: Render.com par Deploy Karo

1. **render.com** par jaao → Login karo
2. **"New +"** → **"Web Service"** select karo
3. **"Connect a repository"** → GitHub connect karo
4. `jishant-whatsapp-bot` repository select karo

5. Settings fill karo:
   - **Name:** `jishant-whatsapp-bot`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** `Free`

6. **"Environment Variables"** section mein yeh add karo:

   | Key | Value |
   |-----|-------|
   | `WHATSAPP_TOKEN` | Aapka WhatsApp Access Token |
   | `PHONE_NUMBER_ID` | Aapka Phone Number ID |
   | `VERIFY_TOKEN` | `jishant_webhook_secret_2024` |
   | `GEMINI_API_KEY` | Aapka Gemini API Key |

7. **"Create Web Service"** dabao
8. Deploy hone ka wait karo (2-3 minutes)
9. Aapko milega ek URL jaise: `https://jishant-whatsapp-bot.onrender.com`

✅ Server live!

---

## 📱 STEP 3: Meta Webhook Setup Karo

1. **developers.facebook.com** → Aapki App → WhatsApp → Configuration

2. **Webhook** section mein:
   - **Callback URL:** `https://jishant-whatsapp-bot.onrender.com/webhook`
   - **Verify Token:** `jishant_webhook_secret_2024`

3. **"Verify and Save"** dabao
   - ✅ Green tick aana chahiye

4. **Webhook fields** mein `messages` subscribe karo

5. **Phone Number** section mein apna number add karo

✅ Webhook connected!

---

## ✅ STEP 4: Test Karo!

1. Apne WhatsApp se foundation ke number par message bhejo
2. "Hi" ya "Namaste" likho
3. Bot automatically reply karega with buttons!

---

## 🔧 Troubleshooting

**Bot reply nahi kar raha?**
- Render.com logs check karo (Dashboard → Your Service → Logs)
- Environment variables sahi hain ki nahi check karo
- Meta Webhook verified hai ki nahi dekho

**"Webhook verification failed" error?**
- VERIFY_TOKEN exact same hona chahiye dono jagah
- Render.com par service running honi chahiye pehle

**Gemini error aa raha hai?**
- API Key sahi copy ki hai?
- aistudio.google.com par key active hai?

---

## 📊 Bot Features Summary

| Feature | Status |
|---------|--------|
| Text messages | ✅ |
| Donation guidance | ✅ |
| Volunteer info | ✅ |
| Internship info | ✅ |
| News & updates | ✅ |
| Quick reply buttons | ✅ |
| Conversation memory | ✅ (last 10 messages) |
| Hindi + English | ✅ |
| Voice messages | ❌ (future update) |

---

## 💬 Support
Email: info@jishantfoundation.com
