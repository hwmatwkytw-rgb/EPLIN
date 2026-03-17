const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: 'عدل',
    aliases: ['edit', 'eplin'],
    version: '1.0.0',
    author: 'AbuUbaida',
    description: 'تعديل الصور عبر API إبلين الآمن',
    countDown: 5,
    prefix: true,
    category: 'ai',
    adminOnly: false 
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    const developerID = "61588108307572"; 

    // السماح للمطور فقط (اختياري، يمكنك حذفه لجعل الجميع يستخدمه)
    if (senderID !== developerID) {
      return api.setMessageReaction("🚫", messageID);
    }

    const prompt = args.join(" ");
    let imageUrl;

    // الحصول على رابط الصورة في حال الرد على صورة
    if (event.type === "message_reply") {
      const attachment = event.messageReply.attachments[0];
      if (attachment && (attachment.type === "photo" || attachment.type === "image")) {
        imageUrl = attachment.url;
      }
    }

    if (!prompt || !imageUrl) {
      return api.sendMessage('⚠️ | يا ملك، يرجى الرد على صورة وكتابة الوصف الجديد لها!', threadID, messageID);
    }

    api.setMessageReaction("🎨", messageID);
    const waitingMsg = await api.sendMessage('⏳ | جاري تعديل الصورة عبر سيرفر Eplin الخاص...', threadID, messageID);

    try {
      // استدعاء الـ API الخاص بك (رابط موقعك الجديد)
      const myApiUrl = `https://sudan-pot-65n2.onrender.com/api/edit?prompt=${encodeURIComponent(prompt)}&imageUrl=${encodeURIComponent(imageUrl)}`;
      
      const res = await axios.get(myApiUrl);

      if (res.data.status === "success") {
        const finalImageUrl = res.data.resultUrl;
        const cachePath = path.join(__dirname, "cache", `eplin_${Date.now()}.png`);

        // تحميل الصورة الناتجة لإرسالها
        const imageRes = await axios({ url: finalImageUrl, responseType: 'stream' });
        const writer = fs.createWriteStream(cachePath);
        imageRes.data.pipe(writer);

        writer.on('finish', async () => {
          await api.sendMessage({
            body: `✅ تمت المعالجة بنجاح عبر سيرفرك!\n📝 الوصف: ${prompt}`,
            attachment: fs.createReadStream(cachePath)
          }, threadID, () => {
            fs.unlinkSync(cachePath);
            api.unsendMessage(waitingMsg.messageID);
          }, messageID);
          api.setMessageReaction("✨", messageID);
        });
      } else {
        // في حال تم حجب الكلمة من قبل موقعك
        api.sendMessage(`🚫 | عذراً: ${res.data.message}`, threadID, messageID);
      }

    } catch (error) {
      console.error(error);
      api.sendMessage('❌ | فشل الاتصال بسيرفر Eplin، تأكد من استقرار ريندر.', threadID, messageID);
    }
  },
};
