const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'مسدس',
        version: '1.2',
        author: 'Hridoy / Style 8',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'ينشئ ميم بمسدس باستخدام صورتك ونصك الخاص.',
        category: 'fun',
        guide: {
            ar: '‹ 𖤓 ─━⊱★⊰━─ 𖤓 ›\nاستخدام: {pn} <نص>\nمثال: {pn} مت!'
        }
    },

    onStart: async ({ api, event, args }) => {
        const { senderID, threadID, messageID } = event;

        // نص المستخدم
        const userText = args.join(' ').trim();
        if (!userText) {
            return api.sendMessage("⚠️ ‹ 𖤓 › يرجى كتابة النص أولاً!\nمثال: مسدس بانغ!", threadID, messageID);
        }

        // رابط صورة البروفايل
        const profileImageUrl = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
        const apiUrl = `https://sus-apis-2.onrender.com/api/gun-meme?image=${encodeURIComponent(profileImageUrl)}&text=${encodeURIComponent(userText)}`;

        try {
            // رسالة انتظار مزخرفة
            const statusMsg = await new Promise((resolve) => {
                api.sendMessage("‹ 𖤓 ⊱★⊰ 𖤓 ›\n جـاري تـلـقيـم المـسـدس... 🔫", threadID, (err, info) => {
                    resolve(info);
                }, messageID);
            });

            // جلب الصورة
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const imagePath = path.join(cacheDir, `gun_${senderID}_${Date.now()}.png`);
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            // إرسال النتيجة النهائية مع زخرفة بسيطة
            api.sendMessage({
                body: "‹ 𖤓 ─━━━━━━⊱⊰━━━━━━─ 𖤓 ›\nتـم تـنـفـيذ الـعـمـلـيـة بـنـجـاح 🎯",
                attachment: fs.createReadStream(imagePath)
            }, threadID, () => {
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
                if (statusMsg?.messageID) api.unsendMessage(statusMsg.messageID);
            }, messageID);

        } catch (error) {
            console.error("خطأ في إنشاء ميم المسدس:", error);
            api.sendMessage("❌ ‹ 𖤓 › عذراً، فشلت محاولة إطلاق النار (خطأ بالخادم).", threadID, messageID);
        }
    }
};
