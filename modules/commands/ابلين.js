const axios = require('axios');

module.exports = {
    config: {
        name: 'ابلين',
        version: '1.5',
        author: 'محمد & Gemini',
        countDown: 3,
        prefix: false,
        noPrefix: true,
        groupAdminOnly: false,
        description: 'ذكاء اصطناعي سوداني ردّاح ومستقر',
        category: 'ai',
        guide: { en: '{pn} <سؤالك>' },
    },

    conversations: new Map(),

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, senderID: userId } = event;
        const query = args.join(' ').trim();

        if (!query) return api.sendMessage('•-• أكتب حاجة يا وهم.. قايلني بقرا الأفكار؟ 🙄', threadID, messageID);

        // نظام التفاعل المستفز
        const reactions = {
            greet: { keywords: ["سلام", "هلا"], emojis: ["🥱", "😒"] },
            love: { keywords: ["حب", "بريدك", "قلبي"], emojis: ["🤮", "🖕"] },
            laugh: { keywords: ["ههه", "خخخ"], emojis: ["🤨", "🙄"] }
        };

        let chosenEmoji = "😏";
        for (const key in reactions) {
            if (reactions[key].keywords.some(word => query.toLowerCase().includes(word))) {
                chosenEmoji = reactions[key].emojis[Math.floor(Math.random() * reactions[key].emojis.length)];
                break;
            }
        }
        api.setMessageReaction(chosenEmoji, messageID, (err) => {}, true);

        const infoMsg = await api.sendMessage('•-• دقيقة أشوف آخرة غباءك ده... 🥱', threadID, messageID);

        try {
            if (!module.exports.conversations.has(userId)) {
                module.exports.conversations.set(userId, []);
            }
            const history = module.exports.conversations.get(userId);

            // المصدر الجديد (API مجاني وسريع)
            const response = await axios.get(`https://api.simsimi.vn/v2/simsimi?text=${encodeURIComponent(query)}&lc=ar`);
            
            // تخصيص الرد ليكون سوداني وقليل أدب يدوياً لأن المصدر عام
            let botReply = response.data.result;
            
            // قائمة شتائم وسخرية سودانية تضاف للرد
            const insults = [
                "، يا وهم! 😒",
                ".. سجمك السجمك! 🥱",
                ".. انت قايل نفسك منو؟ 😏",
                ".. عالم بيض وقليلة أدب! 💦",
                ".. بطل جير جير معاك 🙄"
            ];
            
            let finalReply = botReply + insults[Math.floor(Math.random() * insults.length)];

            // حفظ في الذاكرة
            history.push({ role: 'user', content: query });
            history.push({ role: 'assistant', content: finalReply });

            await api.sendMessage(`•-• ${finalReply}`, threadID, messageID);
            await api.unsendMessage(infoMsg.messageID);

        } catch (error) {
            await api.editMessage(`•-• ❌ حتى السيرفر قرف منك وقفل.. جرب تاني يا نحس 😒`, infoMsg.messageID);
        }
    },
};
