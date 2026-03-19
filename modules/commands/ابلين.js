const axios = require("axios");

if (!global.client.conversations) global.client.conversations = new Map();

module.exports = {
  config: {
    name: "ابلين",
    aliases: ["زهجان", "سوداني"],
    version: "7.0.0",
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

      const userInfo = await api.getUserInfo(senderID);
      const userName = userInfo[senderID].name || "يا زول";
      const commandsList = Object.keys(commands).join(", ");

      const instruction = `[نظام: أنتِ ابلين، سودانية زهجانة ومستفزة. ردي بلهجة سودانية بحتة. الشخص اللي بيكلمك اسمه ${userName}. أوامر البوت: ${commandsList}. ممنوع الفصحى!]`;

      if (!global.client.conversations.has(senderID)) {
        global.client.conversations.set(senderID, [{ role: "system", content: instruction }]);
      }
      const history = global.client.conversations.get(senderID);
      
      history.push({ role: "user", content: userQuery });
      if (history.length > 15) history.splice(1, 2); // الحفاظ على السيستم برومبت وحذف القديم

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
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        data: formData
      });

      let reply = response.data.output || response.data.text || response.data;
      if (typeof reply !== "string") reply = "سؤالك ده ما عنده معنى، وما دايرة أرد أصلاً.";
      
      reply = reply.replace(/\\n/g, "\n").replace(/\\"/g, '"').trim();
      history.push({ role: "assistant", content: reply });

      return api.sendMessage(reply, threadID, (err, info) => {
        if (err) return;
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          commands: commands // بنمرر الأوامر عشان الـ onReply يشوفها
        });
      }, messageID);

    } catch (error) {
      console.error(error.message);
      return api.sendMessage("السيرفر علّق، فكنا ياخ.", threadID, messageID);
    }
  },

  // دالة الـ onReply المنفصلة عشان نظام"ريلاي" يشتغل صح
  onReply: async function ({ api, event, handleReply }) {
    if (handleReply.author !== event.senderID) return;
    const args = event.body.split(/\s+/);
    return this.chatWithEplin({ api, event, args, commands: handleReply.commands });
  }
};
