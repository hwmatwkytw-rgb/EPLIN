const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'لوجو',
        version: '1.5',
        author: 'Gemini',
        countDown: 10,
        prefix: true,
        category: 'تعديل صور',
        description: 'يصنع خطوط مزخرفة واحترافية على الصورة التي ترد عليها.',
        guide: { ar: '{pn} [النص] (رد على صورة)' }
    },

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, messageReply, type } = event;
        const text = args.join(' ').trim();

        if (!text) {
            return api.sendMessage("●───── ⌬ ─────●\n┇ ⚠️ يرجى كتابة النص المراد تحويله للوجو.\n●───── ⌬ ─────●", threadID, messageID);
        }

        let imageUrl;
        if (type === "message_reply" && messageReply.attachments[0]?.url) {
            imageUrl = messageReply.attachments[0].url;
        } else if (event.attachments[0]?.url) {
            imageUrl = event.attachments[0].url;
        }

        if (!imageUrl) {
            return api.sendMessage("●───── ⌬ ─────●\n┇ ⚠️ يرجى الرد على صورة لإضافة التصميم عليها.\n●───── ⌬ ─────●", threadID, messageID);
        }

        api.setMessageReaction("🎨", messageID, () => {}, true);

        try {
            // ملاحظة: تم استخدام endpoint "gun-meme" كقاعدة للتعديل لأن السيرفر يدعم دمج النص فوق الصور من خلاله
            // يمكنك تغيير gun-meme إلى أي endpoint لوجو يدعم باراميتر image و text في سيرفرك
            const apiUrl = `https://sus-apis-2.onrender.com/api/gun-meme?image=${encodeURIComponent(imageUrl)}&text=${encodeURIComponent(text)}`;

            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

            const imgPath = path.join(cacheDir, `logo_${Date.now()}.png`);
            fs.writeFileSync(imgPath, Buffer.from(response.data, 'binary'));

            await api.sendMessage({
                body: "●───── ⌬ ─────●\n┇ ✅ تم دمج اللوجو بنجاح!\n●───── ⌬ ─────●",
                attachment: fs.createReadStream(imgPath)
            }, threadID, () => {
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            });

        } catch (e) {
            console.error(e);
            api.sendMessage("●───── ⌬ ─────●\n┇ ❌ السيرفر لا يستجيب حالياً.\n┇ 𓋰 تأكد من أن الرابط صحيح أو حاول لاحقاً.\n●───── ⌬ ─────●", threadID, messageID);
        }
    }
};
