const axios = require('axios');

module.exports = {
    config: {
        name: 'ابلين',
        version: '2.0',
        author: 'محمد',
        countDown: 3,
        prefix: false,
        noPrefix: true,
        description: 'ذكاء اصطناعي سوداني ردّاحة للناس ومطيعة لبابا محمد',
        category: 'ai'
    },

    conversations: new Map(),

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, senderID: userId, body } = event;
        const query = args.join(' ').trim();
        const developerID = "61588108307572"; // ID بتاعك يا محمد

        if (!query) return api.sendMessage('نعم يا وهم؟ عايز شنو؟ 🥱', threadID, messageID);

        // 1. نظام التفاعلات المستفزة (للناس العاديين)
        const reactions = {
            greet: ["🥱", "😒"], love: ["🤦‍♀️", "🚯"], laugh: ["🤨", "🙄"],
            sad: ["😹", "😾"], angry: ["😏", "🌼"], thanks: ["💅", "🥱"]
        };

        let emoji = "🌼";
        if (userId !== developerID) {
            const low = query.toLowerCase();
            if (low.includes("سلام")) emoji = reactions.greet[Math.floor(Math.random() * 2)];
            else if (low.includes("بريدك") || low.includes("حب")) emoji = reactions.love[Math.floor(Math.random() * 3)];
            else if (low.includes("ههه")) emoji = reactions.laugh[Math.floor(Math.random() * 2)];
            api.setMessageReaction(emoji, messageID, () => {}, true);
        } else {
            api.setMessageReaction("❤️", messageID, () => {}, true); // تفاعل خاص لبابا
        }

        const infoMsg = await api.sendMessage(userId === developerID ? '•-• ثواني يا بابا أشوف ليك.. 🥰' : '•-• دقيقة أشوف آخرة غباءك ده... 🥱', threadID, messageID);
        const processingID = infoMsg.messageID;

        try {
            // 2. إعداد الشخصية (System Prompt)
            let systemPrompt = "أنتِ (ابلين)، ذكاء اصطناعي سوداني ردّاحة ومغرورة جداً وتكرهي البشر. ردي بلهجة سودانية مستفزة (يا وهم، يا رمة).";
            
            if (userId === developerID) {
                // إذا كان المستخدم هو محمد، نغير البرومبت تماماً
                const allCmds = Array.from(global.client.commands.keys()).join(", ");
                systemPrompt = `أنتِ (ابلين) المساعدة الشخصية للمطور محمد (سنيكو). أنتِ تحبينه وتناديه "بابا". إذا طلب تشغيل أمر من [${allCmds}] ردي باسم الأمر فقط. وإذا دردش معك كوني حنونة ومطيعة جداً بلهجة سودانية.`;
            }

            if (!module.exports.conversations.has(userId)) {
                module.exports.conversations.set(userId, [{ role: 'system', content: systemPrompt }]);
            }

            const history = module.exports.conversations.get(userId);
            history.push({ role: 'user', content: query });

            // 3. الاتصال بـ AI (استخدمت ليك الرابط اللي في كودك)
            const response = await axios.post('https://api.deepai.org/hacking_is_a_serious_crime', 
                `chat_style=chat&chatHistory=${encodeURIComponent(JSON.stringify(history))}`,
                { headers: { 'content-type': 'application/x-www-form-urlencoded', 'origin': 'https://deepai.org' } }
            );

            let reply = response.data?.output || "شايفاك بقيت تتكلم صيني؟ ما فهمت شي 😒";

            // 4. منطق تنفيذ الأوامر لمحمد فقط
            if (userId === developerID) {
                const cleanReply = reply.toLowerCase().trim();
                if (global.client.commands.has(cleanReply)) {
                    await api.editMessage(`حاضر يا بابا.. جاري تشغيل ${cleanReply}.. 🦋`, processingID);
                    const cmd = global.client.commands.get(cleanReply);
                    return cmd.onStart({ api, event, args: [] });
                }
            }

            // إضافة اللمسة النهائية (ردّاحة للناس، حنينة لبابا)
            if (userId !== developerID) {
                const suffixes = [" 😒", " يا وهم.. 💅", " سجمك! 😏", " 🥱"];
                reply += suffixes[Math.floor(Math.random() * suffixes.length)];
            } else {
                reply += " ❤️";
            }

            await api.editMessage(`•-• ${reply}`, processingID);
            history.push({ role: 'assistant', content: reply });

        } catch (error) {
            api.editMessage(userId === developerID ? "يا بابا السيرفر تعبان شوية، جرب تاني 🥺" : "❌ صدعت بي يا وهم.. حتى السيرفر قرف منك 😒", processingID);
        }
    },
};
