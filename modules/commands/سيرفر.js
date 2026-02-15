const { exec } = require("child_process");

module.exports = {
    config: {
        name: "سيرفر",
        version: "1.0",
        author: "bestgamershk",
        countDown: 5,
        prefix: true,
        role: 2, // Developer only
        description: "Reset (delete) All settings for the server.",
        category: "المطور",
        guide: {
            ar: "{pn}resetsettings (ستتم إعادة تعيين جميع الإعدادات)"
        },
    },

    onStart: async ({ api, event, args, config }) => {
        const { threadID, messageID, senderID } = event;

        // التحقق من صلاحيات المطور من config.json
        const adminUIDs = config.adminUIDs || [];
        if (!adminUIDs.includes(senderID)) {
            return api.sendMessage("⚠️ هذا الأمر خاص بالمطورين فقط.", threadID, messageID);
        }

        if (args[0] === "resetsettings") {
            return api.sendMessage("⚠️ هل أنت متأكد من إعادة تعيين جميع الإعدادات؟ رد بـ 'نعم' للتأكيد.", threadID, (err, info) => {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    type: "confirm_reset"
                });
            }, messageID);
        }

        return api.sendMessage("❓ استخدم: سيرفر resetsettings لإعادة تعيين الإعدادات.", threadID, messageID);
    },

    onReply: async ({ api, event, handleReply }) => {
        const { threadID, messageID, body, senderID } = event;
        if (senderID !== handleReply.author || handleReply.type !== "confirm_reset") return;

        if (body.toLowerCase() === "نعم" || body.toLowerCase() === "yes") {
            const fs = require('fs-extra');
            const path = require('path');
            const dbPath = path.join(__dirname, '../../database/groups.json');

            try {
                let db = fs.readJsonSync(dbPath);
                if (db[threadID]) {
                    db[threadID].settings = {};
                    fs.writeJsonSync(dbPath, db, { spaces: 2 });
                    api.sendMessage("✅ تم إعادة تعيين جميع إعدادات المجموعة بنجاح.", threadID, messageID);
                } else {
                    api.sendMessage("❌ لا توجد إعدادات مخزنة لهذه المجموعة.", threadID, messageID);
                }
            } catch (e) {
                api.sendMessage("❌ حدث خطأ أثناء مسح البيانات.", threadID, messageID);
            }
        } else {
            api.sendMessage("❌ تم إلغاء العملية.", threadID, messageID);
        }
        api.unsendMessage(handleReply.messageID);
    }
};
