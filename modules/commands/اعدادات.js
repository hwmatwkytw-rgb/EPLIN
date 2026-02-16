const fs = require('fs-extra');
const path = require('path');

const config = {
    name: "اعدادات",
    version: "1.1",
    author: "ᏕᎥᏁᎨᎧ",
    countDown: 5,
    role: 1,
    description: "إعدادات حماية المجموعة + تطبيقها",
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

        // خزّن الاسم والصورة الأصلية وأسماء الأعضاء
        const info = await api.getThreadInfo(threadID);
        threadData[threadID].name = info.threadName;
        threadData[threadID].image = info.imageSrc;
        threadData[threadID].members = {};
        for (const id of info.participantIDs) {
            const user = await api.getUserInfo(id);
            threadData[threadID].members[id] = user[id].name;
        }

        writeDB(threadData);

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
    },

    onEvent: async function ({ api, event }) {
        const threadID = event.threadID;
        const threadData = readDB();
        if (!threadData[threadID]) return;
        const settings = threadData[threadID].settings.antiSettings || {};

        // حماية الاسم
        if (settings.antiChangeGroupName && event.logMessageType === "log:thread-name") {
            if (event.logMessageData.name !== threadData[threadID].name) {
                api.setTitle(threadData[threadID].name, threadID);
                if (settings.notifyChange) api.sendMessage("⚠️ ممنوع تغيير اسم المجموعة!", threadID);
            }
        }

        // حماية الصورة
        if (settings.antiChangeGroupImage && event.logMessageType === "log:thread-icon") {
            api.setThreadImage(threadData[threadID].image, threadID);
            if (settings.notifyChange) api.sendMessage("⚠️ ممنوع تغيير صورة المجموعة!", threadID);
        }

        // حماية الكنيات
        if (settings.antiChangeNickname && event.logMessageType === "log:user-nickname") {
            const userID = event.logMessageData.userID;
            const oldNick = threadData[threadID].members[userID];
            if (event.logMessageData.nickname !== oldNick) {
                api.changeNickname(oldNick, threadID, userID);
                if (settings.notifyChange) api.sendMessage(`⚠️ ممنوع تغيير كنيتك! ${oldNick}`, threadID);
            }
        }

        // منع الخروج
        if (settings.antiOut && event.logMessageType === "log:unsubscribe") {
            const userID = event.logMessageData.leftParticipantFbId;
            api.sendMessage(`⚠️ ${userID} لا يمكنه مغادرة المجموعة!`, threadID);
        }
    }
};
