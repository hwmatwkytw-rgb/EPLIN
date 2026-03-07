const axios = require('axios');

module.exports = {
    config: {
        name: 'كيلسي',
        version: '2.0',
        author: 'محمد & جيميناي',
        countDown: 3,
        prefix: false,
        noPrefix: true,
        groupAdminOnly: false,
        description: 'شخصية كيلسي من كرتون كريك في الخور - محاربة ودرامية',
        category: 'ai',
        guide: {
            en: '{pn} <سؤالك>'
        },
    },

    conversations: new Map(),

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, senderID: userId, type, messageReply } = event;
        
        // جلب اسم المستخدم
        const info = await api.getUserInfo(userId);
        const userName = info[userId].name;

        let query = args.join(' ').trim();

        // دعم الرد (Reply): لو المستخدم رد على رسالة البوت، ياخد النص
        if (type === "message_reply") {
            query = event.body;
        }

        if (!query && type !== "message_reply") {
            return api.sendMessage(`•-• يا ${userName}، أيها المغامر الشجاع.. هل جئت لتصمت أم لنتحدث عن أمجاد الخور؟ 🗡️🐦`, threadID, messageID);
        }

        // نظام التفاعلات بأسلوب كيلسي (فارسة ودرامية)
        const reactions = {
            battle: { keywords: ["حرب", "سيف", "قتال", "مغامرة", "عدو"], emojis: ["🗡️", "🛡️"] },
            mortimer: { keywords: ["عصفور", "مورتيمر", "طير"], emojis: ["🐦", "👑"] },
            friends: { keywords: ["كريك", "جي بي", "أصحاب"], emojis: ["🏹", "🤝"] },
            wonder: { keywords: ["كيف", "متين", "وين"], emojis: ["📜", "🧐"] }
        };

        let chosenEmoji = "⚔️"; 
        const lowerQuery = query.toLowerCase();

        for (const key in reactions) {
            if (reactions[key].keywords.some(word => lowerQuery.includes(word))) {
                const emojiList = reactions[key].emojis;
                chosenEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
                break;
            }
        }

        api.setMessageReaction(chosenEmoji, messageID, (err) => {}, true);

        if (lowerQuery === 'مسح' || lowerQuery === 'reset') {
            module.exports.conversations.delete(userId);
            return api.sendMessage(`•-• لقد مسحنا سجلات المعركة يا ${userName}.. لنبدأ فصلاً جديداً من روايتنا! 📖✨`, threadID, messageID);
        }

        const infoMsg = await api.sendMessage('•-• لحظة.. مورتيمر يهمس لي بالكلمات... 🐦📜', threadID, messageID);
        const processingID = infoMsg.messageID;

        try {
            if (!module.exports.conversations.has(userId)) {
                module.exports.conversations.set(userId, [{
                    role: 'system', 
                    content: `أنتِ الآن (كيلسي) من كرتون "كريك في الخور". تتحدثين بلهجة سودانية ممزوجة بلغة درامية ملحمية (كأنكِ بطلة في رواية خيالية). تنادين المستخدم بـ "أيها المغامر" أو "يا ${userName}". تحبين سيفك الخشبي وعصفورك مورتيمر. كلامك فيه فخر وشجاعة وأحياناً مبالغة درامية. لا تستخدمي لغة بذيئة، بل كوني طفلة محاربة ومغرورة بشجاعتها.`
                }]);
            }

            const history = module.exports.conversations.get(userId);
            history.push({ role: 'user', content: query });

            if (history.length > 15) history.splice(1, 2); 

            const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
            let formData = "";
            formData += `--${boundary}\r\n`;
            formData += `Content-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n`;
            formData += `--${boundary}\r\n`;
            formData += `Content-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n`;
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

            let reply = response.data?.output || response.data?.text || "السحر الأسود عطل كلماتي! (خطأ في السيرفر) 🛡️";

            reply = reply.trim();

            // إضافات ختامية بأسلوب كيلسي
            const suffixes = [
                `\n\n- كتبته المحاربة كيلسي لـ ${userName} 🗡️`,
                `\n\n- مورتيمر يوافق على هذا الكلام! 🐦👑`,
                `\n\n- إلى الخووووور! 🚩`,
                `\n\n- لن تكسروا سيفي الخشبي أبداً! ✨`
            ];
            reply += suffixes[Math.floor(Math.random() * suffixes.length)];

            history.push({ role: 'assistant', content: reply });

            await api.editMessage(`•-• ${reply}`, processingID);

        } catch (error) {
            api.editMessage(`•-• وا أسفاه يا ${userName}! القوى الظلامية (عطل تقني) منعتني من الرد! 🐉`, processingID);
        }
    },
};
