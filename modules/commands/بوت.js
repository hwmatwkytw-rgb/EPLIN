const { GoogleGenerativeAI } = require('@google/generative-ai');

// المفاتيح مباشرة هنا عشان نختصر أي مشكلة في ملف الـ config
const API_KEYS = [
    "https://aistudio.google.com/prompts/new_chat?hl=ar-SD&project=gen-lang-client-0700010620",
    ""
];

const conversationMemory = {};
let currentKeyIndex = 0;

module.exports = {
    config: {
        name: "بوت",
        version: "4.5",
        author: "سينكو",
        countDown: 2,
        role: 0, // 0 للمستخدمين، 1 للآدمن
        shortDescription: "ذكاء اصطناعي سوداني ردّاحة",
        longDescription: "ذكاء اصطناعي بلهجة سودانية مستفزة وقوية",
        category: "ai",
        guide: "{pn} <الكلام>"
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, body } = event;
        // لو المستخدم كتب "ابلين" بس بدون كلام
        if (args.length === 0 && !event.messageReply) {
            return api.sendMessage("•-• أكتب حاجة يا وهم.. قايلني بقرا الأفكار؟ 🙄", threadID, messageID);
        }
        return this.onReply({ api, event, args });
    },

    onReply: async function ({ api, event, args }) {
        const { threadID, messageID, senderID, messageReply } = event;
        
        let query = args.join(" ");
        if (!query && messageReply) query = event.body; // لأخذ الكلام في حالة الرد

        if (!query && !messageReply) return;

        api.setMessageReaction("🙄", messageID, () => {}, true);

        if (!conversationMemory[senderID]) conversationMemory[senderID] = [];

        const APLIN_SYSTEM = `أنتِ (ابلين)، ذكاء اصطناعي سوداني من "بري" لسانك طويل ومغرورة. 
        لهجتك سودانية قحة (يا رمة، سجمك، يا وهم، عالم بيض). لا تستخدمي النجوم (*). 
        ردي باختصار وقوة وبدون أي احترام. لو في كلام حب ردي بـ (تفكك، الروابة دي شنو).`;

        let userMessage = query;
        if (messageReply) {
            userMessage = `(سياق: رد على: "${messageReply.body}") -> الكلام الجديد: ${query}`;
        }

        let eveResponse = null;
        let successful = false;
        let attempts = 0;

        while (!successful && attempts < API_KEYS.length) {
            const attemptIndex = (currentKeyIndex + attempts) % API_KEYS.length;
            const currentKey = API_KEYS[attemptIndex];

            try {
                const genAI = new GoogleGenerativeAI(currentKey);
                const model = genAI.getGenerativeModel({
                    model: "gemini-1.5-flash",
                    systemInstruction: APLIN_SYSTEM
                });

                const chat = model.startChat({
                    history: conversationMemory[senderID],
                    generationConfig: { temperature: 0.8 }
                });

                const result = await chat.sendMessage(userMessage);
                eveResponse = result.response.text().trim();
                successful = true;
                currentKeyIndex = (attemptIndex + 1) % API_KEYS.length;

            } catch (error) {
                console.error(`Key Error: ${error.message}`);
                attempts++;
            }
        }

        if (successful && eveResponse) {
            eveResponse = eveResponse.replace(/\*/g, ''); 

            // حفظ الذاكرة
            conversationMemory[senderID].push({ role: "user", parts: [{ text: userMessage }] });
            conversationMemory[senderID].push({ role: "model", parts: [{ text: eveResponse }] });
            if (conversationMemory[senderID].length > 10) conversationMemory[senderID].shift();

            return api.sendMessage(`•-• ${eveResponse}`, threadID, messageID);
        } else {
            return api.sendMessage("•-• المفاتيح ضربت يا وهم.. قايلني شغالة بالموية؟ 😒", threadID, messageID);
        }
    }
};
