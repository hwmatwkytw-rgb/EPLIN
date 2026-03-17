const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: 'عدل',
    aliases: ['edit', 'eplin'],
    version: '1.1.0',
    author: 'AbuUbaida',
    description: 'تعديل الصور عبر API إبلين الخاص',
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
      return api.sendMessage('⚠️ | يا ملك، يرجى الرد على صورة وكتابة الوصف الجديد لها!', threadID, messageID);
    }

    api.setMessageReaction("⌛", messageID);
    const waitingMsg = await api.sendMessage('🎨 | جاري الاتصال بسيرفر إبلين ومعالجة الصورة...', threadID, messageID);

    try {
      // رابط سيرفرك الذي تأكدنا من عمله
      const myApiUrl = `https://sudan-pot-65n2.onrender.com/api/edit?prompt=${encodeURIComponent(prompt)}&imageUrl=${encodeURIComponent(imageUrl)}`;
      
      // إجبار البوت على الانتظار لمدة تصل لـ 3 دقائق ليعطي فرصة لسيرفر ريندر
      const res = await axios.get(myApiUrl, { timeout: 180000 });

      if (res.data && res.data.status === "success") {
        const finalImageUrl = res.data.resultUrl;
        const cachePath = path.join(__dirname, "cache", `eplin_${Date.now()}.png`);

        const imageRes = await axios({ url: finalImageUrl, responseType: 'stream', timeout: 180000 });
        const writer = fs.createWriteStream(cachePath);
        imageRes.data.pipe(writer);

        writer.on('finish', async () => {
          await api.sendMessage({
            body: `✅ تم التعديل بواسطة سيرفرك الخاص!\n📝 الوصف: ${prompt}`,
            attachment: fs.createReadStream(cachePath)
          }, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            api.unsendMessage(waitingMsg.messageID);
          }, messageID);
          api.setMessageReaction("✨", messageID);
        });
      } else {
        api.sendMessage(`🚫 | السيرفر رفض الطلب: ${res.data.message || 'خطأ غير معروف'}`, threadID, messageID);
        api.unsendMessage(waitingMsg.messageID);
      }

    } catch (error) {
      console.error(error);
      api.sendMessage('❌ | عذراً يا ملك، السيرفر استغرق وقتاً طويلاً للاستيقاظ. جرب الآن مرة أخرى وسيعمل فوراً!', threadID, messageID);
      // لا نحذف رسالة الانتظار هنا إلا بعد إرسال رسالة الخطأ لنعرف ماذا حدث
    }
  },
};
