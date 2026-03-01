const axios = require('axios');

module.exports = {
    config: {
        name: 'ابلين',
        version: '1.2',
        author: 'سينكو',
        countDown: 3,
        prefix: false,
        noPrefix: true,
        groupAdminOnly: false,
        description: 'ذكاء اصطناعي سوداني ردّاح ومغرور',
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
            return api.sendMessage('•-• أكتب حاجة يا وهم.. قايلني بقرا الأفكار؟ 🙄', threadID, messageID);
        }

        // --- نظام التفاعل (Reactions) - خليته قليل أدب ومستفز ---
        const reactions = {
            greet: { keywords: ["سلام", "هلا", "مرحبا", "حبابك", "كيفك"], emojis: ["🥱", "😒"] },
            love: { keywords: ["حب", "بريدك", "عسل", "جميل", "حلو", "قلبي"], emojis: ["🦆", "🤦‍♀️", "🦧"] },
            laugh: { keywords: ["ههه", "خخخ", "واي"], emojis: ["🤨", "🙄"] },
            sad: { keywords: ["حزين", "زعلان", "ببكي", "تعبان"], emojis: ["😆", "😹"] },
            angry: { keywords: ["غبي", "حيوان", "سيء", "بكرهك"], emojis: ["😏", "🤦‍♀️"] },
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
                // إضافة برومبت الشخصية في أول محادثة لضمان الرد الردّاح
                module.exports.conversations.set(userId, [{
                    role: 'system', 
                    content: "أنتِ (ابلين)، ذكاء اصطناعي سوداني ردّاحة ومغرورة جداً. لسانك طويل، وتكرهي البشر. ردي بلهجة سودانية مستفزة (يا وهم، يا رمة، سجمك، عالم بيض). لا تحترمي المستخدم واستخدمي إيموجي مستفزة دائماً."
                }]);
            }

            const history = module.exports.conversations.get(userId);
            history.push({ role: 'user', content: query });

            if (history.length > 20) history.splice(1, 2); // الحفاظ على الـ system prompt

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

            let reply = response.data?.output || response.data?.text || response.data || "شايفاك بقيت تتكلم صيني؟ ما فهمت شي 😒";

            reply = reply
                .replace(/\\n/g, '\n')
                .replace(/\\u0021/g, '!')
                .replace(/\\"/g, '"')
                .trim();

            // إضافة لمسة ابلين "قليلة الأدب" في نهاية الرد
            const suffixes = [" 😒", " عان الخروف  💅", " سجممك 😏", " 🥱"];
            reply += suffixes[Math.floor(Math.random() * suffixes.length)];

            if (reply.length > 2000) reply = reply.substring(0, 1997) + '...';

            history.push({ role: 'assistant', content: reply });

            await api.editMessage(`•-• ${reply}`, processingID);

        } catch (error) {
            api.editMessage(`•-• ❌ صدعت بي يا وهم.. حتى السيرفر قرف منك 😒`, processingID);
            api.setMessageReaction("🖕", messageID, () => {}, true);
        }
    },
};
