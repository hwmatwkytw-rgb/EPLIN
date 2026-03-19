const fs = require('fs-extra');
const path = require('path');
const threadsPath = path.join(__dirname, '../../database/groups.json');

// ── قراءة إعدادات الحماية ──
function getThreadData(threadID) {
    try {
        const data = fs.readJsonSync(threadsPath);
        return data[threadID] || null;
    } catch (e) { return null; }
}

function getSettings(threadID) {
    return getThreadData(threadID)?.settings?.antiSettings || null;
}

// ── كاش الكنيات: قراءة ──
function getCachedNickname(threadID, userID) {
    try {
        const data = fs.readJsonSync(threadsPath);
        return data[threadID]?.nicknameCache?.[userID] ?? null;
    } catch (e) { return null; }
}

// ── كاش الكنيات: حفظ ──
function saveCachedNickname(threadID, userID, nickname) {
    try {
        const data = fs.readJsonSync(threadsPath);
        if (!data[threadID]) return;
        if (!data[threadID].nicknameCache) data[threadID].nicknameCache = {};
        data[threadID].nicknameCache[userID] = nickname || "";
        fs.writeJsonSync(threadsPath, data, { spaces: 2 });
    } catch (e) {}
}

async function getUserName(api, userID) {
    try {
        const info = await api.getUserInfo(userID);
        return info[userID]?.name || userID;
    } catch (e) { return userID; }
}

module.exports = {
    config: {
        name: "antiSettings",
        version: "2.1",
        author: "Kenji",
        description: "حماية المجموعة",
        eventType: [
            "log:thread-name",
            "log:user-nickname",
            "log:unsubscribe",
            "log:thread-image"
        ]
    },

    onStart: async function ({ event, api }) {
        const { threadID, logMessageType, logMessageData, author, type } = event;
        if (type !== "event") return;

        const settings = getSettings(threadID);
        if (!settings) return;

        const botID = api.getCurrentUserID();

        // ──────────────────────────────────────
        // حماية اسم المجموعة
        // ──────────────────────────────────────
        if (logMessageType === "log:thread-name") {
            if (author === botID) return;
            const oldName = logMessageData?.oldName || "";
            const newName = logMessageData?.name || "";
            const authorName = await getUserName(api, author);

            if (settings.antiChangeGroupName) {
                if (oldName) api.setTitle(oldName, threadID, () => {});
                api.sendMessage(
                    `تغيير اسم المجموعة غير مسموح به لذلك تم اعادته!`,
                    threadID
                );
            } else if (settings.notifyChange) {
                api.sendMessage(
                    `"${authorName}" غيرت اسم المجموعة إلى "${newName}".`,
                    threadID
                );
            }
        }

        // ──────────────────────────────────────
        // حماية صورة المجموعة
        // ──────────────────────────────────────
        if (logMessageType === "log:thread-image") {
            if (author === botID) return;
            const authorName = await getUserName(api, author);

            if (settings.antiChangeGroupImage) {
                api.sendMessage(
                    `غير مسموح بتغيير صورة المجموعة لذلك تم اعادتها!`,
                    threadID
                );
            } else if (settings.notifyChange) {
                api.sendMessage(
                    `"${authorName}" غيرت صورة المجموعة.`,
                    threadID
                );
            }
        }

        // ──────────────────────────────────────
        // حماية الكنيات - مع كاش لحفظ القيمة القديمة
        // ملاحظة: لا نتجاهل أحداث البوت هنا لأننا نحتاج حفظ الكاش
        // ──────────────────────────────────────
        if (logMessageType === "log:user-nickname") {
            const participantID =
                logMessageData?.participantID ||
                logMessageData?.participant_id ||
                logMessageData?.targetID ||
                logMessageData?.target_id ||
                author;

            const newNickname =
                logMessageData?.nickname ||
                logMessageData?.newNickname ||
                logMessageData?.new_nickname || "";

            if (settings.antiChangeNickname) {
                // إذا البوت هو اللي غيّر → هذا رد فعل البوت نفسه للإعادة، تجاهل
                if (author === botID) return;

                // استرجاع الكنية القديمة من الكاش
                const savedNickname = getCachedNickname(threadID, participantID);
                const restoreValue = savedNickname !== null ? savedNickname : "";

                api.changeNickname(restoreValue, threadID, participantID, () => {});
                api.sendMessage(
                    `تغير الغب غير مسموح به لزالك تمت اعادته`,
                    threadID
                );
            } else {
                // الحماية مطفية → احفظ الكنية الجديدة في الكاش (حتى لو البوت غيّرها)
                saveCachedNickname(threadID, participantID, newNickname);

                if (settings.notifyChange && author !== botID) {
                    const authorName = await getUserName(api, author);
                    const targetName = await getUserName(api, participantID);
                    const isSelf = author === participantID;
                    api.sendMessage(
                        isSelf
                            ? `"${authorName}" غير لقبه الى "${newNickname}".`
                            : `"${authorName}" غير لقبه "${targetName}" الى "${newNickname}".`,
                        threadID
                    );
                }
            }
        }

        // ──────────────────────────────────────
        // منع الخروج
        // ──────────────────────────────────────
        if (logMessageType === "log:unsubscribe") {
            const leftID = logMessageData?.leftParticipantFbId;
            if (!leftID || leftID === botID) return;

            const leftName = await getUserName(api, leftID);
            const wasKicked = author !== leftID;

            if (settings.antiOut) {
                api.addUserToGroup(leftID, threadID, (err) => {
                    if (err) {
                        api.sendMessage(
                            `لا يمكن إضافة عضو مرة أخرى إلى المجموعة!`,
                            threadID
                        );
                    } else {
                        api.sendMessage(
                            `مارق بكرامتك وين يا عب يا عب بل بس هنا 🗿🔨`,
                            threadID
                        );
                    }
                });
            } else if (settings.notifyChange) {
                api.sendMessage(
                    wasKicked
                        ? `${leftName} جغمو الادمن 🙂`
                        : `${leftName} كان عب`,
                    threadID
                );
            }
        }
    }
};
