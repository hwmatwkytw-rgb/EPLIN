const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: 'لينز',
        version: '1.1',
        author: 'Fix Pro',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'يجلب صورة مشابهة للصورة التي تم الرد عليها',
        category: 'tools',
        guide: '{pn} (بالرد على صورة)',
    },

    onStart: async ({ api, event }) => {
        const { threadID, messageReply } = event;

        try {
            // تحقق من الرد
            if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
                return api.sendMessage("❌ لازم ترد على صورة!", threadID);
            }

            const attachment = messageReply.attachments[0];

            if (attachment.type !== "photo") {
                return api.sendMessage("❌ الرد لازم يكون على صورة!", threadID);
            }

            const imgUrl = attachment.url;

            // طلب API
            const res = await axios.get(`https://api.popcat.xyz/lens?image=${encodeURIComponent(imgUrl)}`)
                .catch(() => null);

            if (!res || !res.data) {
                return api.sendMessage("❌ فشل الاتصال بالسيرفر", threadID);
            }

            const results = res.data.results || [];

            if (!Array.isArray(results) || results.length === 0) {
                return api.sendMessage("❌ لم يتم العثور على صورة مشابهة", threadID);
            }

            const resultImage = results[0].image;

            if (!resultImage) {
                return api.sendMessage("❌ لم يتم العثور على صورة صالحة", threadID);
            }

            // إنشاء مجلد الكاش
            const cachePath = path.join(__dirname, 'cache');
            if (!fs.existsSync(cachePath)) {
                fs.mkdirSync(cachePath);
            }

            const imgPath = path.join(cachePath, `lens_${Date.now()}.jpg`);

            // تحميل الصورة
            const imgData = await axios.get(resultImage, {
                responseType: "arraybuffer"
            });

            fs.writeFileSync(imgPath, Buffer.from(imgData.data, "binary"));

            // إرسال الصورة
            api.sendMessage({
                body: "🔍 هذه صورة مشابهة:",
                attachment: fs.createReadStream(imgPath)
            }, threadID, () => {
                fs.unlinkSync(imgPath);
            });

        } catch (error) {
            console.error("Lens Error:", error);
            api.sendMessage("❌ حدث خطأ أثناء البحث عن الصورة", threadID);
        }
    }
};
