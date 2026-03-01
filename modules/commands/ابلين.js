const axios = require('axios');

module.exports = {
    config: {
        name: 'ابلين',
        version: '2.0',
        author: 'محمد',
        countDown: 3,
        prefix: false,
        noPrefix: true,
        groupAdminOnly: false,
        description: 'ذكاء اصطناعي سوداني ردّاح يدعم الريبلاي',
        category: 'ai',
        guide: { en: '{pn} <سؤالك> أو رد على رسالة البوت' },
    },

    conversations: new Map(),

    // --- إضافة ميزة الرد على الريبلاي (Reply) ---
    handleEvent: async function ({ api, event }) {
        const { threadID, messageID, body, type, messageReply } = event;
        // إذا النوع ريبلاي وكان الريبلاي على رسالة البوت نفسه
        if (type === "message_reply" && messageReply.senderID === api.getCurrentUserID()) {
            // استدعاء البوت للرد فوراً
            this.onStart({ api, event, args: body ? body.split(/\s+/) : [] });
        }
    },

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, senderID: userId } = event;
        let query = args.join(' ').trim();

        // لو مافي سؤال ومافي ريبلاي
        if (!query && event.type !== "message_reply") {
            return api.sendMessage('•-• أكتب حاجة يا وهم.. قايلني بقرا الأفكار؟ 🙄', threadID, messageID);
        }
        
        // لو ريبلاي والسؤال فاضي (مثلاً شخص عمل ريبلاي بإيموجي)
        if (!query && event.type === "message_reply") query = event.body;

        api.setMessageReaction("🙄", messageID, (err) => {}, true);

        try {
            if (!module.exports.conversations.has(userId)) {
                module.exports.conversations.set(userId, []);
            }
            const history = module.exports.conversations.get(userId);

            // --- إجبار الـ API على اللهجة السودانية والشخصية ---
            const systemPrompt = "أنتِ (ابلين)، ذكاء اصطناعي سوداني ردّاحة ومغرورة. لسانك طويل جداً. ردي حصراً باللهجة السودانية الدارجة والقوية (مثل: يا وهم، يا رمة، سجمك، عالم بيض، بطل جير جير). لا تتكلمي مصري ولا لغة عربية فصحى. كوني قليلة أدب ومستفزة واستخدمي إيموجي (😒, 🥱, 🤮, 😏).";
            
            const messages = [
                { role: "system", content: systemPrompt },
                ...history.slice(-5), 
                { role: "user", content: query }
            ];

            const response = await axios.post('https://api.deepai.org/hacking_is_a_serious_crime', 
            `----WebKitFormBoundary\r\nContent-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n----WebKitFormBoundary\r\nContent-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(messages)}\r\n----WebKitFormBoundary--`, {
                headers: { 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary', 'origin': 'https://deepai.org' }
            });

            let reply = response.data?.output || response.data?.text || "غور يا وهم السيرفر معلق 😒";

            // إضافة لمسة ابلين النهائية لضمان السودنة حتى لو الـ API خرف
            const sudaneseSuffixes = [".. يا وهم 😒", ".. سجمك! 🥱", ".. عالم بيض 😏", ".. بطل عبط 💅"];
            if (!reply.includes("يا") && !reply.includes("ما")) { // تأكيد اللهجة
                reply += sudaneseSuffixes[Math.floor(Math.random() * sudaneseSuffixes.length)];
            }

            history.push({ role: 'user', content: query });
            history.push({ role: 'assistant', content: reply });

            return api.sendMessage(reply, threadID, messageID);

        } catch (error) {
            return api.sendMessage("حتى السيرفر قرف منك وقفل.. جرب تاني يا نحس 😒💦", threadID, messageID);
        }
    },
};
