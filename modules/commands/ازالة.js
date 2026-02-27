const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
    config: {
        name: "ازالة",
        version: "1.0",
        author: "سينكو 17Y",
        countDown: 10,
        description: "إزالة خلفية الصور باستخدام الذكاء الاصطناعي",
        category: "أدوات",
        guide: { ar: "{pn} [قم بالرد على صورة]" }
    },

    onStart: async function ({ api, event }) {
        // التحقق من وجود صورة في الرد
        if (event.type !== "message_reply" || !event.messageReply.attachments[0] || event.messageReply.attachments[0].type !== "photo") {
            return api.sendMessage("⚠️ يرجى الرد على الصورة التي تريد إزالة خلفيتها.", event.threadID);
        }

        const apiKey = "CNYjGk9RRUB6XRmP4UsuceoU"; // مفتاحك الذي أرسلته
        const imageUrl = event.messageReply.attachments[0].url;
        const path = __dirname + `/cache/removed_bg.png`;

        api.sendMessage("⏳ جاري معالجة الصورة.. يرجى الانتظار", event.threadID);

        try {
            const response = await axios({
                method: 'post',
                url: 'https://api.remove.bg/v1.0/removebg',
                data: {
                    image_url: imageUrl,
                    size: 'auto'
                },
                headers: {
                    'X-Api-Key': apiKey
                },
                responseType: 'arraybuffer'
            });

            fs.writeFileSync(path, response.data);

            const msg = `
╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮
      ✨ تـم إزالـة الـخـلفـية ✨


  •——◤ 🖼️ الـحالة : نـجـاح ◥——•
  •——◤ 🛠️ الأداة : Remove.bg ◥——•
  •——◤ 👤 ◥——•


      
╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`;

            api.sendMessage({
                body: msg,
                attachment: fs.createReadStream(path)
            }, event.threadID, () => fs.unlinkSync(path));

        } catch (error) {
            console.error(error);
            api.sendMessage("❌ حدث خطأ! ربما نفد رصيد المفتاح أو أن الصورة غير مدعومة.", event.threadID);
        }
    }
};
