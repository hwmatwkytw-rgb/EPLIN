const util = require("util");

module.exports = {
  config: {
    name: "ايف",
    version: "3.0",
    author: "x AbuUbaida",
    countDown: 0,
    prefix: true,
    category: "owner",
    guide: "{pn} <code>"
  },

  onStart: async function ({ api, event, args }) {
    const OWNER_ID = "61588108307572"; 

    if (event.senderID !== OWNER_ID) {
      return api.setMessageReaction("🚯", event.messageID, () => {}, true);
    }

    const code = args.join(" ");
    if (!code) return api.sendMessage("يس", event.threadID, event.messageID);

    try {
      // تفاعل البدء
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      // تنفيذ مباشر وبسيط
      let result = await eval(code);

      let output;
      if (result === undefined) {
        output = "";
      } else {
        output = typeof result === "string" ? result : util.inspect(result, { depth: 2 });
      }

      if (output === "undefined") output = "";

      await api.sendMessage("\n" + output, event.threadID, event.messageID);
      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (err) {
      // هنا بنطبع الخطأ الحقيقي عشان نعرف المشكلة وين
      api.sendMessage("\n" + err.message, event.threadID, event.messageID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
