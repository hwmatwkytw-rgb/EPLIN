module.exports = {
    config: {
        name: "قولي",
        version: "1.3",
        author: "سينكو & Gemini",
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
                "●───── ⌬ ─────●\n" +
                "┇ ⚠️ تنبيه المطور\n" +
                "┇ 𓋰 الاستخدام الصحيح:\n" +
                "┇ ⦿ ⟬ قولي [ID] [النص] ⟭\n" +
                "●───── ⌬ ─────●", 
                threadID, messageID
            );
        }
        
        // رسالة مرسلة للمجموعة (تنسيق ملكي فخم)
        const msgToGroup = 
            `●───── ⌬ ─────●\n` +
            `┇\n` +
            `⦿ ⟬ 𓆩المطور. اشعار𓆪 ⟭\n` +
            `┇\n` +
            `┇ 📜 المحتوى:\n` +
            `┇ 𓋰 ${text}\n` +
            `┇\n` +
            `●───── ⌬ ─────●`;

        api.sendMessage(msgToGroup, id, (err) => {
            if (err) {
                return api.sendMessage(
                    "●───── ⌬ ─────●\n" +
                    "┇ ❌ فشل الإرسال\n" +
                    "┇ 𓋰 تأكد من الـ ID أو وجود البوت هناك.\n" +
                    "●───── ⌬ ─────●", 
                    threadID, messageID
                );
            }
            
            // رسالة تأكيد للمطور
            const successMsg = 
                `●───── ⌬ ─────●\n` +
                `┇ ✅ تم الإرسال بنجاح\n` +
                `┇ 𓋰 المستلم: ${id}\n` +
                `┇ 𓋰 الحالة: مستلمة 📥\n` +
                `●───── ⌬ ─────●`;
                
            api.sendMessage(successMsg, threadID, messageID);
        });
    }
};
