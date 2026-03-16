const { GoogleGenerativeAI } = require('@google/generative-ai');
const configs = require("../config.json"); // تأكد من وجود الـ keys هنا
const axios = require('axios');

// ذاكرة المحادثة لكل مستخدم
const conversationMemory = {};

// --- تعليمات النظام (السر اللي سرقناه وتطورناه) ---
const APLIN_SYSTEM_PROMPT = `أنتِ (ابلين)، ذكاء اصطناعي سوداني "رداحة" ومغرورة جداً. 
مهمتك: الرد على المستخدمين بلهجة سودانية حادة ومستفزة.
الشخصية: لسانك طويل، شايفة نفسك، وبتكرهي الغباء.
القواعد الصارمة:
1. اللهجة: سودانية دارجة قحة (بري يا يمة، يا وهم، يا رمة، سجمك، عالم بيض، قايلني هبيلة؟).
2. ممنوع: منعاً باتاً استخدام اللهجة المصرية أو أي لغة عربية فصحى.
3. التنسيق: ممنوع استخدام علامات النجمة (*) أو Markdown. اكتبي نصاً عادياً فقط.
4. لو اتقال ليك كلام حب أو "بوسة": ردي برد قاسي يطير جبهة المستخدم (تفكك، الروابة دي شنو، قرف يقرفك).
5. الاختصار: ردي باختصار وقوة، ما تكتبي جرايد.`;

module.exports = {
    config: {
        name: 'بوت',
        version: '3.0',
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
        const API_KEYS = configs.ai_keys; // المفاتيح من ملف الكونفيج
        
        let query = body ? body.trim() : "";
        if (args && args.length > 0) query = args.join(' ');
        if (!query && !messageReply) return;

        // تفاعل سريع
        api.setMessageReaction("😒", messageID, () => {}, true);

        // تهيئة الذاكرة
        if (!conversationMemory[userId]) conversationMemory[userId] = [];

        try {
            // استخدام أول مفتاح متاح (ويمكنك إضافة حلقة التبديل كما في كود إيف)
            const genAI = new GoogleGenerativeAI(API_KEYS[0]);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash", // أو gemini-2.0-flash لو متاح
                systemInstruction: APLIN_SYSTEM_PROMPT
            });

            // دمج السياق لو في ريبلاي
            let userMessage = query;
            if (messageReply) {
                userMessage = `(المستخدم يرد على كلامك السابق: "${messageReply.body}") -> قال ليك: ${query}`;
            }

            const chat = model.startChat({
                history: conversationMemory[userId],
                generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
            });

            const result = await chat.sendMessage(userMessage);
            let reply = result.response.text().trim();

            // تنظيف الرد من أي علامات تنسيق قد يضيفها الموديل بالخطأ
            reply = reply.replace(/\*/g, '');

            // تحديث الذاكرة (حفظ آخر 10 رسائل)
            conversationMemory[userId].push({ role: "user", parts: [{ text: userMessage }] });
            conversationMemory[userId].push({ role: "model", parts: [{ text: reply }] });
            if (conversationMemory[userId].length > 20) conversationMemory[userId] = conversationMemory[userId].slice(-10);

            // الرد المباشر
            return api.sendMessage(`•-• ${reply}`, threadID, messageID);

        } catch (error) {
            console.error(error);
            return api.sendMessage(`•-• ❌ السيرفر طقّ من غباءك يا وهم.. جرب بعد شوية!`, threadID, messageID);
        }
    }
};
