const axios = require("axios");
const { getUser } = require('../data/user'); 

module.exports = {
  config: {
    name: "ابلين",
    aliases: ["زهجان", "سوداني"],
    version: "3.5.0",
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
      // 1. التفاعل عشان تعرف إن البوت استلم الأمر
      api.setMessageReaction("😒", messageID, () => {}, true);

      // 2. سرقة ميزات "إيف": جلب البيانات التحليلية
      const userData = await getUser(senderID) || {};
      const commandsJson = JSON.stringify(commands, null, 2);
      const userDataJson = JSON.stringify(userData, null, 2);

      // 3. تعريف الشخصية "ابلين" (بميزات إيف)
      const SYSTEM_PROMPT = `أنتِ "ابلين"، سودانية عمرك 20 عام. مساعدة ذكية لكن زهجانة ومستفزة. كلامك سوداني بحت. شخصيتك متغطرسة وساخرة. حللي البيانات دي وردي بزهج: الأوامر: ${commandsJson}، بيانات المستخدم: ${userDataJson}. الرد مختصر وسوداني وبدون علامات تنسيق.`;

      // 4. تهيئة الذاكرة في الـ global عشان ما تضيع
      if (!global.client.conversations) global.client.conversations = new Map();
      if (!global.client.conversations.has(senderID)) {
        global.client.conversations.set(senderID, [{ role: "system", content: SYSTEM_PROMPT }]);
      }
      const history = global.client.conversations.get(senderID);
      
      history.push({ role: "user", content: userQuery });
      if (history.length > 20) history.splice(1, history.length - 20);

      // 5. استخدام الـ API بتاع DeepAI (نفس كود كيفن الشغال)
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
          "origin": "https://deepai.org",
          "user-agent": "Mozilla/5.0"
        },
        data: formData
      });

      let reply = response.data.output || response.data.text || (typeof response.data === 'string' ? response.data : "");
      reply = reply.replace(/\\n/g, "\n").replace(/\\"/g, '"').trim();
      
      if (!reply) reply = "سؤالك ده ما عنده معنى، وما دايرة أرد أصلاً.";

      history.push({ role: "assistant", content: reply });

      // 6. الإرسال مع تفعيل الـ Reply
      return api.sendMessage(reply, threadID, (err, info) => {
        if (!global.client.handleReply) global.client.handleReply = [];
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID
        });
      }, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("في حاجة لخبطت في الـ API، أقفل السكة دي.", threadID, messageID);
    }
  },

  // 7. معالج الردود عشان يكمل المحادثة
  onReply: async function ({ api, event, handleReply, commands }) {
    if (handleReply.author !== event.senderID) return;
    const args = event.body.split(/\s+/);
    return this.chatWithEplin({ api, event, args, commands });
  }
};
