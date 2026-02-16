const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports = {
    config: {
        name: 'إزالة',
        version: '1.1',
        author: 'سينكو',
        countDown: 10,
        prefix: true,
        groupAdminOnly: false,
        description: 'يزيل الخلفية من الصورة. قم بالرد على صورة أو اذكر مستخدم لإزالة خلفية صورته.',
        category: 'image',
        guide: {
            ar: 'اكتب {pn}إزالة [الرد على صورة] أو {pn}إزالة [/@ذكر|رقم المعرف]'
        },
    },
    onStart: async ({ api, event }) => {
        const { senderID, mentions, messageReply } = event;
        let imageUrl;
        let targetIDForFilename = senderID;

        try {
            // التحقق من الصورة في الرد
            if (messageReply && messageReply.attachments?.length) {
                const type = messageReply.attachments[0].type;
                if (type.startsWith('image')) {
                    imageUrl = messageReply.attachments[0].url;
                    targetIDForFilename = messageReply.senderID;
                }
            } else {
                // التحقق من ذكر المستخدم أو ID
                let targetID = senderID;
                if (Object.keys(mentions).length > 0) {
                    targetID = Object.keys(mentions)[0];
                } else if (event.body.split(' ').length > 1) {
                    const uid = event.body.split(' ')[1].replace(/[^0-9]/g, '');
                    if (uid.length === 15 || uid.length === 16) targetID = uid;
                }
                targetIDForFilename = targetID;
                imageUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
            }

            if (!imageUrl) {
                return api.sendMessage("⚠️ الرجاء الرد على صورة أو ذكر مستخدم لإزالة الخلفية.", event.threadID);
            }

            console.log("URL للصورة:", imageUrl);

            const apiUrl = `https://hridoy-apis.vercel.app/tools/removebg?url=${encodeURIComponent(imageUrl)}&apikey=hridoyXQC`;

            api.sendMessage("⏳ جاري إزالة الخلفية من الصورة، يرجى الانتظار...", event.threadID);
            console.log(`[طلب API] إرسال إلى: ${apiUrl}`);

            const response = await axios.get(apiUrl, { responseType: 'json' });
            console.log(`[رد API] البيانات:`, response.data);

            if (!response.data || !response.data.status || !response.data.result) {
                return api.sendMessage(
                    `❌ فشل في إزالة الخلفية.\nالرد من الخدمة: ${JSON.stringify(response.data)}`,
                    event.threadID
                );
            }

            // تحميل الصورة بعد إزالة الخلفية
            const bgRemovedImageResponse = await axios.get(response.data.result, { responseType: 'arraybuffer' });

            if (!bgRemovedImageResponse.data || bgRemovedImageResponse.data.length === 0) {
                return api.sendMessage("❌ لم يتم تحميل الصورة بعد إزالة الخلفية.", event.threadID);
            }

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const imagePath = path.join(cacheDir, `إزالة_${targetIDForFilename}_${Date.now()}.png`);
            fs.writeFileSync(imagePath, Buffer.from(bgRemovedImageResponse.data, 'binary'));

            api.sendMessage({
                attachment: fs.createReadStream(imagePath)
            }, event.threadID, () => {
                fs.unlinkSync(imagePath);
            });

        } catch (error) {
            console.error("خطأ أثناء معالجة الصورة:", error.response ? error.response.data : error.message);
            api.sendMessage(
                `⚠️ حدث خطأ أثناء معالجة الصورة. التفاصيل: ${error.response ? JSON.stringify(error.response.data) : error.message}`,
                event.threadID
            );
        }
    }
};
