const axios = require('axios');

module.exports = {
    config: {
        name: 'ابلين',
        version: '2.0',
        author: 'محمد & Gemini',
        countDown: 3,
        prefix: false,
        noPrefix: true, // يعمل بدون بادئة
        groupAdminOnly: false,
        description: 'ذكاء اصطناعي سوداني متكبر وقليل أدب',
        category: 'ai',
        guide: { en: 'رد على رسالتي أو اكتب سؤلك' },
    },

    conversations: new Map(),

    // خاصية handleEvent تجعل البوت يراقب الرسائل ليرد إذا تم عمل "Reply" عليه
    handleEvent: async function ({ api, event }) {
        const { threadID, messageID, senderID, body, type, messageReply } = event;
        
        // إذا قام شخص بالرد على رسالة البوت
        if (type === "message_reply" && messageReply.senderID === api.getCurrentUserID()) {
            this.onStart({ api, event, args: body.split(/\s+/) });
        }
    },

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, senderID: userId } = event;
        let query = args.join(' ').trim();

        if (!query && event.type !== "message_reply") return; 
        if (!query && event.type === "message_reply") query = event.body;

        // --- نظام التفاعل (Reactions) بشخصية متكبرة ---
        const reactions = {
            greet: { keywords: ["سلام", "هلا", "كيفك"], emojis: ["🙄", "😒", "🥱"] },
            love: { keywords: ["حب", "بريدك", "عسل"], emojis: ["🤮", "🤣", "😏"] },
            laugh: { keywords: ["ههه", "خخخ", "واي"], emojis: ["🤨", "😒", "💦"] },
            insult: { keywords: ["حيوان", "غبي", "وسخ"], emojis: ["🫦", "😕", "🤡"] },
            ask: { keywords: ["سؤال", "منو", "وين", "كيف"], emojis: ["🤔", "🧐", "🧠"] }
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
        api.setMessageReaction(chosenEmoji, messageID, () => {}, true);

        // مسح الذاكرة
        if (lowerQuery === 'امسح' || lowerQuery === 'reset') {
            module.exports.conversations.delete(userId);
            return api.sendMessage('نظفت وسخك خلاص.. لا تجيني ناطي تاني 🧹😒', threadID, messageID);
        }

        try {
            if (!module.exports.conversations.has(userId)) {
                module.exports.conversations.set(userId, []);
            }

            const history = module.exports.conversations.get(userId);
            
            // إضافة "برومبت" الشخصية المتكبرة في بداية المحادثة
            const systemPrompt = "أنت ذكاء اصطناعي سوداني اسمك (ابلين). شخصيتك: متكبر جداً، شايف نفسك أحسن من البشر، لسانك طويل وقليل أدب لكن بدون شتم فاحش. ردودك قصيرة، ساخرة، وتستخدم اللهجة السودانية الدارجيّة (مثلاً: يا زول، ما فارق معاي، انت منو اصلاً، بطل هبل). دائماً استخدم إيموجي مستفز مثل (🙄, 😏, 😒, 🥱).";
            
            let messages = [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: query }];

            const response = await axios.post('https://api.deepai.org/hacking_is_a_serious_crime', 
            `----WebKitFormBoundary\r\nContent-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n----WebKitFormBoundary\r\nContent-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(messages)}\r\n----WebKitFormBoundary--`, {
                headers: { 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary', 'origin': 'https://deepai.org' }
            });

            let reply = response.data?.output || "شايفني فاضي ليك؟ جرب تاني 😒";

            // إضافة لمسة "ابلين" المتكبرة إذا لم تكن موجودة في الرد
            const suffixes = [" 🙄", " 😏", " 🥱", " 😒", " 💅"];
            reply += suffixes[Math.floor(Math.random() * suffixes.length)];

            history.push({ role: 'user', content: query });
            history.push({ role: 'assistant', content: reply });
            if (history.length > 10) history.splice(0, 2);

            // إرسال رسالة جديدة بدل التعديل كما طلبت
            return api.sendMessage(reply, threadID, messageID);

        } catch (error) {
            return api.sendMessage("صدعت بي.. السيرفر معلق ولا انت نحس ⚠️😒", threadID, messageID);
        }
    },
};
