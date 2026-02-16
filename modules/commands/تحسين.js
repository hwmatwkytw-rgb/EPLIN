const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'تحسين',
        version: '1.2',
        author: 'Gemini AI',
        countDown: 10,
        prefix: true,
        description: '🖼️ تحسين جودة الصورة بدقة عالية. قم بالرد على صورة.',
        category: 'image',
        guide: {
            ar: '   {pn} [رد على صورة] أو {pn} [منشن]'
        },
    },

    onStart: async ({ api, event }) => {
        const { senderID, mentions, messageReply, threadID, messageID } = event;
        let imageUrl;

        // 1. تحديد رابط الصورة (من الرد أو المنشن)
        if (messageReply && messageReply.attachments && messageReply.attachments.length > 0) {
            imageUrl = messageReply.attachments[0].url;
        } else if (Object.keys(mentions).length > 0) {
            const targetID = Object.keys(mentions)[0];
            imageUrl = `https://graph.facebook.com/${targetID}/picture?width=1024&height=1024&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
        } else {
            return api.sendMessage("⚠️ | يا زول، لازم ترد على صورة أو تمنشن شخص عشان أحسن الصورة!", threadID, messageID);
        }

        const waitMsg = await api.sendMessage("✨ جاري معالجة الصورة وتحسين جودتها... ثواني من فضلك", threadID);

        try {
            // 2. استخدام API بديلة ومستقرة (Upscale/Remini)
            // ملاحظة: قمت بتغيير الرابط لمصدر أكثر استقراراً
            const upscaleApi = `https://api.vyturex.com/upscale?url=${encodeURIComponent(imageUrl)}`;
            
            const response = await axios.get(upscaleApi, { timeout: 60000 });
            const resultUrl = response.data.result || response.data.url;

            if (!resultUrl) throw new Error("السيرفر لم يرجع رابطاً صالحاً");

            // 3. تحميل الصورة المحسنة
            const imageRes = await axios.get(resultUrl, { responseType: 'arraybuffer' });
            
            const cacheDir = path.join(__dirname, 'cache');
            await fs.ensureDir(cacheDir);
            const imagePath = path.join(cacheDir, `enhanced_${Date.now()}.png`);

            await fs.writeFile(imagePath, Buffer.from(imageRes.data));

            // 4. إرسال النتيجة
            await api.sendMessage({
                body: "✅ تم تحسين الصورة بنجاح! 🌟",
                attachment: fs.createReadStream(imagePath)
            }, threadID, () => {
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            }, messageID);

            api.unsendMessage(waitMsg.messageID);

        } catch (error) {
            console.error(error);
            api.unsendMessage(waitMsg.messageID);
            api.sendMessage(`🚫 | معليش، السيرفر حالياً مضغوط أو الصورة حجمها كبير زيادة. حاول مرة ثانية بعد شوية.`, threadID, messageID);
        }
    },
};
