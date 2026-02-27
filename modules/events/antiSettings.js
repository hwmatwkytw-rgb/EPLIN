module.exports = {
    config: {
        name: "antiSettings",
        version: "1.0",
        author: "Kenji Agent",
        description: "حماية المجموعة",
        eventType: ["log:thread-name", "log:user-nickname", "log:unsubscribe"]
    },
    onStart: async function ({ event, api }) {
        const { threadID, logMessageType, logMessageData, author, type } = event;
        // التأكد من أن الحدث هو حدث نظام (log) وليس رسالة عادية
        if (type !== "event") return;

        const fs = require('fs-extra');
        const path = require('path');
        const threadsPath = path.join(__dirname, '../../database/groups.json');
        
        let threadData = {};
        try {
            threadData = fs.readJsonSync(threadsPath);
        } catch (e) { return; }

        const settings = threadData[threadID]?.settings?.antiSettings;
        if (!settings) return;

        const botID = api.getCurrentUserID();

        // حماية اسم المجموعة
        if (logMessageType === "log:thread-name") {
            const oldName = logMessageData.oldName;
            if (settings.antiChangeGroupName && author !== botID) {
                api.setTitle(oldName, threadID, (err) => {
                    if (err) console.error("Error reverting title:", err);
                });
            } else if (settings.notifyChange) {
                api.sendMessage(`🔔 إشعار: تم تغيير اسم المجموعة بواسطة ${author}`, threadID);
            }
        }

        // حماية الكنيات
        if (logMessageType === "log:user-nickname") {
            const oldNickname = logMessageData.oldNickname || "";
            const participantID = logMessageData.participantID;
            if (settings.antiChangeNickname && author !== botID) {
                api.changeNickname(oldNickname, threadID, participantID, (err) => {
                    if (err) console.error("Error reverting nickname:", err);
                });
            } else if (settings.notifyChange) {
                api.sendMessage(`🔔 إشعار: تم تغيير الكنية بواسطة ${author}`, threadID);
            }
        }

        // منع الخروج (إعادة العضو)
        if (logMessageType === "log:unsubscribe") {
            const leftID = logMessageData.leftParticipantFbId;
            if (settings.antiOut && leftID !== botID) {
                api.addUserToGroup(leftID, threadID, (err) => {
                    if (err) console.error("Error re-adding user:", err);
                });
            } else if (settings.notifyChange) {
                api.sendMessage(`🔔 إشعار: غادر أحد الأعضاء المجموعة.`, threadID);
            }
        }
    }
};
