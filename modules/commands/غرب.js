module.exports = {
    config: {
        name: "غرب",
        version: "1.0",
        author: "Kenji Agent",
        countDown: 5,
        description: "عرض ايدي المجموعة",
        category: "أدوات"
    },
    onStart: async function ({ api, event }) {
        api.sendMessage(`🆔 ايدي المجموعة: ${event.threadID}`, event.threadID);
    }
};
