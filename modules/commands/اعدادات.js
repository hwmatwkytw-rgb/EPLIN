const fs = require('fs-extra');
const path = require('path');

const config = {
    name: "اعدادات",
    version: "1.0",
    author: "ᏕᎥᏁᎨᎧ",
    countDown: 5,
    role: 1,
    description: "إعدادات حماية المجموعة",
    category: "الإدارة",
    guide: { ar: "{pn}" }
};

const threadsPath = path.join(__dirname, '../../database/groups.json');

function readDB() {
    try { return fs.readJsonSync(threadsPath); }
    catch (e) { return {}; }
}

function writeDB(data) {
    fs.writeJsonSync(threadsPath, data, { spaces: 2 });
}

module.exports = {
    config,

    onStart: async function ({ api, event }) {
        const { threadID, messageID, senderID } = event;
        const threadData = readDB();

        if (!threadData[threadID]) threadData[threadID] = { settings: {}, members: {} };

        // إعدادات افتراضية
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

        api.sendMessage(msg, threadID, (err, info) => {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID,
                settings
            });
        }, messageID);
    },

    onReply: async function ({ api, event, handleReply }) {
        const { threadID, messageID, body, senderID } = event;
        if (senderID !== handleReply.author) return;

        const nums = body.split(/\s+/).map(Number).filter(n => n >= 1 && n <= 6);
        if (!nums.length) return api.sendMessage("❌ اختيار غير صالح", threadID, messageID);

        const keys = [
            "antiSpam",
            "antiOut",
            "antiChangeGroupName",
            "antiChangeGroupImage",
            "antiChangeNickname",
            "notifyChange",
        ];

        const newSettings = { ...handleReply.settings };
        for (const n of nums) newSettings[keys[n - 1]] = !newSettings[keys[n - 1]];

        const threadData = readDB();
        if (!threadData[threadID]) threadData[threadID] = { settings: {}, members: {} };
        threadData[threadID].settings.antiSettings = newSettings;
        writeDB(threadData);

        const show = {};
        for (const k in newSettings) show[k] = newSettings[k] ? "✅" : "❌";

        api.unsendMessage(handleReply.messageID);
        return api.sendMessage(`╭━〔 ⚙️ تم تحديث الإعدادات 〕━╮
① [${show.antiSpam}] مكافحة السبام
② [${show.antiOut}] منع الخروج
③ [${show.antiChangeGroupName}] حماية الاسم
④ [${show.antiChangeGroupImage}] حماية الصورة
⑤ [${show.antiChangeNickname}] حماية الكنيات
⑥ [${show.notifyChange}] إشعارات
╰━━━━━━━━━━━━━━━━╯
تم حفظ التغييرات بنجاح ✅`, threadID, messageID);
    }
};
