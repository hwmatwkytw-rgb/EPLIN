module.exports = {
    config: {
        name: "قولي",
        version: "1.2",
        author: "سينكو ",
        countDown: 5,
        role: 2,
        prefix: true,
        description: "إرسال رسالة ملكية إلى مجموعة معينة عن طريق الـ ID",
        category: "المطور",
        guide: { ar: "{pn} [ID المجموعة] [الرسالة]" }
    },
    onStart: async function ({ api, event, args }) {
        const { threadID, messageID } = event;
        const id = args[0];
        const text = args.slice(1).join(" ");

        if (!id || !text) {
            return api.sendMessage(
                "ꕥ ┋ ⚠️ الـاستخدام الـصحيح:\n" +
                "〖 قولي [ID الـمجموعة] [الـرسالة] 〗", 
                threadID, messageID
            );
        }
        
        // رسالة مرسلة للمجموعة (خالية تماماً من النجمات)
        const msgToGroup = 
            `╭━━━━〔 𓆩 عمكم 𓆪 〕━━╮\n` +
            `┃\n` +
            `┃ 𓆩 ꕥ 𓆪 بـلاغ مـن الـمـطور\n` +
            `┃\n` +
            `┃ 〖 ${text} 〗\n` +
            `┃\n` +
            `╰━━━━━━━━━━━━━━━━━━╯`;

            api.sendMessage(msgToGroup, id, (err) => {
            if (err) {
                return api.sendMessage(
                    "ꕥ ┋ ❌ فـشل إرسال الـرسالة.\n" +
                    "تـأكد من الـ ID أو وجود الـبوت فـي الـمجموعة.", 
                    threadID, messageID
                );
            }
            
            // رسالة تأكيد للمطور (خالية تماماً من النجمات)
            const successMsg = 
                `╭── 𓆩 ✅ تـم الـإرسـال 𓆪 ─╮\n` +
                `┃ ꕥ الـمستلم: ${id}\n` +
                `┃ ꕥ الـحالة: نـجاح الـتوصيل\n` +
                `╰──────────────────╯`;
                
            api.sendMessage(successMsg, threadID, messageID);
        });
    }
};
