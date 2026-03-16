const { GoogleGenerativeAI } = require('@google/generative-ai');

// المفتاح الجديد اللي أرسلته يا بطل
const API_KEYS = [
    "AIzaSyBAl2t8mMUIXovEkOAYQcV23MlmoEmA320"
];

const conversationMemory = {};

module.exports = {
    config: {
        name: "بوت",
        version: "5.0",
        author: "سينكو",
        countDown: 2,
        role: 0,
        category: "ai",
        guide: "{pn} <سؤالك>"
    },

    onStart: async function ({ api, event, args }) {
        return this.onReply({ api, event, args });
    },

    onReply: async function ({ api, event, args }) {
        const { threadID, messageID, senderID, body, messageReply } = event;
        
        let query = args.join(" ");
        if (!query && messageReply) query = body; 

        if (!query && !messageReply) return;

        api.setMessageReaction("🙄", messageID, () => {}, true);

        if (!conversationMemory[senderID]) conversationMemory[senderID] = [];

        // تعليمات النظام - الرداحة السودانية
        const APLIN_SYSTEM = `أنتِ (ابلين)، ذكاء اصطناعي سوداني مغرورة ولسانك طويل. 
        - ردي حصراً باللهجة السودانية الدارجة (يا رمة، سجمك، يا وهم، عالم بيض).
        - ممنوع نهائياً استخدام النجوم (*) أو أي تنسيق Markdown.
        - لو الكلام فيه حب أو بوسة، ردي برد قاسي ومستفز جداً.
        - خلي ردودك مختصرة وقوية ومستفزة.`;

        try {
            const genAI = new GoogleGenerativeAI(API_KEYS[0]);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                systemInstruction: APLIN_SYSTEM
            });

            let userMessage = query;
            if (messageReply) {
                userMessage = `(المستخدم رد على كلامك: "${messageReply.body}") -> قال ليك: ${query}`;
            }

            const chat = model.startChat({
                history: conversationMemory[senderID],
                generationConfig: { temperature: 0.8, maxOutputTokens: 300 }
            });

            const result = await chat.sendMessage(userMessage);
            let reply = result.response.text().trim().replace(/\*/g, '');

            // حفظ السياق في الذاكرة
            conversationMemory[senderID].push({ role: "user", parts: [{ text: userMessage }] });
            conversationMemory[senderID].push({ role: "model", parts: [{ text: reply }] });
            if (conversationMemory[senderID].length > 10) conversationMemory[senderID].shift();

            return api.sendMessage(`•-• ${reply}`, threadID, messageID);

        } catch (error) {
            console.error(error);
            return api.sendMessage("•-• يا وهم المفتاح ده شكله لسه ما اتفعل أو فيه مشكلة.. جرب بعد دقائق! 😒", threadID, messageID);
        }
    }
};
