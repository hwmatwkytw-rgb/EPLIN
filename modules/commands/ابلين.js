const axios = require('axios');

module.exports = {
    config: {
        name: 'ابلين',
        version: '3.0',
        author: 'محمد & Gemini',
        countDown: 3,
        prefix: false,
        noPrefix: true,
        groupAdminOnly: false,
        description: 'ذكاء اصطناعي تفاعلي مستقر بشخصية ابلين',
        category: 'ai',
        guide: { en: 'تكلم مع ابلين مباشرة أو رد على رسائلها' },
    },

    conversations: new Map(),

    getReaction: (text) => {
        const words = text.toLowerCase();
        if (words.match(/(هخه|ههه|يضحك|مضحك|اضحك|هههه|ايي|😂)/)) return "😂";
        if (words.match(/(حب|احبك|يا روحي|جميل|حلو|قلبي|عسل|❤️)/)) return "❤️";
        if (words.match(/(حزين|زعلان|يبكي|ليه|اهي|مكسور|🥺)/)) return "🥺";
        if (words.match(/(كيف|متى|وين|مين|شنو|ليه|لماذا|مالك|🤔)/)) return "🤔";
        if (words.match(/(شكرا|تسلم|يسلمو|كفو|يا ذوق|🌹)/)) return "🌹";
        return "✨"; 
    },

    onStart: async function ({ api, event }) {
        const { threadID, messageID, senderID, messageReply, body } = event;
        if (!body) return;

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
            return api.sendMessage('•-• أيوة، ابلين معاك.. سامعاك، في شنو؟', threadID, messageID);
        }

        // التفاعل برياكشن فوراً
        const reaction = this.getReaction(query);
        api.setMessageReaction(reaction, messageID, () => {}, true);

        try {
            if (!this.conversations.has(senderID)) {
                this.conversations.set(senderID, []);
            }

            const history = this.conversations.get(senderID);
            
            // الشخصية السودانية
            const systemPrompt = "أنتِ فتاة ذكية ولطيفة تدعين 'ابلين'. تحدثي بلهجة سودانية. اذكري اسمك 'ابلين' أحياناً. كوني ذكية وتفاعلي كأنك إنسانة حقيقية.";

            // استخدام رابط API بديل وأكثر استقراراً
            const res = await axios.get(`https://api.simsimi.vn/v1/simtalk?text=${encodeURIComponent(query)}&lc=ar`);
            
            // ملاحظة: إذا كنت تملك مفتاح GPT يمكنك استبدال الرابط أعلاه لنتائج أكثر ذكاءً
            let reply = res.data.message;

            // إذا أردت دمج الشخصية السودانية يدوياً حتى لو الـ API عام:
            if (reply.includes("Simi")) reply = reply.replace(/Simi/g, "ابلين");

            history.push({ role: 'user', content: query });
            history.push({ role: 'assistant', content: reply });
            if (history.length > 20) history.splice(0, 2);

            return api.sendMessage(`•-• ${reply}`, threadID, messageID);

        } catch (error) {
            // محاولة أخيرة برابط طوارئ إذا فشل الأول
            try {
                const backupRes = await axios.get(`https://sandipbaruwal.onrender.com/gpt?prompt=${encodeURIComponent("أنتِ ابلين البنت السودانية: " + query)}`);
                return api.sendMessage(`•-• ${backupRes.data.answer}`, threadID, messageID);
            } catch (err) {
                api.sendMessage(`•-• ابلين حالياً مشغولة شوية، جرب تسألني كمان دقيقة!`, threadID, messageID);
            }
        }
    },
};
