const axios = require("axios");

module.exports = {
  config: {
    name: "عدل",
    version: "6.0",
    author: "AbuUbaida",
    countDown: 10,
    role: 0,
    category: "ذكاء اصطناعي",
    guide: "{pn} [وصف الصورة]"
  },

  onStart: async function ({ api, event, args }) {
    let prompt = args.join(" ");
    
    // دعم الرد على الصور (SREF) زي كودك الأصلي
    if (event.type === "message_reply" && event.messageReply.attachments?.[0]?.type === "photo") {
      const urlImg = event.messageReply.attachments[0].url;
      prompt = `${prompt} --رنس ${urlImg}`;
    }

    if (!prompt) return api.sendMessage("⚠️ | يا ملك، أكتب وصف للصورة عشان ابلين ترسمها!", event.threadID, event.messageID);

    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      // استخدام Pollinations لأنه "طلقة" في الاستجابة
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;

      const response = await axios.get(imageUrl, { responseType: "stream" });

      const info = await api.sendMessage({
        body: `✅ | تم الانتهاء بنجاح ✨\n\nالوصف: ${prompt}\n\nرد بـ "تحسين" عشان ابلين تطلع ليك نسخة تانية لنفس الوصف!`,
        attachment: response.data
      }, event.threadID, event.messageID);

      // تسجيل الرد في نظام ابلين
      global.client.handleReply.push({
        name: "ميدجورني",
        messageID: info.messageID,
        author: event.senderID,
        prompt: prompt
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ | السيرفر مضغوط حالياً، جرب تاني يا بطل.", event.threadID, event.messageID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  },

  onReply: async function ({ api, event, handleReply }) {
    if (event.senderID !== handleReply.author) return;
    if (event.body.toLowerCase() !== "تحسين") return;

    try {
      api.setMessageReaction("⚙️", event.messageID, () => {}, true);
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(handleReply.prompt)}?width=1024&height=1024&seed=${seed}&nologo=true`;

      const response = await axios.get(imageUrl, { responseType: "stream" });

      await api.sendMessage({
        body: `🔄 | تم توليد نسخة ثانية لنفس الوصف:\n"${handleReply.prompt}"`,
        attachment: response.data
      }, event.threadID, event.messageID);

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (e) {
      api.sendMessage("❌ | فشل التحسين، السيرفر تعبان.", event.threadID);
    }
  }
};
