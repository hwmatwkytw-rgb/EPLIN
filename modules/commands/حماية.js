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

    onStart: async function({ api, event }) {
        const threadID = event.threadID;

        try {
            const groupInfo = await api.getThreadInfo(threadID);
            const groupName = groupInfo.threadName;
            const groupPic = groupInfo.imageSrc;

            // حفظ البيانات في الذاكرة (في البوت)
            api.storage = api.storage || {};
            api.storage[threadID] = { groupName, groupPic };

            api.sendMessage("✅ تم تفعيل حماية المجموعة بالكامل!", threadID);

        } catch (err) {
            console.error(err);
            api.sendMessage("❌ حدث خطأ أثناء تفعيل الحماية!", threadID);
        }
    },

    // التعامل مع الأحداث على مستوى البوت
    onEvent: async function({ api, event }) {
        const threadID = event.threadID;
        const storage = api.storage?.[threadID];

        if (!storage) return;

        // منع تغيير الاسم
        if (event.type === "change_thread_name") {
            try {
                await api.setThreadName(storage.groupName, threadID);
                api.sendMessage("🚫 ممنوع تغيير اسم المجموعة!", threadID);
            } catch {}
        }

        // منع تغيير الصورة
        if (event.type === "change_thread_image") {
            try {
                await api.changeThreadImage(storage.groupPic, threadID);
                api.sendMessage("🚫 ممنوع تغيير صورة المجموعة!", threadID);
            } catch {}
        }

        // منع المغادرة
        if (event.type === "user_left") {
            try {
                await api.addUserToGroup(event.userID, threadID);
                api.sendMessage("⚠️ ممنوع المغادرة أو الطرد!", threadID);
            } catch {}
        }

        // منع تغيير الكنية
        if (event.type === "change_nickname") {
            try {
                await api.changeNickname(event.userID, event.oldNickname, threadID);
                api.sendMessage("🚫 ممنوع تغيير الكنيات!", threadID);
            } catch {}
        }
    }
};
