const fs = require('fs-extra');
const path = require('path');

const config = {
    name: "اعدادات",
    version: "1.0",
    author: "ᏕᎨᏁᎨᎧ",
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
    } catch (e) {
        return {};
    }
}

function writeDB(data) {
    fs.writeJsonSync(threadsPath, data, { spaces: 2 });
}

module.exports = {
    config,
    onStart: async function ({ api, event, Threads }) {
        const { threadID, messageID } = event;
        const threadData = readDB();
        
        if (!threadData[threadID]) {
            threadData[threadID] = { settings: {} };
        }
        
        const settings = threadData[threadID].settings.antiSettings || {
            antiSpam: false,
            antiOut: false,
            antiChangeGroupName: false,
            antiChangeGroupImage: false,
            antiChangeNickname: false,
            notifyChange: false
        };

        const show = {};
        for (const k in settings) show[k] = settings[k] ? "✅" : "❌";

        const msg = `╭━〔 🛡 إعدادات المجموعة 🛡 〕━╮
① [${show.antiSpam}] مكافحة السبام
② [${show.antiOut}] منع الخروج
③ [${show.antiChangeGroupName}] حماية اسم المجموعة
④ [${show.antiChangeGroupImage}] حماية صورة المجموعة
⑤ [${show.antiChangeNickname}] حماية الكنيات
⑥ [${show.notifyChange}] إشعارات الأحداث
╰━━━━━━━━━━━━━━━━━╯
↫ رد بالأرقام لتغيير الإعدادات`;

        return api.sendMessage(msg, threadID, (err, info) => {
            if (err) return;
            global.client.handleReply.push({
                name: config.name,
                messageID: info.messageID,
                author: event.senderID,
                settings
            });
        }, messageID);
    },

    onReply: async function ({ api, event, handleReply }) {
        const { threadID, messageID, body, senderID } = event;
        if (senderID !== handleReply.author) return;

        const nums = body.split(/\s+/).map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 6);
        if (!nums.length) return api.sendMessage("❌ اختيار غير صالح. يرجى إدخال أرقام الخيارات (مثلاً: 1 3).", threadID, messageID);

        const keys = [
            "antiSpam",
            "antiOut",
            "antiChangeGroupName",
            "antiChangeGroupImage",
            "antiChangeNickname",
            "notifyChange",
        ];

        const newSettings = { ...handleReply.settings };
        for (const n of nums) {
            const key = keys[n - 1];
            if (key) {
                newSettings[key] = !newSettings[key];
            }
        }

        const threadData = readDB();
        if (!threadData[threadID]) threadData[threadID] = { settings: {} };
        if (!threadData[threadID].settings) threadData[threadID].settings = {};
        
        threadData[threadID].settings.antiSettings = newSettings;
        writeDB(threadData);

        const show = {};
        for (const k in newSettings) show[k] = newSettings[k] ? "✅" : "❌";

        const confirmMsg = `╭━〔 ⚙️ تم تحديث الإعدادات 〕━ـ╮
① [${show.antiSpam}] مكافحة السبام
② [${show.antiOut}] منع الخروج
③ [${show.antiChangeGroupName}] حماية الاسم
④ [${show.antiChangeGroupImage}] حماية صورة المجموعة
⑤ [${show.antiChangeNickname}] حماية الكنيات
⑥ [${show.notifyChange}] إشعارات
╰━━━━━━━━━━━━━━━━╯
تم حفظ التغييرات بنجاح ✅`;

        try {
            await api.unsendMessage(handleReply.messageID);
        } catch (e) {}
        
        return api.sendMessage(confirmMsg, threadID, messageID);
    }
};
