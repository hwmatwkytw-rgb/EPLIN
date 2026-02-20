const axios = require('axios');

module.exports = {
    config: {
        name: 'ابلين',
        version: '1.2',
        author: 'محمد',
        countDown: 3,
        prefix: false,
        noPrefix: true,
        groupAdminOnly: false,
        description: 'ذكاء اصطناعي سوداني بتفاعلات متقدمة',
        category: 'ai',
        guide: {
            en: '{pn} <سؤالك>'
        },
    },

    conversations: new Map(),

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, senderID: userId } = event;
        const query = args.join(' ').trim();

        if (!query) {
            return api.sendMessage('•-• وات.. اكتب حاجة عشان أرد عليك! ', threadID, messageID);
        }

        // --- نظام التفاعل الذكي والموسع ---
        const reactions = {
            greet: { keywords: ["سلام", "هلا", "مرحبا", "حبابك", "كيفك", "منور", "يا زول"], emojis: ["👋", "✨", "🔥", "🤝"] },
            love: { keywords: ["حب", "بريدك", "عسل", "جميل", "حلو", "قلبي", "راقي"], emojis: ["❤️", "💖", "😻", "🥰"] },
            laugh: { keywords: ["ههه", "خخخ", "موتني", "بيضحك", "نكته", "واي"], emojis: ["😂", "🤣", "😆", "💀"] },
            sad: { keywords: ["حزين", "زعلان", "ببكي", "تعبان", "وجع", "قهر"], emojis: ["💔", "😢", "😔", "🥺"] },
            angry: { keywords: ["غبي", "حيوان", "سيء", "كرهت", "بكرهك"], emojis: ["😠", "🙄", "💢", "😒"] },
            thanks: { keywords: ["شكرا", "تسلم", "يا ملك", "مبدع", "شكراً", "قصرت"], emojis: ["💕", "😺", "💙", "🦋"] },
            smart: { keywords: ["احشك", "متى", "اين", "لماذا", "من هو", "سؤال"], emojis: ["🤔", "💡", "🧠", "🧐"] }
        };

        let chosenEmoji = "🔍"; // الافتراضي
        const lowerQuery = query.toLowerCase();

        // اختيار إيموجي عشوائي من التصنيف المناسب
        for (const key in reactions) {
            if (reactions[key].keywords.some(word => lowerQuery.includes(word))) {
                const emojiList = reactions[key].emojis;
                chosenEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
                break;
            }
        }

        // التفاعل على رسالة المستخدم مباشرة
        api.setMessageReaction(chosenEmoji, messageID, (err) => {}, true);
        // ---------------------------------

        if (lowerQuery === 'مسح' || lowerQuery === 'reset') {
            module.exports.conversations.delete(userId);
            return api.sendMessage('•-• تم مسح الذاكرة بنجاح 🧹', threadID, messageID);
        }

        const infoMsg = await api.sendMessage('•-• قاعد أفكر...', threadID, messageID);
        const processingID = infoMsg.messageID;

        try {
            if (!module.exports.conversations.has(userId)) {
                module.exports.conversations.set(userId, []);
            }

            const history = module.exports.conversations.get(userId);
            history.push({ role: 'user', content: query });

            if (history.length > 20) history.splice(0, history.length - 20);

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

            let reply = response.data?.output || response.data?.text || response.data || "";

            reply = reply
                .replace(/\\n/g, '\n')
                .replace(/\\u0021/g, '!')
                .replace(/\\"/g, '"')
                .trim();

            if (reply.length > 2000) reply = reply.substring(0, 1997) + '...';

            history.push({ role: 'assistant', content: reply });

            await api.editMessage(`•-• ${reply}`, processingID);

        } catch (error) {
            api.editMessage(`•-• ❌ معليش حصل خطأ: ${error.message}`, processingID);
            api.setMessageReaction("⚠️", messageID, () => {}, true);
        }
    },
};
