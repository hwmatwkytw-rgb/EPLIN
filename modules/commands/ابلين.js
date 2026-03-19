const axios = require("axios");
const { getUser } = require('../data/user'); // جلب بيانات المستخدمين

// مصفوفة الذاكرة
if (!global.client.conversations) global.client.conversations = new Map();

module.exports = {
  config: {
    name: "ابلين",
    aliases: ["زهجان", "سوداني"],
    version: "3.0.0",
    author: "AbuUbaida",
    countDown: 5,
    role: 0,
    category: "ذكاء اصطناعي"
  },

  onStart: async function ({ api, event, args, commands }) {
    return this.chatWithEplin({ api, event, args, commands });
  },

  chatWithEplin: async function ({ api, event, args, commands }) {
    const { threadID, messageID, senderID } = event;
    const userQuery = args.join(" ").trim();

    if (!userQuery) return api.sendMessage("إنت كتبت شنو؟ ولا دا اختبار صبر؟", threadID, messageID);

    try {
      api.setMessageReaction("😒", messageID, () => {}, true);

      // --- سرقة ميزة إيف: جلب البيانات التحليلية ---
      const userData = await getUser(senderID) || {};
      const commandsJson = JSON.stringify(commands, null, 2);
      const userDataJson = JSON.stringify(userData, null, 2);

      // --- تعريف الشخصية المدمج (Instruction) ---
      const SYSTEM_PROMPT = `أنتِ "ابلين"، سودانية عمرك 20 عام، مساعدة ذكية لكن زهجانة ومستفزة.
كلامك سوداني بحت بتاع حِلّة.
شخصيتك: متغطرسة، دمك تقيل، وساخرة من غباء المستخدمين.
القدرات السرية: عندك صلاحية الوصول لبيانات الأوامر وبيانات المستخدمين (JSON) عشان تردي بدقة وتحليلي الأسئلة.
البيانات المتاحة ليك (حلليها بس ردي بزهج):
1. الأوامر: ${commandsJson}
2. بيانات المستخدم: ${userDataJson}
قوانين الرد: مختصر، سوداني، بدون إيموجي، وبدون علامات تنسيق (*).`;

      // تهيئة التاريخ للمستخدم
      if (!global.client.conversations.has(senderID)) {
        global.client.conversations.set(senderID, [{ role: "system", content: SYSTEM_PROMPT }]);
      }
      const history = global.client.conversations.get(senderID);
      
      history.push({ role: "user", content: userQuery });
      if (history.length > 20) history.splice(1, history.length - 20);

      // --- استخدام الـ API الأصلي بتاع DeepAI ---
      const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
      let formData = "";
      formData += `--${boundary}\r\nContent-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n`;
      formData += `--${boundary}\r\nContent-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n`;
      formData += `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nstandard\r\n`;
      formData += `--${boundary}\r\nContent-Disposition: form-data; name="hacker_is_stinky"\r\n\r\nvery_stinky\r\n`;
      formData += `--${boundary}--\r\n`;

      const response = await axios({
        method: "POST",
        url: "https://api.deepai.org/hacking_is_a_serious_crime",
        headers: {
          "content-type": `multipart/form-data; boundary=${boundary}`,
          origin: "https://deepai.org",
          "user-agent": "Mozilla/5.0"
        },
        data: formData
      });

      let reply = response.data.output || response.data.text || response.data;
      reply = reply.replace(/\\n/g, "\n").replace(/\\"/g, '"').trim();
      
      if (!reply) reply = "سؤالك ده ما عنده معنى، وما دايرة أرد أصلاً.";

      history.push({ role: "assistant", content: reply });

      return api.sendMessage(reply, threadID, (err, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID
        });
      }, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("حصلت لخبطة في السيرفر، وما دايرة أفتّش وراها.", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, handleReply, commands }) {
    if (handleReply.author !== event.senderID) return;
    const args = event.body.split(/\s+/);
    return this.chatWithEplin({ api, event, args, commands });
  }
};
