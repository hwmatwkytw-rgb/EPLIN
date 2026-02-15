const fs = require('fs-extra');
const path = require('path');

const config = {
    name: "اعدادات",
    version: "1.0",
    author: "ابو عبيده علي",
    description: "أمر إعدادات حماية المجموعة الكامل",
    role: 1,
    countDown: 3,
    event: true,
};

const dbPath = path.join(__dirname, '../../database/groups.json');

function readDB() {
    try { return fs.readJsonSync(dbPath); } 
    catch { return {}; }
}

function writeDB(data) {
    try { fs.writeJsonSync(dbPath, data, { spaces: 2 }); } 
    catch (e) { console.error("خطأ في حفظ البيانات:", e); }
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

    // ===== أمر الإعدادات =====
    onStart: function({ api, event }) {
        const { threadID, messageID, senderID } = event;
        const db = readDB();

        if (!db[threadID]) db[threadID] = { settings: {}, original: {} };

        // حفظ النسخة الأصلية عند أول تشغيل
        api.getThreadInfo(threadID, (err, info) => {
            if (err) return;

            const t = db[threadID].original;

            if (!t.threadName) t.threadName = info.threadName;
            if (!t.threadImage && info.threadImage) t.threadImage = info.threadImage;
            if (!t.nicknames) {
                t.nicknames = {};
                info.userInfo.forEach(u => { t.nicknames[u.id] = u.name; });
            }

            writeDB(db);
        });

        const settings = db[threadID].settings.antiSettings || {
            antiSpam: false,
            antiOut: false,
            antiChangeGroupName: false,
            antiChangeGroupImage: false,
            antiChangeNickname: false,
            notifyChange: false
        };

        const msg = renderMenu(settings) + "\n↫ رد بالأرقام لتغيير الإعدادات";

        api.sendMessage(msg, threadID, (err, info) => {
            if (err) return;
            global.client.handleReply.push({
                name: config.name,
                messageID: info.messageID,
                author: senderID,
                stage: "select",
                settings
            });
        }, messageID);
    },

    // ===== الرد على اختيار المستخدم =====
    onReply: function({ api, event, handleReply }) {
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

        // مرحلة الاختيار
        const nums = body.split(/\s+/).map(Number).filter(n => n >= 1 && n <= 6);
        if (!nums.length) return api.sendMessage("❌ اختيار غير صالح", threadID, messageID);

        const newSettings = { ...handleReply.settings };
        nums.forEach(n => { newSettings[keys[n - 1]] = !newSettings[keys[n - 1]]; });

        const confirmMsg = renderMenu(newSettings, "⚠️ تأكيد الإعدادات") +
            "\n✍ اكتب (نعم) للحفظ\n✍ اكتب (لا) للإلغاء";

        api.unsendMessage(handleReply.messageID);
        api.sendMessage(confirmMsg, threadID, (err, info) => {
            if (err) return;
            global.client.handleReply.push({
                name: config.name,
                messageID: info.messageID,
                author: senderID,
                stage: "confirm",
                newSettings
            });
        }, messageID);
    },

    // ===== حفظ التغييرات بعد التأكيد =====
    onConfirm: function({ api, event, handleReply }) {
        const { threadID, messageID, body, senderID } = event;
        if (senderID !== handleReply.author) return;

        if (body === "نعم") {
            const db = readDB();
            if (!db[threadID]) db[threadID] = { settings: {}, original: {} };

            db[threadID].settings.antiSettings = handleReply.newSettings;
            writeDB(db);

            api.unsendMessage(handleReply.messageID);
            return api.sendMessage("✅ تم حفظ الإعدادات بنجاح", threadID, messageID);
        }

        if (body === "لا") {
            api.unsendMessage(handleReply.messageID);
            return api.sendMessage("❌ تم إلغاء التعديل", threadID, messageID);
        }

        api.sendMessage("✍ اكتب (نعم) أو (لا)", threadID, messageID);
    },

    // ===== حماية الأحداث =====
    onEvent: function({ api, event }) {
        const { threadID, logMessageType, logMessageData, author } = event;
        const db = readDB();
        const settings = db[threadID]?.settings?.antiSettings;
        const original = db[threadID]?.original;
        if (!settings || !original) return;

        // حماية اسم المجموعة
        if (logMessageType === "log:thread-name" && settings.antiChangeGroupName && author !== api.getCurrentUserID()) {
            const oldName = original.threadName || "المجموعة";
            api.setTitle(oldName, threadID, () => {
                api.sendMessage("⚠️ تغيير اسم المجموعة غير مسموح، تمت إعادة الاسم الأصلي.", threadID);
            });
        }

        // حماية الكنيات
        if (logMessageType === "log:user-nickname" && settings.antiChangeNickname && author !== api.getCurrentUserID()) {
            const participantID = logMessageData.userID || logMessageData.participantID;
            const oldNickname = original.nicknames[participantID] || "";
            api.changeNickname(oldNickname, threadID, participantID, () => {
                api.sendMessage("🚫 تغيير الكنية غير مسموح، تمت استعادتها.", threadID);
            });
        }

        // منع الخروج
        if (logMessageType === "log:unsubscribe" && settings.antiOut) {
            const leftID = logMessageData.leftParticipantFbId;
            if (leftID && leftID !== api.getCurrentUserID()) {
                api.addUserToGroup(leftID, threadID, (err) => {
                    if (!err) api.sendMessage("🚫 العضو لم يُسمح له بالخروج، تم إرجاعه.", threadID);
                });
            }
        }

        // حماية صورة المجموعة
        if (logMessageType === "log:thread-icon" && settings.antiChangeGroupImage) {
            const oldImage = original.threadImage;
            if (oldImage) api.setThreadImage(oldImage, threadID);
            api.sendMessage("⚠️ تغيير صورة المجموعة غير مسموح، تمت إعادة الصورة الأصلية.", threadID);
        }
    }
};
