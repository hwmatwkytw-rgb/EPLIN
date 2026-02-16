const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'مسدس',
        version: '1.1',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'ينشئ ميم بمسدس باستخدام صورة البروفايل الخاصة بك والنص الذي تدخله.',
        category: 'fun',
        guide: {
            ar: '{pn}مسدس <نص>\nمثال: مسدس بانغ!'
        }
    },

    onStart: async ({ api, event, args }) => {
        const { senderID } = event;

        // نص المستخدم
        const userText = args.join(' ').trim();
        if (!userText) {
            return api.sendMessage("❌ ادخل النص ليصنع الميم! مثال: مسدس بانغ!", event.threadID);
        }

        // رابط صورة البروفايل للشخص الذي كتب الامر
        const profileImageUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

        const apiUrl = `https://sus-apis-2.onrender.com/api/gun-meme?image=${encodeURIComponent(profileImageUrl)}&text=${encodeURIComponent(userText)}`;

        try {
            // رسالة انتظار
            const statusMsg = await new Promise((resolve, reject) => {
                api.sendMessage("🔫 جاري إنشاء صورة الميم...", event.threadID, (err, info) => {
                    if (err) reject(err);
                    else resolve(info);
                });
            });

            // جلب الصورة من الـ API
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            // حفظ مؤقت للصورة
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const imagePath = path.join(cacheDir, `مسدس_${senderID}_${Date.now()}.png`);
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            // ارسال الصورة
            api.sendMessage({ attachment: fs.createReadStream(imagePath) }, event.threadID, () => fs.unlinkSync(imagePath));

            // إزالة رسالة الانتظار
            if (statusMsg?.messageID) api.unsendMessage(statusMsg.messageID);

        } catch (error) {
            console.error("خطأ في إنشاء أو إرسال صورة الميم:", error);
            api.sendMessage("❌ عذراً، لم أتمكن من إنشاء صورة الميم الآن.", event.threadID);
        }
    }
};
