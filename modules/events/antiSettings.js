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
        if (logMessageType === "log:thread-name" && settings.antiChangeGroupName) {
            if (author !== api.getCurrentUserID()) {
                api.setTitle(logMessageData.oldName, threadID, () => {
                    api.sendMessage("⚠️ تنبيه: تغيير اسم المجموعة غير مسموح به، تمت إعادة الاسم الأصلي.", threadID);
                });
            }
        }

        // حماية الكنيات
        if (logMessageType === "log:user-nickname" && settings.antiChangeNickname) {
            if (author !== api.getCurrentUserID()) {
                const oldNickname = logMessageData.oldNickname || ""; 
                api.changeNickname(oldNickname, threadID, logMessageData.participantID, () => {
                    api.sendMessage("⚠️ تنبيه: تغيير الكنيات غير مسموح به، تمت استعادة الكنية.", threadID);
                });
            }
        }

        // منع الخروج (إعادة العضو)
        if (logMessageType === "log:unsubscribe" && settings.antiOut) {
            if (logMessageData.leftParticipantFbId !== api.getCurrentUserID()) {
                const leftID = logMessageData.leftParticipantFbId;
                api.addUserToGroup(leftID, threadID, (err) => {
                    if (!err) {
                        api.sendMessage("⚠️ تنبيه: الخروج من المجموعة ممنوع، تمت إعادتك.", threadID);
                    }
                });
            }
        }
    }
};
