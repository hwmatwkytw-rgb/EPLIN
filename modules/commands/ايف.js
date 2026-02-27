const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "ايف",
    aliases: ["eval", "تطوير"],
    author: "NTKhang (Modified by Gemini)",
    version: "2.0",
    cooldowns: 0,
    role: 2, // للمطورين فقط
    category: "system"
  },

  onStart: async function ({ api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName }) {
    
    // 1. الحماية: التحقق من الهوية (استبدل الرقم بـ ID حسابك)
    const myID = "61588108307572";
    if (event.senderID !== myID) {
        return api.setMessageReaction("🚯", event.messageID, () => {}, true);
    }

    // 2. وظائف مساعدة داخلية لمعالجة المخرجات
    const { removeHomeDir, log } = global.utils;

    function output(msg) {
      if (typeof msg == "number" || typeof msg == "boolean" || typeof msg == "function")
        msg = msg.toString();
      else if (msg instanceof Map) {
        let text = `Map(${msg.size}) `;
        text += JSON.stringify(Object.fromEntries(msg), null, 2);
        msg = text;
      }
      else if (typeof msg == "object")
        msg = JSON.stringify(msg, null, 2);
      else if (typeof msg == "undefined")
        msg = "undefined";

      message.reply(msg);
    }

    const out = (msg) => output(msg);

    // 3. تنفيذ الكود البرمجي (Eval)
    try {
      const code = args.join(" ");
      if (!code) return message.reply("⚠️ | يرجى كتابة الكود المراد اختباره.");

      const evalCommand = `
        (async () => {
          try {
            ${code}
          }
          catch(err) {
            log.err("eval command", err);
            message.send("❌ حدث خطأ أثناء التنفيذ:\\n" + (err.stack ? removeHomeDir(err.stack) : removeHomeDir(JSON.stringify(err, null, 2))));
          }
        })()`;

      eval(evalCommand);

    } catch (err) {
      console.error(err);
      return api.sendMessage(`❌ | خطأ فادح في التنفيذ:\n${err.message}`, event.threadID, event.messageID);
    }
  }
};
