const util = require("util");

module.exports = {
  config: {
    name: "ايف",
    version: "2.8",
    author: "x AbuUbaida",
    countDown: 0,
    prefix: true,
    category: "owner",
    guide: "{pn} <code>"
  },

  onStart: async function ({ api, event, args }) {
    const OWNER_ID = "61588108307572"; 

    // لو العضو ما إنت، اتفاعل على رسالته بـ 🚯 واسكت
    if (event.senderID !== OWNER_ID) {
      return api.setMessageReaction("🚯", event.messageID, () => {}, true);
    }

    const code = args.join(" ");
    if (!code)
      return api.sendMessage("يس", event.threadID, event.messageID);

    try {
      // تفاعل ليك إنت (الملك) بـ ✅ عشان تعرف إن الكود بدأ يتنفذ
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

      const result = await new AsyncFunction(
        "api",
        "event",
        "require",
        "process",
        "console",
        "global",
        `
        try {
          ${code}
        } catch (e) {
          return e.toString();
        }
        `
      )(api, event, require, process, console, global);

      let output;
      if (result === undefined) {
          output =" ";
      } else if (typeof result === "string") {
          output = result;
      } else {
          output = util.inspect(result, { depth: 2 });
      }

      if (output === "") output = "";

      const max = 1900;
      for (let i = 0; i < output.length; i += max) {
        await api.sendMessage(
          "\n" + output.slice(i, i + max),
          event.threadID
        );
      }
      
      // تغيير التفاعل لـ ✅ بعد النجاح
      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (err) {
      api.sendMessage("\n" + err.message, event.threadID, event.messageID);
      api.setMessageReaction("", event.messageID, () => {}, true);
    }
  }
};
