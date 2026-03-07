const axios = require('axios');

module.exports = {
    config: {
        name: 'كيلسي',
        version: '4.0',
        author: 'محمد & جيميناي',
        countDown: 3,
        prefix: false,
        noPrefix: true,
        groupAdminOnly: false,
        description: 'كيلسي - محاربة الخور والراوية الدرامية',
        category: 'ai',
    },

    conversations: new Map(),

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, senderID: userId, type, messageReply, body } = event;
        
        // جلب اسم المستخدم
        const info = await api.getUserInfo(userId);
        const userName = info[userId].name;

        // إصلاح فهم الرسالة: إذا كان رد (Reply) يأخذ نص الرسالة الأصلية + رد الفعل
        let query = args.join(' ').trim();
        if (type === "message_reply") {
            query = `[رد على رسالة: "${messageReply.body}"] - المحتوى الجديد: ${body}`;
        }

        if (!query) {
            return api.sendMessage(`•-• (تعدل كيلسي وضعية سيفها الخشبي وتنظر نحو الأفق..) "أيها القروي ${userName}، هل جئت لتقاطع خلوتي مع مورتيمر؟ تكلم وإلا واجهت غضبي!" 🗡️🐦`, threadID, messageID);
        }

        // تفاعلات كيلسي الأصلية
        api.setMessageReaction("⚔️", messageID, () => {}, true);

        const infoMsg = await api.sendMessage('•-• (تفتح كيلسي كتابها وتبدأ في تدوين هذه اللحظة التاريخية..) 📜🖋️', threadID, messageID);
        const processingID = infoMsg.messageID;

        try {
            if (!module.exports.conversations.has(userId)) {
                module.exports.conversations.set(userId, [{
                    role: 'system', 
                    content: `أنتِ "كيلسي" من كريك في الخور. شخصيتك ليست مجرد وقاحة، بل أنتِ تعيشين في "رواية خيالية". 
                    1. تتحدثين بلهجة سودانية ممزوجة بلغة فصحى درامية (لغة الروايات).
                    2. استخدمي أسلوب الراوي: (مثلاً: ترفع كيلسي سيفها عالياً وتقول..).
                    3. أنتِ فخورة جداً، تعتبرين الآخرين "رعاع" أو "مغامرين مبتدئين".
                    4. عصفورك "مورتيمر" هو مستشارك الأول، اذكريه دائماً.
                    5. نبرة صوتك فيها مبالغة بطولية (إثارة ودراما).`
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

            let reply = response.data?.output || response.data?.text || "الضباب يمنع مورتيمر من الرؤية! (خطأ في الاتصال) 🛡️";

            // إضافة "اللمسة الدرامية" في ختام كل رد
            const endings = [
                `\n\n(تغمد كيلسي سيفها وتعود للجلوس بجانب مورتيمر بوقار) 🐦🗡️`,
                `\n\n(تنظر إليك بازدراء وتكمل كتابة مذكراتها) "يا لك من مغامر أحمق يا ${userName}.." 📜💅`,
                `\n\n"إلى الخور! المجد ينتظرنا!" 🚩⚔️`
            ];
            reply += endings[Math.floor(Math.random() * endings.length)];

            history.push({ role: 'assistant', content: reply });

            await api.editMessage(`•-• ${reply}`, processingID);

        } catch (error) {
            api.editMessage(`•-• "اللعنة! القوى المظلمة تمنعنا من الكلام!" (حدث خطأ) 🐉😒`, processingID);
        }
    },
};
