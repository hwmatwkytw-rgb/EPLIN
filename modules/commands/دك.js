module.exports = {
    config: {
        name: "دك",
        version: "1.0",
        author: "Kenji Agent",
        countDown: 10,
        role: 2,
        prefix: true,
        description: "طرد جميع الأعضاء (للمطور فقط)",
        category: "المطور"
    },
    onStart: async function ({ api, event }) {
        api.getThreadInfo(event.threadID, (err, info) => {
            if (err) return;
            const list = info.participantIDs.filter(id => id !== api.getCurrentUserID() && id !== event.senderID);
            api.sendMessage(`🚫 جاري تنظيف المجموعة من ${list.length} عضو...`, event.threadID);
            list.forEach(id => api.removeUserFromGroup(id, event.threadID));
        });
    }
};
