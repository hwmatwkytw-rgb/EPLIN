const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'لوجو',
        version: '1.0',
        author: 'Gemini',
        countDown: 10,
        prefix: true,
        category: 'تعديل صور',
        description: 'يصنع لوجو احترافي بنصك على الصورة التي ترد عليها.',
        guide: { ar: '{pn} [النص] (رد على صورة)' }
    },

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, messageReply, type } = event;
        const text = args.join(' ').trim();

        // 1. التأكد من النص
        if (!text) {
            return api.sendMessage("●───── ⌬ ─────●\n┇ ⚠️ يرجى كتابة النص لصنع اللوجو.\n●───── ⌬ ─────●", threadID, messageID);
        }

        // 2. جلب الصورة من الرد
        let imageUrl;
        if (type === "message_reply" && messageReply.attachments[0]?.url) {
            imageUrl = messageReply.attachments[0].url;
        } else if (event.attachments[0]?.url) {
            imageUrl = event.attachments[0].url;
        }

        if (!imageUrl) {
            return api.sendMessage("●───── ⌬ ─────●\n┇ ⚠️ يرجى الرد على صورة لإضافة اللوجو عليها.\n●───── ⌬ ─────●", threadID, messageID);
        }

        api.setMessageReaction("🎨", messageID, () => {}, true);

        try {
            api.sendMessage("●───── ⌬ ─────●\n┇ ⏳ جاري تصميم اللوجو ودمجه...\n●───── ⌬ ─────●", threadID);

            // ملاحظة: هذا الـ API افتراضي، تأكد من استخدام الـ API الذي يدعم دمج اللوجو في الصور لديك
            const apiUrl = `https://api.canvas-designer.com/make?image=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(text)}&style=premium`;

            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

            const imgPath = path.join(cacheDir, `logo_${Date.now()}.png`);
            fs.writeFileSync(imgPath, Buffer.from(response.data, 'binary'));

            await api.sendMessage({
                body: "●───── ⌬ ─────●\n┇ ✅ تم تصميم اللوجو على الصورة بنجاح!\n●───── ⌬ ─────●",
                attachment: fs.createReadStream(imgPath)
            }, threadID, () => fs.unlinkSync(imgPath));

        } catch (e) {
            api.sendMessage("●───── ⌬ ─────●\n┇ ❌ حدث خطأ أثناء معالجة اللوجو.\n●───── ⌬ ─────●", threadID, messageID);
        }
    }
};
