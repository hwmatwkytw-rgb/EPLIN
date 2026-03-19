const fs = require('fs-extra');
const path = require('path');
const threadsPath = path.join(__dirname, '../../database/groups.json');

// ── دالات التعامل مع قاعدة البيانات ──
function getThreadData(threadID) {
    try {
        const data = fs.readJsonSync(threadsPath);
        return data[threadID] || {};
    } catch (e) { return {}; }
}

function updateThreadData(threadID, updateObject) {
    try {
        const data = fs.readJsonSync(threadsPath);
        if (!data[threadID]) data[threadID] = { settings: { antiSettings: {} } };
        data[threadID] = { ...data[threadID], ...updateObject };
        fs.writeJsonSync(threadsPath, data, { spaces: 2 });
    } catch (e) {}
}

module.exports = {
    config: {
        name: "antiSettings",
        version: "3.0",
        author: "محمد (SINKO)",
        description: "نظام حماية شامل (اسم، صورة، لقب، خروج، سبام)",
        eventType: ["log:thread-name", "log:user-nickname", "log:unsubscribe", "log:thread-image", "message"]
    },

    onStart: async function ({ event, api }) {
        const { threadID, logMessageType, logMessageData, author, type, body } = event;
        const botID = api.getCurrentUserID();
        const threadData = getThreadData(threadID);
        const settings = threadData?.settings?.antiSettings || {};

        if (type !== "event") return;

        // 1️⃣ حماية اسم المجموعة (إرجاع الاسم القديم)
        if (logMessageType === "log:thread-name") {
            if (author === botID) return;
            const oldName = logMessageData.oldName;
            if (settings.antiChangeGroupName && oldName) {
                await api.setTitle(oldName, threadID);
                return api.sendMessage(`تغيير اسم المجموعة غير مسموح به، تمت إعادته لـ: "${oldName}"`, threadID);
            }
        }

        // 2️⃣ حماية صورة المجموعة
        if (logMessageType === "log:thread-image") {
            if (author === botID) return;
            if (settings.antiChangeGroupImage) {
                // ملاحظة: استرجاع الصورة برابط صعب برمجياً بدون تخزين مسبق، لذا نكتفي بالمنع أو التنبيه
                return api.sendMessage(`تغيير صورة المجموعة غير مسموح به في إعدادات الحماية!`, threadID);
            }
        }

        // 3️⃣ حماية الكنيات (الألقاب) - حل مشكلة المسح
        if (logMessageType === "log:user-nickname") {
            if (author === botID) return;
            const targetID = logMessageData.participantID || author;
            const newNickname = logMessageData.nickname || "";
            
            const nicknameCache = threadData.nicknameCache || {};
            const oldNickname = nicknameCache[targetID] || "";

            if (settings.antiChangeNickname) {
                // إرجاع القديم بدل المسح
                api.changeNickname(oldNickname, threadID, targetID);
                return api.sendMessage(`تغيير اللقب ممنوع، تمت إعادة لقبك القديم: "${oldNickname || 'بدون لقب'}"`, threadID);
            } else {
                // تحديث الكاش لو الحماية مطفية
                if (!threadData.nicknameCache) threadData.nicknameCache = {};
                threadData.nicknameCache[targetID] = newNickname;
                updateThreadData(threadID, { nicknameCache: threadData.nicknameCache });
            }
        }

        // 4️⃣ منع الخروج (Anti-Out)
        if (logMessageType === "log:unsubscribe") {
            const leftID = logMessageData.leftParticipantFbId;
            if (!leftID || leftID === botID) return;

            if (settings.antiOut) {
                api.addUserToGroup(leftID, threadID, (err) => {
                    if (err) return api.sendMessage(`العب ده قافل الإضافة، ما قدرتا أرجعه 😤`, threadID);
                    return api.sendMessage(`مارق بكرامتك وين؟ بل بس هنا 🗿🔨`, threadID);
                });
            }
        }

        // 5️⃣ مكافحة السبام (Anti-Spam) - إذا كان مفعل في الإعدادات
        if (settings.antiSpam && type === "message" && author !== botID) {
            // منطق بسيط للسبام (يمكن تطويره حسب الحاجة)
            if (!global.antiSpam) global.antiSpam = new Map();
            const userSpam = global.antiSpam.get(author) || { count: 0, time: Date.now() };
            
            if (Date.now() - userSpam.time < 3000) { // 3 ثواني
                userSpam.count++;
            } else {
                userSpam.count = 1;
                userSpam.time = Date.now();
            }

            if (userSpam.count > 5) { // أكثر من 5 رسائل في 3 ثواني
                api.removeUserFromGroup(author, threadID);
                return api.sendMessage(`تم طردك بسبب السبام (إغراق الشات) 🚯`, threadID);
            }
            global.antiSpam.set(author, userSpam);
        }

        // 6️⃣ الإشعارات (Notify Change)
        if (settings.notifyChange && author !== botID) {
            // هنا ممكن ترسل إشعارات عن أي تغيير يحصل لو الحماية مطفية
        }
    }
};
