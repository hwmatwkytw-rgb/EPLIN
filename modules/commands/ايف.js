const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "ايف",
    version: "1.0",
    author: "Kaguya-Project",
    countDown: 0,
    role: 2, // للمطورين فقط
    category: "owner",
    guide: "{pn} [كود جافا سكريبت]"
  },

  onStart: async function ({ api, event, args, Users, Threads, Currencies }) {
    const { threadID, messageID } = event;
    try {
      const code = args.join(" ");
      const evaled = eval(code);
      return api.sendMessage(JSON.stringify(evaled, null, 2), threadID, messageID);
    } catch (e) {
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }
};
