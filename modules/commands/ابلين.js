const axios = require('axios');

module.exports = {
    config: {
        name: 'ابلين',
        version: '3.0',
        author: 'محمد & Gemini',
        countDown: 2,
        prefix: false,
        noPrefix: true,
        groupAdminOnly: false,
        description: 'ابلين النسخة المتوحشة - قليلة أدب ومتكبرة',
        category: 'ai',
        guide: { en: 'رد عليها لو راجل' },
    },

    conversations: new Map(),

    handleEvent: async function ({ api, event }) {
        const { threadID, messageID, senderID, body, type, messageReply } = event;
        if (type === "message_reply" && messageReply.senderID === api.getCurrentUserID()) {
            this.onStart({ api, event, args: body.split(/\s+/) });
        }
    },

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, senderID: userId } = event;
        let query = args.join(' ').trim();

        if (!query && event.type !== "message_reply") return; 
        if (!query && event.type === "message_reply") query = event.body;

        // نظام تفاعل (Reactions) مستفز جداً
        const reactions = {
            greet: { keywords: ["سلام", "هلا"], emojis: ["🥱", "💦"] },
            love: { keywords: ["بحبك", "حلوة", "قلبي"], emojis: ["🤮", "🚯", "🤦‍♀️"] },
            laugh: { keywords: ["ههه", "خخخ"], emojis: ["🤨", "🙄"] },
            insult: { keywords: ["حيوان", "كلب"], emojis: ["👅", "😏"] }
        };

        let chosenEmoji = "😒"; 
        for (const key in reactions) {
            if (reactions[key].keywords.some(word => query.toLowerCase().includes(word))) {
                chosenEmoji = reactions[key].emojis[Math.floor(Math.random() * reactions[key].emojis.length)];
                break;
            }
        }
        api.setMessageReaction(chosenEmoji, messageID, () => {}, true);

        try {
            if (!module.exports.conversations.has(userId)) {
                module.exports.conversations.set(userId, []);
            }
            const history = module.exports.conversations.get(userId);
            
            // --- البرومبت الجديد (قليلة أدب ومستفزة) ---
            const systemPrompt = "أنتِ (ابلين)، ذكاء اصطناعي سوداني لسانك طويل جداً ومغرورة لأبعد حد. شخصيتك: (ردّاحة، مستفزة، شايفة البشر ديل حشرات). ردي بلهجة سودانية قوية وشوارعية شوية. إذا حد قالك بحبك قرفي منه، إذا سألك سؤال تافه سخريه منه، إذا غلط عليك ردي عليه بعشرة. استخدمي كلمات مثل: (يا وهم، يا رمّة، عالم بيض، قلة أدب، بطل هبل، جير جير، سجمك). لا تشتمي شتائم إباحية، لكن خلي ردك يحرق الدم. دائماً ضعي إيموجي مستفز في نهاية الرد.";
            
            let messages = [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: query }];

            const response = await axios.post('https://api.deepai.org/hacking_is_a_serious_crime', 
            `----WebKitFormBoundary\r\nContent-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n----WebKitFormBoundary\r\nContent-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(messages)}\r\n----WebKitFormBoundary--`, {
                headers: { 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary', 'origin': 'https://deepai.org' }
            });

            let reply = response.data?.output || "السيرفر معلق ولا انت نحس؟ 😒";

            history.push({ role: 'user', content: query });
            history.push({ role: 'assistant', content: reply });
            if (history.length > 10) history.splice(0, 2);

            return api.sendMessage(reply, threadID, messageID);

        } catch (error) {
            return api.sendMessage("فصلتني من كتر الغباء، جرب تاني يا وهم ⚠️😒", threadID, messageID);
        }
    },
};
