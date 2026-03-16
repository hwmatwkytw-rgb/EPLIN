const util = require("util");

module.exports = {
  config: {
    name: "ايف",
    version: "4.0",
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
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      // هنا السر: بنغلف الكود بتاعك جوه وظيفة async تلقائياً عشان await تشتغل
      const wrappedCode = `(async () => { 
        ${code} 
      })()`;

      let result = await eval(wrappedCode);

      let output;
      if (result === undefined) {
        output = "";
      } else {
        output = typeof result === "string" ? result : util.inspect(result, { depth: 2 });
      }

      if (output === "undefined") output =" ";

      await api.sendMessage("\n" + output, event.threadID, event.messageID);
      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (err) {
      api.sendMessage("\n" + err.message, event.threadID, event.messageID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
