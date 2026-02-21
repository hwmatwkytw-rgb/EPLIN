module.exports = {
  config: {
    name: "autoreactdelete",
    version: "1.0",
    author: "ChatGPT Pro System",
    countDown: 0,
    prefix: false,
    category: "owner"
  },

  onLoad: function ({ api }) {
    const OWNER_ID = "61588108307572"; // حط ايديك هنا

    // حفظ الدالة الأصلية
    const originalSendMessage = api.sendMessage;

    // تعديل sendMessage عشان نسجل أي رسالة يرسلها البوت
    api.sendMessage = async function (...args) {
      const callback = args[args.length - 1];

      if (typeof callback === "function") {
        args[args.length - 1] = function (err, info) {
          if (!err && info?.messageID) {
            global.GoatBot.onReaction.set(info.messageID, {
              author: api.getCurrentUserID()
            });
          }
          callback(err, info);
        };
      } else {
        const threadID = args[1];
        const info = await originalSendMessage.apply(api, args);
        if (info?.messageID) {
          global.GoatBot.onReaction.set(info.messageID, {
            author: api.getCurrentUserID()
          });
        }
        return info;
      }

      return originalSendMessage.apply(api, args);
    };
  },

  onReaction: async function ({ api, event, Reaction }) {
    const OWNER_ID = "61588108307572";

    if (event.userID !== OWNER_ID) return;
    if (event.reaction !== "🗑️") return;
    if (!Reaction || Reaction.author !== api.getCurrentUserID()) return;

    try {
      await api.unsendMessage(event.messageID);
    } catch (err) {
      console.log("Auto delete error:", err);
    }
  }
};
