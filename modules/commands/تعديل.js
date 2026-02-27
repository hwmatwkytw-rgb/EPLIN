const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "تعديل",
    aliases: ["e"],
    author: "Arafat",
    version: "5.0",
    cooldowns: 5,
    role: 0,
    category: "image"
  },

  onStart: async function ({ message, args, api, event }) {
    let imageUrl, prompt;

    // التحقق من وجود صورة (رد على رسالة أو رابط)
    if (event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length > 0) {
      imageUrl = event.messageReply.attachments[0].url;
      prompt = args.join(" ");
    } else if (args.length >= 2) {
      imageUrl = args[0];
      prompt = args.slice(1).join(" ");
    } else {
      return api.sendMessage("⚠️ | يرجى الرد على صورة وكتابة النص (Prompt) أو وضع رابط صورة ثم النص.", event.threadID, event.messageID);
    }

    if (!prompt) return api.sendMessage("❌ | النص (Prompt) مفقود!", event.threadID, event.messageID);

    const waitMsg = await api.sendMessage("⏳ | 𝐘𝐨𝐮𝐫 𝐫𝐞𝐪𝐮𝐞𝐬𝐭 𝐢𝐬 𝐩𝐫𝐨𝐜𝐞𝐬𝐬𝐢𝐧𝐠 𝐩𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭.....!!", event.threadID);

    try {
      // 1. جلب رابط الـ API الأساسي من جيت هاب
      const githubJson = "https://raw.githubusercontent.com/Arafat-Core/cmds/refs/heads/main/api.json";
      const { data: githubData } = await axios.get(githubJson);

      if (!githubData || !githubData.api) {
        return api.sendMessage("❌ | فشل جلب بيانات الـ API من السيرفر الرئيسي.", event.threadID);
      }

      // 2. بناء رابط الطلب (استخدام GET غالباً أضمن في هذه الـ APIs)
      const API_URL = `${githubData.api}/arafatedit`;
      
      // إرسال الطلب (استخدمنا POST بناءً على هيكلة الكود الأصلي لكن مع إضافة معالجة للـ Error)
      const response = await axios.post(API_URL, {
        prompt: prompt,
        image_urls: [imageUrl],
        font: "Poppins"
      });

      const editedUrl = response.data.image_url || response.data.url;

      if (!editedUrl) {
        return api.sendMessage("❌ | 𝐄𝐝𝐢𝐭 𝐟𝐚𝐢𝐥𝐞𝐝: لم يقم السيرفر بإعادة رابط صورة.", event.threadID);
      }

      // 3. تحميل الصورة المعدلة
      const imageBuffer = await axios.get(editedUrl, { responseType: "arraybuffer" });

      // التأكد من وجود مجلد الكاش
      const cachePath = path.join(__dirname, "cache");
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });

      const filePath = path.join(cachePath, `${Date.now()}_edit.png`);
      fs.writeFileSync(filePath, Buffer.from(imageBuffer.data));

      // 4. حذف رسالة "الانتظار" وإرسال النتيجة
      await api.unsendMessage(waitMsg.messageID);

      return message.reply({
        body: `✅ | 𝐃𝐨𝐧𝐞\n📝 | 𝐏𝐫𝐨𝐦𝐩𝐭: "${prompt}"`,
        attachment: fs.createReadStream(filePath)
      }, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });

    } catch (err) {
      console.error(err);
      api.unsendMessage(waitMsg.messageID);
      return api.sendMessage(`❌ | حدث خطأ أثناء المعالجة:\n${err.message}`, event.threadID);
    }
  }
};
