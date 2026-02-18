module.exports = {
    config: {
        name: "antiSettings",
        version: "1.0",
        author: "Kenji Agent",
        description: "حماية المجموعة",
        eventType: ["log:thread-name", "log:user-nickname", "log:unsubscribe"]
    },
    onStart: async function ({ event, api }) {
        const { threadID, logMessageType, logMessageData, author } = event;
        const fs = require('fs-extra');
        const path = require('path');
        const threadsPath = path.join(__dirname, '../../database/groups.json');
        
        let threadData = {};
        try {
            threadData = fs.readJsonSync(threadsPath);
        } catch (e) { return; }

        const settings = threadData[threadID]?.settings?.antiSettings;
        if (!settings) return;

        // حماية اسم المجموعة
        if (logMessageType === "log:thread-name") {
            const oldName = logMessageData.oldName;
            if (settings.antiChangeGroupName && author !== api.getCurrentUserID()) {
                api.setTitle(oldName, threadID, (err) => {
                    if (!err) api.sendMessage("⚠️ تنبيه: حماية الاسم مفعلة، تمت إعادة الاسم الأصلي.", threadID);
                });
            } else if (settings.notifyChange) {
                api.sendMessage(`فعلو الاعدادات عشان احش العبيد"${logMessageData.name}" بواسطة ${author}`, threadID);
            }
        }

        // حماية الكنيات
        if (logMessageType === "log:user-nickname") {
            const oldNickname = logMessageData.oldNickname || "";
            const participantID = logMessageData.participantID;
            if (settings.antiChangeNickname && author !== api.getCurrentUserID()) {
                api.changeNickname(oldNickname, threadID, participantID, (err) => {
                    if (!err) api.sendMessage("قول واااي ابلين بخليك .", threadID);
                });
            } else if (settings.notifyChange) {
                api.sendMessage(` لا تلعب بل كنيات يا فتئ ${author}`, threadID);
            }
        }

        // منع الخروج (إعادة العضو)
        if (logMessageType === "log:unsubscribe") {
            const leftID = logMessageData.leftParticipantFbId;
            if (settings.antiOut && leftID !== api.getCurrentUserID()) {
                api.addUserToGroup(leftID, threadID, (err) => {
                    if (!err) {
                        api.sendMessage("غير اسم المجمعة غير مسمح به.", threadID);
                    }
                });
            } else if (settings.notifyChange) {
                api.sendMessage(`كان عب 🤌.`, threadID);
            }
        }
    }
};
