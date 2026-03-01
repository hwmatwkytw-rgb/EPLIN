const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "تيكتوك",
    version: "1.0.0",
    author: "ابو عبيده علي", 
    countDown: 5,
    role: 0, // خليته 0 عشان أي زول يقدر يبحث، لو داير أدمن بس سويهو 1
    description: "البحث عن فيديوهات تيك توك وتحميلها",
    category: "media",
    guide: { ar: "تيكتوك + كلمة البحث" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, senderID, messageID } = event;
    const searchQuery = args.join(" ");
    const developerID = "61586897962846";

    // 1. التحقق من المدخلات
    if (!searchQuery) {
      return api.sendMessage("داير تبحث عن شنو؟ اكتب الكلمة بعد الأمر 🌚.", threadID, messageID);
    }

    const cachePath = path.join(__dirname, "cache", `tiktok_${Date.now()}.mp4`);
    let waitMsg;

    try {
      // إرسال رسالة انتظار وتخزين الـ ID بتاعها عشان نحذفها بعدين
      waitMsg = await api.sendMessage("جاري البحث في تيك توك، اصبر شوية... ⏳", threadID);

      // 2. طلب البيانات من الـ API
      const response = await axios.get(`https://ccprojectapis.ddns.net/api/tiktok/searchvideo?keywords=${encodeURIComponent(searchQuery)}`);
      const videos = response.data.data.videos;

      if (!videos || videos.length === 0) {
        api.unsendMessage(waitMsg.messageID);
        return api.sendMessage("ما لقيت أي فيديو للبحث دا، جرب كلمة تانية يا مزه 🦧.", threadID, messageID);
      }

      const videoData = videos[0];
      const videoUrl = videoData.play;
      const title = videoData.title || "بدون عنوان";
      const nickname = videoData.author.nickname || "غير معروف";

      // 3. تحميل الفيديو
      const videoResponse = await axios({
        method: 'get',
        url: videoUrl,
        responseType: 'stream'
      });

      // التأكد من وجود مجلد الكاش
      if (!fs.existsSync(path.join(__dirname, "cache"))) {
        fs.mkdirSync(path.join(__dirname, "cache"));
      }

      const writer = fs.createWriteStream(cachePath);
      videoResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // 4. حذف رسالة الانتظار وإرسال الفيديو
      api.unsendMessage(waitMsg.messageID);

      await api.sendMessage({
        body: `✅ تم العبث بنجاح:\n\n👤 الناشر: ${nickname}\n📝 العنوان: ${title}`,
        attachment: fs.createReadStream(cachePath)
      }, threadID, () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      }, messageID);

    } catch (error) {
      console.error(error);
      if (waitMsg) api.unsendMessage(waitMsg.messageID);
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      return api.sendMessage("حصل خطأ وأنا بفتش، السيرفر شكلو تعبان 🦧.", threadID, messageID);
    }
  }
};
