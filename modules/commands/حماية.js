module.exports = {
    config: {
        name: "حماية",
        version: "1.0",
        author: "ابو عبيده علي",
        countDown: 5,
        role: 1,
        shortDescription: "حماية كاملة للمجموعة",
        category: "الإدارة"
    },

    onStart: async function ({ api, event, utils }) {

        const threadID = event.threadID;

        // حفظ اسم وصورة المجموعة الحالية
        const groupInfo = await api.getThreadInfo(threadID);
        const groupName = groupInfo.threadName;
        const groupPic = groupInfo.imageSrc;

        // حدث تغيير الاسم
        api.on("changeThreadName", async (info) => {
            if (info.threadID === threadID) {
                await api.setThreadName(threadID, groupName);
                api.sendMessage("🚫 ممنوع تغيير اسم المجموعة!", threadID);
            }
        });

        // حدث تغيير صورة المجموعة
        api.on("changeThreadImage", async (info) => {
            if (info.threadID === threadID) {
                await api.changeThreadImage(groupPic, threadID);
                api.sendMessage("🚫 ممنوع تغيير صورة المجموعة!", threadID);
            }
        });

        // حدث تغيير الكنيات
        api.on("changeNickname", async (info) => {
            if (info.threadID === threadID) {
                await api.changeNickname(info.userID, info.nickName, threadID);
                api.sendMessage("🚫 ممنوع تغيير الكنيات!", threadID);
            }
        });

        // منع المغادرة
        api.on("userLeft", async (info) => {
            if (info.threadID === threadID) {
                api.addUserToGroup(info.userID, threadID);
                api.sendMessage("⚠️ ممنوع المغادرة أو الطرد!", threadID);
            }
        });

        api.sendMessage("✅ تم تفعيل حماية المجموعة بالكامل!", threadID);
    }
};
