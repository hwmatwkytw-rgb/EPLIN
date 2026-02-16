const fs = require('fs-extra');
const path = require('path');

module.exports = async function (event, api) {
    const { threadID, logMessageType, logMessageData, author } = event;
    const threadsPath = path.join(__dirname, '../../database/groups.json');

    let threadData = {};
    try { threadData = fs.readJsonSync(threadsPath); } catch (e) { return; }
    if (!threadData[threadID]) threadData[threadID] = { settings: {}, members: {} };

    const settings = threadData[threadID].settings.antiSettings;
    if (!settings) return;

    // ----------------- حماية الكنيات -----------------
    if (logMessageType === "log:user-nickname" && settings.antiChangeNickname) {
        if (author !== api.getCurrentUserID()) {
            const { participantID, oldNickname } = logMessageData;

            // جلب الكنية القديمة من قاعدة البيانات إذا موجودة
            const oldName = oldNickname || threadData[threadID].members[participantID] || "";
            api.changeNickname(oldName, threadID, participantID, () => {
                if (settings.notifyChange)
                    api.sendMessage(`⚠️ تم استعادة كنية ${participantID}`, threadID);
            });
        }
    }

    // تخزين الكنيات الجديدة دائمًا
    if (logMessageType === "log:user-nickname") {
        const { participantID, nickname } = logMessageData;
        threadData[threadID].members[participantID] = nickname || "";
        fs.writeJsonSync(threadsPath, threadData, { spaces: 2 });
    }

    // ----------------- حماية اسم المجموعة -----------------
    if (logMessageType === "log:thread-name" && settings.antiChangeGroupName) {
        if (author !== api.getCurrentUserID()) {
            const oldName = logMessageData.oldName || "اسم قديم"; // fallback
            api.setTitle(oldName, threadID, () => {
                if (settings.notifyChange)
                    api.sendMessage("⚠️ تم إعادة اسم المجموعة الأصلي", threadID);
            });
        }
    }

    // ----------------- حماية صورة المجموعة -----------------
    if (logMessageType === "log:thread-icon" && settings.antiChangeGroupImage) {
        if (author !== api.getCurrentUserID()) {
            const oldIcon = logMessageData.oldIcon || null;
            api.setImage(oldIcon, threadID, () => {
                if (settings.notifyChange)
                    api.sendMessage("⚠️ تم إعادة صورة المجموعة الأصلية", threadID);
            });
        }
    }

    // ----------------- منع الخروج وإعادة العضو -----------------
    if (logMessageType === "log:unsubscribe" && settings.antiOut) {
        const leftID = logMessageData.leftParticipantFbId;
        if (leftID && leftID !== api.getCurrentUserID()) {
            api.addUserToGroup(leftID, threadID, (err) => {
                if (!err && settings.notifyChange)
                    api.sendMessage(`⚠️ ${leftID} تم إعادة العضو بعد الخروج`, threadID);
            });
        }
    }

    // ----------------- إشعارات عامة -----------------
    if (settings.notifyChange) {
        let text = "";
        switch (logMessageType) {
            case "log:thread-name": text = `📌 تم تغيير اسم المجموعة`; break;
            case "log:thread-icon": text = `📌 تم تغيير صورة المجموعة`; break;
            case "log:user-nickname": text = `📌 ${logMessageData.participantID} حاول تغيير كنيته`; break;
            case "log:unsubscribe": text = `📌 ${logMessageData.leftParticipantFbId} غادر المجموعة`; break;
        }
        if (text) api.sendMessage(text, threadID);
    }
};
