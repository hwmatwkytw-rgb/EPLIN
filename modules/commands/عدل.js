const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: 'عدل', // تأكد أن الاسم يطابق ما تكتبه في الشات
    aliases: ['edit', 'eplin'],
    version: '1.0.5',
    author: 'AbuUbaida',
    description: 'تعديل الصور عبر API إبلين الآمن',
    countDown: 5,
    prefix: true,
    category: 'ai',
    adminOnly: false 
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const prompt = args.join(" ");
    let imageUrl;

    if (event.type === "message_reply") {
      const attachment = event.messageReply.attachments[0];
      if (attachment && (attachment.type === "photo" || attachment.type === "image")) {
        imageUrl = attachment.url;
      }
    }

    if (!prompt || !imageUrl) {
      return api.sendMessage('⚠️ | يا ملك، يرجى الرد على صورة وكتابة الوصف!', threadID, messageID);
    }

    api.setMessageReaction("⏳", messageID);
    const waitingMsg = await api.sendMessage('🎨 | جاري معالجة الصورة.. قد يستغرق الأمر دقيقة في المرة الأولى..', threadID, messageID);

    try {
      // رابط سيرفرك الشخصي
      const myApiUrl = `https://sudan-pot-65n2.onrender.com/api/edit?prompt=${encodeURIComponent(prompt)}&imageUrl=${encodeURIComponent(imageUrl)}`;
      
      // زيادة وقت الانتظار لـ 200 ثانية لأن ريندر المجاني بطيء
      const res = await axios.get(myApiUrl, { timeout: 200000 });

      if (res.data.status === "success") {
        const finalImageUrl = res.data.resultUrl;
        const cachePath = path.join(__dirname, "cache", `eplin_${Date.now()}.png`);

        const imageRes = await axios({ url: finalImageUrl, responseType: 'stream', timeout: 200000 });
        const writer = fs.createWriteStream(cachePath);
        imageRes.data.pipe(writer);

        writer.on('finish', async () => {
          await api.sendMessage({
            body: `✨ تم التعديل بنجاح يا ملك!\n📝 الوصف: ${prompt}`,
            attachment: fs.createReadStream(cachePath)
          }, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            // نحذف رسالة الانتظار فقط عند النجاح
            api.unsendMessage(waitingMsg.messageID);
          }, messageID);
          api.setMessageReaction("✅", messageID);
        });
      } else {
        api.sendMessage(`🚫 | عذراً: ${res.data.message}`, threadID, messageID);
        api.unsendMessage(waitingMsg.messageID);
      }

    } catch (error) {
      console.error(error);
      // إذا حدث خطأ، نخبر المستخدم بدلاً من الحذف الصامت
      api.sendMessage('❌ | السيرفر استغرق وقتاً طويلاً أو حدث خطأ. حاول مرة أخرى الآن.', threadID, messageID);
      api.unsendMessage(waitingMsg.messageID);
    }
  },
};
