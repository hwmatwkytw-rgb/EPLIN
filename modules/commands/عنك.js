module.exports = {
    config: {
        name: "عنك",
        version: "1.0",
        author: "Kenji Agent",
        countDown: 5,
        role: 2,
        prefix: true,
        description: "عرض معلومات تفصيلية عن مستخدم",
        category: "المطور",
        guide: { ar: "{pn} [@منشن | ID]" }
    },
    onStart: async function ({ api, event, args }) {
        const targetID = Object.keys(event.mentions)[0] || args[0] || event.senderID;
        api.getUserInfo(targetID, (err, info) => {
            if (err) return api.sendMessage("❌ فشل في جلب المعلومات.", event.threadID);
            const user = info[targetID];
            const msg = `👤 معلومات المستخدم:
━━━━━━━━━━━━━
📝 الاسم: ${user.name}
🆔 المعرف: ${targetID}
🔗 الرابط: fb.com/${targetID}
🚻 الجنس: ${user.gender == 2 ? "ذكر" : "أنثى"}
🌍 اللغة: ${user.vanity || "غير معروفة"}
━━━━━━━━━━━━━`;
            api.sendMessage(msg, event.threadID);
        });
    }
};
