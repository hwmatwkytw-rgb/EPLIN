module.exports = {
  config: {
    name: "eval",
    version: "1.2",
    author: "Kenji Cloud",
    countDown: 5,
    prefix: true,
    description: "تنفيذ كود JavaScript (للمطور فقط)",
    category: "owner"
  },

  onStart: async function ({ api, event, args }) {

    const OWNER_ID = "61588108307572"; // عدّل لرقمك
    if (event.senderID !== OWNER_ID) return;
    if (!args[0]) return;

    try {
      // حوّل الكود ل async function مؤقتة
      let result = await (async () => { 
        return eval(args.join(" ")); 
      })();

      if (typeof result !== "string") {
        result = require("util").inspect(result, { depth: 0 });
      }

      return api.sendMessage(result, event.threadID, event.messageID);

    } catch (err) {
      return api.sendMessage(err.message, event.threadID, event.messageID);
    }
  }
};
