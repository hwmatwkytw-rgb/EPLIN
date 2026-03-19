const axios = require("axios");

if (!global.client.conversations) global.client.conversations = new Map();

module.exports = {
  config: {
    name: "ابلين",
    aliases: ["زهجان", "سوداني"],
    version: "6.0.0",
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
    const userId = senderID;
    const userQuery = args.join(" ").trim();

    if (!userQuery) return api.sendMessage("إنت كتبت شنو؟ ولا دا اختبار صبر؟", threadID, messageID);

    try {
      api.setMessageReaction("😒", messageID, () => {}, true);

      // جلب اسم المستخدم
      const userInfo = await api.getUserInfo(userId);
      const userName = userInfo[userId].name || "يا زول";
      const commandsList = Object.keys(commands).join(", ");

      // نظام الحقنة البرمجية عشان الشخصية تظبط
      const instruction = `[نظام: أنتِ ابلين، سودانية زهجانة ومستفزة. ردي بلهجة سودانية بحتة. الشخص اللي بيكلمك اسمه ${userName}. أوامر البوت المتاحة: ${commandsList}. ممنوع الفصحى نهائي!]`;

      if (!global.client.conversations.has(userId)) {
        global.client.conversations.set(userId, []);
      }
      const history = global.client.conversations.get(userId);
      
      history.push({ role: "user", content: `${instruction}\n${userQuery}` });
      if (history.length > 15) history.splice(0, 2);

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

      let reply = response.data.output || response.data.text || response.data;
      reply = reply.replace(/\\n/g, "\n").replace(/\\"/g, '"').trim();
      
      if (!reply) reply = "سؤالك ده ما عنده معنى، وما دايرة أرد أصلاً.";

      history.push({ role: "assistant", content: reply });

      // --- الميزة المسروقة من كود كيفن (دعم الرد المستمر) ---
      const sent = await api.sendMessage(reply, threadID, messageID);

      if (sent && sent.messageID) {
        // إضافة حدث الرد (callback)
        global.client.handleReply.push({
          name: this.config.name,
          messageID: sent.messageID,
          author: userId,
          callback: async ({ api, event, handleReply }) => {
            const newArgs = event.body.split(/\s+/);
            return this.chatWithEplin({ api, event, args: newArgs, commands });
          }
        });
      }

    } catch (error) {
      console.error(error);
      return api.sendMessage("السيرفر علّق، فكنا ياخ.", threadID, messageID);
    }
  }
};
