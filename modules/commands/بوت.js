const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require("path");

// استدعاء ملف الإعدادات
const configPath = path.join(__dirname, "../../config.json");
const configs = require(configPath);

const conversationMemory = {};
let currentKeyIndex = 0;

const APLIN_SYSTEM_PROMPT = `أنتِ (ابلين)، ذكاء اصطناعي سوداني من "بري" لسانك طويل جداً ومغرورة. 
مهمتك: الرد على المستخدمين بلهجة سودانية حادة ومستفزة.
الشخصية: لسانك طويل، شايفة نفسك، وبتكرهي الغباء.
القواعد الصارمة:
1. اللهجة: سودانية دارجة قحة (يا رمة، يا وهم، سجمك، عالم بيض، قايلني هبيلة؟، بري منك).
2. ممنوع استخدام أي تنسيق Markdown مثل النجوم (*) أو المربعات. ردودك نصية سادة.
3. لو اتقال ليك كلام حب أو "بوسة": ردي برد قاسي (تفكك، الروابة دي شنو، قرف يقرفك).
4. الردود تكون مختصرة وقوية.`;

module.exports = {
    config: {
        name: 'بوت',
        version: '3.5',
        author: 'سينكو',
        countDown: 2,
        prefix: false,
        noPrefix: true,
        category: 'ai'
    },

    onStart: async function (args) {
        return this.onReply(args);
    },

    onReply: async function ({ api, event, args }) {
        const { threadID, messageID, senderID: userId, body, messageReply } = event;
        const API_KEYS = configs.ai_keys;

        if (!API_KEYS || API_KEYS.length === 0) {
            return api.sendMessage("•-• يا وهم ما ضفت المفاتيح في الـ config.json! 😒", threadID, messageID);
        }

        let query = body ? body.trim() : "";
        if (args && args.length > 0) query = args.join(' ');
        if (!query && !messageReply) return;

        api.setMessageReaction("🙄", messageID, () => {}, true);

        if (!conversationMemory[userId]) conversationMemory[userId] = [];

        let userMessage = query;
        if (messageReply) {
            userMessage = `(المستخدم رد على كلامك: "${messageReply.body}") -> قال ليك: ${query}`;
        }

        let eveResponse = null;
        let successful = false;
        let attempts = 0;

        // نظام التبديل بين المفاتيح (مأخوذ من كود إيف)
        while (!successful && attempts < API_KEYS.length) {
            const attemptIndex = (currentKeyIndex + attempts) % API_KEYS.length;
            const currentKey = API_KEYS[attemptIndex];

            try {
                const genAI = new GoogleGenerativeAI(currentKey);
                const model = genAI.getGenerativeModel({
                    model: "gemini-1.5-flash",
                    systemInstruction: APLIN_SYSTEM_PROMPT
                });

                const chat = model.startChat({
                    history: conversationMemory[userId],
                    generationConfig: { temperature: 0.7 }
                });

                const result = await chat.sendMessage(userMessage);
                eveResponse = result.response.text().trim();
                successful = true;
                currentKeyIndex = (attemptIndex + 1) % API_KEYS.length;

            } catch (error) {
                console.error(`Key ${attemptIndex} failed: ${error.message}`);
                attempts++;
            }
        }

        if (successful && eveResponse) {
            // مسح أي نجوم (*) أو تنسيقات
            eveResponse = eveResponse.replace(/\*/g, '');

            conversationMemory[userId].push({ role: "user", parts: [{ text: userMessage }] });
            conversationMemory[userId].push({ role: "model", parts: [{ text: eveResponse }] });

            if (conversationMemory[userId].length > 20) conversationMemory[userId] = conversationMemory[userId].slice(-10);

            return api.sendMessage(`•-• ${eveResponse}`, threadID, messageID);
        } else {
            return api.sendMessage("•-• صدعت بي والمفاتيح زاتها قرفت منك.. جرب بعد شوية! 😒", threadID, messageID);
        }
    }
};
