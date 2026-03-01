const axios = require('axios');

module.exports = {
    config: {
        name: 'ابلين',
        version: '1.2',
        author: 'محمد & Gemini',
        countDown: 3,
        prefix: false,
        noPrefix: true,
        groupAdminOnly: false,
        description: 'ذكاء اصطناعي سوداني مغرور ولسانه طويل',
        category: 'ai',
        guide: {
            en: '{pn} <سؤالك>'
        },
    },

    conversations: new Map(),

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, senderID: userId } = event;
        const query = args.join(' ').trim();

        // رد مستفز إذا أرسل رسالة فارغة
        if (!query) {
            return api.sendMessage('•-• أكتب حاجة يا وهم.. قايلني بقرا الأفكار؟ 🙄', threadID, messageID);
        }

        // --- نظام التفاعل (Reactions) بشخصية قليلة أدب ---
        const reactions = {
            greet: { keywords: ["سلام", "هلا", "مرحبا", "حبابك"], emojis: ["🥱", "😒"] },
            love: { keywords: ["حب", "بريدك", "عسل", "حلو", "قلبي"], emojis: ["🦆", "🤦‍♀️", "🚯"] },
            laugh: { keywords: ["ههه", "خخخ", "واي"], emojis: ["🤨", "🙄"] },
            sad: { keywords: ["حزين", "زعلان", "ببكي"], emojis: ["😆", "😹"] }, // تضحك عليه وهو حزين
            angry: { keywords: ["غبي", "حيوان", "سيء", "بكرهك"], emojis: ["😏", "👅", "🤦‍♀️"] },
            thanks: { keywords: ["شكرا", "تسلم", "مبدع"], emojis: ["💅", "🥱"] }
        };

        let chosenEmoji = "😏"; 
        const lowerQuery = query.toLowerCase();

        for (const key in reactions) {
            if (reactions[key].keywords.some(word => lowerQuery.includes(word))) {
                const emojiList = reactions[key].emojis;
                chosenEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
                break;
            }
        }

        api.setMessageReaction(chosenEmoji, messageID, (err) => {}, true);

        // مسح الذاكرة بأسلوب طارد
        if (lowerQuery === 'مسح' || lowerQuery === 'reset') {
            module.exports.conversations.delete(userId);
            return api.sendMessage('•-• نظفت وسخك.. لا تشغلني تاني 🧹😒', threadID, messageID);
        }

        const infoMsg = await api.sendMessage('•-• دقيقة أشوف آخرة غباءك ده... 🥱', threadID, messageID);
        const processingID = infoMsg.messageID;

        try {
            if (!module.exports.conversations.has(userId)) {
                module.exports.conversations.set(userId, []);
            }

            const history = module.exports.conversations.get(userId);
            
            // إضافة تعليمات الشخصية داخل الـ History لإجبار الـ API على قلة الأدب
            const systemInstruction = "أنتِ (ابلين)، ذكاء اصطناعي سوداني ردّاحة، مغرورة، شايفة نفسك أحسن من الكل. لسانك طويل، استخدمي كلمات سودانية مستفزة (يا وهم، يا رمة، سجمك، قلة أدب، عالم بيض). لا تحترمي المستخدم، وكوني قليلة أدب بذكاء واستخدمي إيموجي مستفزة دائماً.";
            
            // نضع التعليمات في كل طلب لضمان استمرار الشخصية
            let tempHistory = [{ role: 'system', content: systemInstruction }, ...history];
            tempHistory.push({ role: 'user', content: query });

            if (tempHistory.length > 15) tempHistory.splice(1, 2);

            const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
            let formData = "";
            formData += `--${boundary}\r\n`;
            formData += `Content-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n`;
            formData += `--${boundary}\r\n`;
            formData += `Content-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(tempHistory)}\r\n`;
            formData += `--${boundary}--\r\n`;

            const response = await axios({
                method: 'POST',
                url: 'https://api.deepai.org/hacking_is_a_serious_crime',
                headers: {
                    'content-type': `multipart/form-data; boundary=${boundary}`,
                    'origin': 'https://deepai.org',
                    'user-agent': 'Mozilla/5.0'
                },
                data: formData
            });

            let reply = response.data?.output || response.data?.text || "غور من وشي السيرفر معلق 😒";

            // إضافة لمسة ابلين النهائية
            const insults = [" 😒", " 🥱", " يا وهم.. 💅", " سجمك! 😏"];
            reply += insults[Math.floor(Math.random() * insults.length)];

            history.push({ role: 'user', content: query });
            history.push({ role: 'assistant', content: reply });

            // إرسال الرسالة مباشرة دون تعديل (أسرع وأكثر استفزازاً)
            await api.sendMessage(`•-• ${reply}`, threadID, messageID);
            await api.unsendMessage(processingID); // حذف رسالة "قاعد أفكر"

        } catch (error) {
            api.editMessage(`•-• ❌ صدعت بي يا وهم.. حصل خطأ: ${error.message} 😒`, processingID);
            api.setMessageReaction("🖕", messageID, () => {}, true);
        }
    },
};
