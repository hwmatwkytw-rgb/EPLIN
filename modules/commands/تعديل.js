const axios = require('axios');

module.exports = {
  config: {
    name: "تعديل",
    version: "1.0",
    author: "سينكو",
    countDown: 20,
    prefix: true,
    category: "AI",
    description: "إعادة رسم صورتك بـ Stable Diffusion (رد على صورة)"
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageReply } = event;
    const prompt = args.join(" ");

    if (!messageReply || !messageReply.attachments[0]) 
      return api.sendMessage("──❃ ┇ رد على صورة لكي أعيد رسمها", threadID);

    api.sendMessage("❃ ┇ جاري إعادة تشكيل الصورة... 🪄", threadID);

    try {
      const imgUrl = encodeURIComponent(messageReply.attachments[0].url);
      const resUrl = `https://api.paxsenix.biz.id/ai/img2img?url=${imgUrl}&prompt=${encodeURIComponent(prompt || "masterpiece, high quality")}`;
      
      api.sendMessage({
        body: " ❈ \n     ✨ تـم إعـادة الـرسـم بـنـجـاح\n❊",
        attachment: await axios.get(resUrl, { responseType: 'stream' }).then(r => r.data)
      }, threadID);
    } catch (e) { api.sendMessage("❃ ┇ فشل معالجة الصورة"، threadID); }
  }
};
