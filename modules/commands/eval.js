module.exports = {
  config: {
    name: "eval",
    version: "2.0",
    author: "Kenji Cloud",
    countDown: 5,
    prefix: true,
    description: "تنفيذ كود JavaScript مع دعم await و global variables (للمطور فقط)",
    category: "owner"
  },

  onStart: async function ({ api, event, args }) {

    const OWNER_ID = "61588108307572"; // عدّل لرقمك
    if (event.senderID !== OWNER_ID) return;
    if (!args[0]) return;

    try {
      // حوّل الكود ل async function مؤقتة
      // ومرّر أي متغيرات globals لو حبيت
      let result = await (async (globals) => {
        const { Users, global } = globals; // أي متغيرات خارجية تحب تمررها
        return eval(args.join(" "));
      })({
        Users: global.Users, // لازم يكون مخزن Users في global
        global: global
      });

      if (typeof result !== "string") {
        result = require("util").inspect(result, { depth: 1 });
      }

      // إرسال النتيجة
      return api.sendMessage(result, event.threadID, event.messageID);

    } catch (err) {
      return api.sendMessage(err.message, event.threadID, event.messageID);
    }
  }
};
