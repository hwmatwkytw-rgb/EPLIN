const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "تخيل",
    version: "1.0",
    author: "Gemini",
    countDown: 10,
    role: 0,
    prefix: true,
    description: "صناعة صور بالذكاء الاصطناعي من خلال الوصف",
    category: "ذكاء اصطناعي",
    guide: { ar: "{pn} [وصف الصورة بالإنجليزية]" }
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const prompt = args.join(" ");

    if (!prompt) {
      return api.sendMessage("ꕥ ┋ ⚠️ يـرجى كـتابة وصف لـلصورة.\nمثال: /تخيل cat flying in space", threadID, messageID);
    }

    api.sendMessage("ꕥ ┋ ⏳ جـارِ تـخيل الـصورة... انـتظر قـليلاً", threadID, messageID);

    try {
      // استخدام API مجاني (كمثال: Pollinations.ai)
      const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}`;
      
      const imagePath = path.join(__dirname, 'cache', `image_${Date.now()}.png`);
      
      // تحميل الصورة مؤقتاً
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      fs.ensureDirSync(path.join(__dirname, 'cache'));
      fs.writeFileSync(imagePath, Buffer.from(response.data));

      // إرسال الصورة بزخرفة ملكية
      const msg = 
        `╭───〔 𓆩 🎨 تـم الـتـخـيـل 𓆪 〕───╮\n` +
        `┃ ꕥ الـوصف: ${prompt}\n` +
        `╰──────────────────╯`;

      return api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => fs.unlinkSync(imagePath), messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("ꕥ ┋ ❌ فـشل الـذكاء الـاصطناعي فـي تـوليد الـصورة.", threadID, messageID);
    }
  }
};
