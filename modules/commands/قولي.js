module.exports = {
    config: {
        name: "قولي",
        version: "1.0",
        author: "Kenji Agent",
        countDown: 5,
        role: 2,
        prefix: true,
        description: "إرسال رسالة إلى مجموعة معينة عن طريق الـ ID",
        category: "المطور",
        guide: { ar: "{pn} [ID المجموعة] [الرسالة]" }
    },
    onStart: async function ({ api, event, args }) {
        const id = args[0];
        const text = args.slice(1).join(" ");
        if (!id || !text) return api.sendMessage("⚠️ استخدم: تكلم [ID] [الرسالة]", event.threadID);
        
        api.sendMessage(`📣 رسالة من المطور:\n\n${text}`, id, (err) => {
            if (err) return api.sendMessage("❌ فشل إرسال الرسالة، تأكد من الـ ID.", event.threadID);
            api.sendMessage("✅ تم إرسال الرسالة بنجاح.", event.threadID);
        });
    }
};
