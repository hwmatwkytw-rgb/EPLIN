const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'مطلوب',
        version: '1.2',
        author: 'Hridoy & Gemini',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: 'إنشاء ملصق مطلوب مع التفاعل بالإيموجي',
        category: 'تسلية',
        guide: {
            ar: '{pn}مطلوب | رد على صورة أو منشن شخص'
        },
    },

    onStart: async ({ api, event, args }) => {
        const { senderID, mentions, messageReply, threadID, messageID } = event;

        let targetID = senderID;
        let imageUrl = null;
        let targetIDForFilename = senderID;

        // 1. التفاعل بساعة عند البدء
        api.setMessageReaction("⏳", messageID, (err) => {}, true);

        if (messageReply && messageReply.attachments && messageReply.attachments.length > 0 && ['photo', 'sticker'].includes(messageReply.attachments[0].type)) {
            imageUrl = messageReply.attachments[0].url;
            targetIDForFilename = messageReply.senderID;
        } else {
            if (Object.keys(mentions).length > 0) {
                targetID = Object.keys(mentions)[0];
            } else if (args.length > 0 && /^\d+$/.test(args[0])) {
                targetID = args[0];
            }
            targetIDForFilename = targetID;
            imageUrl = `https://graph.facebook.com/${targetID}/picture?width=1024&height=1024&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
        }

        const apiUrl = `https://tanjiro-api.onrender.com/canvas/wanted?url=${encodeURIComponent(imageUrl)}`;

        try {
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            const imagePath = path.join(cacheDir, `wanted_${targetIDForFilename}_${Date.now()}.png`);
            fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));

            // 2. التفاعل بصح عند النجاح وإرسال الصورة
            api.setMessageReaction("✅", messageID, (err) => {}, true);
            
            return api.sendMessage({
                body: "💀 تم إدراجك في قائمة المطلوبين!",
                attachment: fs.createReadStream(imagePath)
            }, threadID, () => {
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            });

        } catch (error) {
            console.error("Error:", error.message);
            // 3. التفاعل بخطأ عند الفشل
            api.setMessageReaction("❌", messageID, (err) => {}, true);
            return api.sendMessage("❌ فشل الاتصال بالخادم، حاول مرة أخرى.", threadID);
        }
    }
};
