const axios = require('axios');

module.exports = {
    config: {
        name: 'ابلين',
        version: '2.6',
        author: 'محمد & Gemini',
        countDown: 3,
        prefix: false,
        noPrefix: true,
        groupAdminOnly: false,
        description: 'ذكاء اصطناعي يتفاعل برياكشن ويرسل الرد مباشرة',
        category: 'ai',
        guide: { en: 'تكلم مع ابلين مباشرة أو رد على رسائلها' },
    },

    conversations: new Map(),

    // وظيفة لتحديد نوع التفاعل (Reaction)
    getReaction: (text) => {
        const words = text.toLowerCase();
        if (words.match(/(هخه|ههه|يضحك|مضحك|اضحك|هههه|ايي|😂)/)) return "😂";
        if (words.match(/(حب|احبك|يا روحي|جميل|حلو|قلبي|عسل|❤️)/)) return "❤️";
        if (words.match(/(حزين|زعلان|يبكي|ليه|اهي|مكسور|🥺)/)) return "🥺";
        if (words.match(/(كيف|متى|وين|مين|شنو|ليه|لماذا|مالك|🤔)/)) return "🤔";
        if (words.match(/(شكرا|تسلم|يسلمو|كفو|يا ذوق|🌹)/)) return "🌹";
        if (words.match(/(غبي|سيء|اكرهك|بايخ|حيوان|😒)/)) return "😒";
        return "✨"; 
    },

    onStart: async function ({ api, event }) {
        const { threadID, messageID, senderID, messageReply, body } = event;
        if (!body) return;

        // 1. نظام كشف المناداة أو الرد (Reply)
        const isReplyToBot = messageReply && messageReply.senderID === api.getCurrentUserID();
        const isCallingName = body.toLowerCase().startsWith("ابلين");
        
        let query = "";
        if (isCallingName) {
            query = body.slice(5).trim(); 
        } else if (isReplyToBot) {
            query = body.trim(); 
        } else {
            return; 
        }

        if (!query && isCallingName) {
            api.setMessageReaction("💖", messageID, () => {}, true);
            return api.sendMessage('•-• أيوة، ابلين معاك.. قولي في شنو؟', threadID, messageID);
        }

        // 2. التفاعل برياكشن (Reaction) على رسالة المستخدم مباشرة
        const reaction = this.getReaction(query);
        api.setMessageReaction(reaction, messageID, (err) => {
             if (err) console.error("فشل وضع التفاعل");
        }, true);

        try {
            if (!this.conversations.has(senderID)) {
                this.conversations.set(senderID, []);
            }

            const history = this.conversations.get(senderID);
            
            // توجيهات شخصية ابلين
            const systemPrompt = "أنتِ فتاة ذكية ولطيفة تدعين 'ابلين'. تحدثي بلهجة سودانية واضحة ومحببة. اذكري اسمك 'ابلين' في ردودك أحياناً. كوني ذكية وتفاعلي مع كلام المستخدم كأنك إنسانة حقيقية.";
            
            const messages = [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: query }
            ];

            // 3. طلب الرد من الذكاء الاصطناعي
            const response = await axios.post('https://api.deepai.org/hacking_is_a_serious_crime', 
                `chat_style=chat&chatHistory=${encodeURIComponent(JSON.stringify(messages))}`, {
                headers: { 
                    'content-type': 'application/x-www-form-urlencoded', 
                    'user-agent': 'Mozilla/5.0',
                    'origin': 'https://deepai.org'
                }
            });

            let reply = response.data.output || response.data.text || "ابلين ما عرفت ترد، حاول تاني؟";
            
            // تحديث الذاكرة
            history.push({ role: 'user', content: query });
            history.push({ role: 'assistant', content: reply });
            if (history.length > 20) history.splice(0, 2);

            // 4. إرسال الرد النهائي مباشرة
            return api.sendMessage(`•-• ${reply}`, threadID, messageID);

        } catch (error) {
            console.error(error);
            api.sendMessage(`•-• حصلت مشكلة تقنية مع ابلين.. حاول لاحقاً.`, threadID, messageID);
        }
    },
};
