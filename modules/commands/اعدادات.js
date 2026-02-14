const fs = require('fs-extra');
const path = require('path');

const config = {
    name: "اعدادات",
    version: "1.1",
    author: "ᏕᎥᏁᎨᎧ",
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
    onStart: async function ({ api, event }) {
        const { threadID, messageID, senderID } = event;

        if (!global.client.handleReply) global.client.handleReply = [];

        const threadData = readDB();
        if (!threadData[threadID]) threadData[threadID] = { settings: {} };

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

        const info = await api.sendMessage(msg, threadID, messageID);

        global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            settings,
            threadID
        });
    },

    onReply: async function ({ api, event, handleReply }) {
        const { threadID, messageID, senderID, body } = event;

        if (!handleReply) return;
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

        // تعديل الإعدادات
        const newSettings = { ...handleReply.settings };
        for (const n of nums) {
            const key = keys[n - 1];
            newSettings[key] = !newSettings[key];
        }

        const threadData = readDB();
        if (!threadData[threadID]) threadData[threadID] = { settings: {} };
        threadData[threadID].settings.antiSettings = newSettings;
        writeDB(threadData);

        const show = {};
        for (const k in newSettings) show[k] = newSettings[k] ? "✅" : "❌";

        const confirmMsg = `╭━〔 ⚙️ تم تحديث الإعدادات 〕━╮
① [${show.antiSpam}] مكافحة السبام
② [${show.antiOut}] منع الخروج
③ [${show.antiChangeGroupName}] حماية الاسم
④ [${show.antiChangeGroupImage}] حماية الصورة
⑤ [${show.antiChangeNickname}] حماية الكنيات
⑥ [${show.notifyChange}] إشعارات
╰━━━━━━━━━━━━━━━━╯
✅ تم حفظ التغييرات بنجاح`;

        // إزالة الرد القديم
        await api.unsendMessage(handleReply.messageID);
        return api.sendMessage(confirmMsg, threadID, messageID);
    }
};
