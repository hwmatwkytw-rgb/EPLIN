const fs = require('fs-extra');
const path = require('path');

const config = {
    name: "اعدادات",
    version: "2.0",
    author: "ᏕᎥᏁᎨᎧ (fixed)",
    countDown: 5,
    role: 1,
    description: "إعدادات حماية المجموعة",
    category: "الإدارة",
    guide: { ar: "{pn}" }
};

const threadsPath = path.join(__dirname, '../../database/groups.json');

function readDB() {
    try {
        return fs.readJsonSync(threadsPath);
    } catch {
        return {};
    }
}

function writeDB(data) {
    fs.writeJsonSync(threadsPath, data, { spaces: 2 });
}

function renderMenu(settings, title = "🛡 إعدادات المجموعة") {
    const s = {};
    for (const k in settings) s[k] = settings[k] ? "✅" : "❌";

    return `╭━〔 ${title} 〕━╮
① [${s.antiSpam}] مكافحة السبام
② [${s.antiOut}] منع الخروج
③ [${s.antiChangeGroupName}] حماية اسم المجموعة
④ [${s.antiChangeGroupImage}] حماية صورة المجموعة
⑤ [${s.antiChangeNickname}] حماية الكنيات
⑥ [${s.notifyChange}] إشعارات
╰━━━━━━━━━━━━━━━━━╯`;
}

module.exports = {
    config,

    // ================== القائمة الأولى ==================
    onStart: async function ({ api, event }) {
        const { threadID, messageID, senderID } = event;
        const db = readDB();

        if (!db[threadID]) db[threadID] = { settings: {} };

        const settings = db[threadID].settings.antiSettings || {
            antiSpam: false,
            antiOut: false,
            antiChangeGroupName: false,
            antiChangeGroupImage: false,
            antiChangeNickname: false,
            notifyChange: false
        };

        const msg = renderMenu(settings) + "\n↫ رد بالأرقام للتغيير";

        return api.sendMessage(msg, threadID, (err, info) => {
            global.client.handleReply.push({
                name: config.name,
                messageID: info.messageID,
                author: senderID,
                stage: "select",
                settings
            });
        }, messageID);
    },

    // ================== التحكم ==================
    onReply: async function ({ api, event, handleReply }) {
        const { threadID, messageID, body, senderID } = event;
        if (senderID !== handleReply.author) return;

        const keys = [
            "antiSpam",
            "antiOut",
            "antiChangeGroupName",
            "antiChangeGroupImage",
            "antiChangeNickname",
            "notifyChange"
        ];

        // ===== مرحلة التأكيد =====
        if (handleReply.stage === "confirm") {
            if (body === "نعم") {
                const db = readDB();
                if (!db[threadID]) db[threadID] = { settings: {} };

                db[threadID].settings.antiSettings = handleReply.newSettings;
                writeDB(db);

                api.unsendMessage(handleReply.messageID);

                const msg = renderMenu(handleReply.newSettings) + "\n↫ رد بالأرقام للتغيير";

                return api.sendMessage(msg, threadID, (err, info) => {
                    global.client.handleReply.push({
                        name: config.name,
                        messageID: info.messageID,
                        author: senderID,
                        stage: "select",
                        settings: handleReply.newSettings
                    });
                }, messageID);
            }

            if (body === "لا") {
                api.unsendMessage(handleReply.messageID);
                return api.sendMessage("❌ تم إلغاء التعديل", threadID, messageID);
            }

            return api.sendMessage("✍ اكتب (نعم) أو (لا)", threadID, messageID);
        }

        // ===== مرحلة الاختيار =====
        const nums = body.split(/\s+/).map(Number).filter(n => n >= 1 && n <= 6);
        if (!nums.length)
            return api.sendMessage("❌ اختيار غير صالح", threadID, messageID);

        const newSettings = { ...handleReply.settings };
        nums.forEach(n => newSettings[keys[n - 1]] = !newSettings[keys[n - 1]]);

        const confirmMsg =
            renderMenu(newSettings, "⚠️ تأكيد الإعدادات") +
            "\n✍ اكتب (نعم) للحفظ\n✍ اكتب (لا) للإلغاء";

        api.unsendMessage(handleReply.messageID);

        return api.sendMessage(confirmMsg, threadID, (err, info) => {
            global.client.handleReply.push({
                name: config.name,
                messageID: info.messageID,
                author: senderID,
                stage: "confirm",
                newSettings
            });
        }, messageID);
    }
};
