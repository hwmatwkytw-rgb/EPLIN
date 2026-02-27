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
    const { threadID, messageID, senderID } = event;
    
    // أيدي المطور الخاص بك
    const DEVELOPER_ID = "61588108307572";

    // التحقق من الهوية: إذا لم يكن المطور، يتفاعل بـ 🚯 ويخرج
    if (senderID !== DEVELOPER_ID) {
      return api.setMessageReaction("🚯", messageID, (err) => {}, true);
    }

    try {
      const code = args.join(" ");
      if (!code) return api.sendMessage("⚠️ يرجى إدخال كود لتنفيذه.", threadID, messageID);

      const evaled = eval(code);
      
      // تحويل النتيجة لنص لإرسالها
      let response = typeof evaled !== "string" ? JSON.stringify(evaled, null, 2) : evaled;
      
      return api.sendMessage(response || "تم التنفيذ (لا توجد مخرجات).", threadID, messageID);
    } catch (e) {
      return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
    }
  }
};
