const util = require("util");

module.exports = {
  config: {
    name: "ايف",
    version: "2.0",
    author: " x AbuUbaida",
    countDown: 0,
    prefix: true,
    category: "owner",
    guide: "{pn} <code>"
  },

  onStart: async function ({ api, event, args }) {
    const OWNER_ID = "61588108307572"; // عدلها لو داير

    if (event.senderID !== OWNER_ID)
      return api.sendMessage("❌ الأمر دا حق المطور بس.", event.threadID, event.messageID);

    const code = args.join(" ");
    if (!code)
      return api.sendMessage("⚠️ اكتب كود بعد الأمر.", event.threadID, event.messageID);

    try {
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

      let output = typeof result === "string"
        ? result
        : util.inspect(result, { depth: 2 });

      if (!output) output = "✅ Done";

      // تقسيم لو طويل
      const max = 1900;
      for (let i = 0; i < output.length; i += max) {
        await api.sendMessage(
          output.slice(i, i + max),
          event.threadID
        );
      }

    } catch (err) {
      api.sendMessage("❌ Error:\n" + err, event.threadID, event.messageID);
    }
  }
};
