const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: 'لينز',
        version: '1.2',
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
            let resultImage = null;

            // 🔹 المحاولة الأولى (Popcat)
            try {
                const res = await axios.get(
                    `https://api.popcat.xyz/lens?image=${encodeURIComponent(imgUrl)}`,
                    { timeout: 10000 }
                );

                const results = res.data?.results || [];
                if (Array.isArray(results) && results.length > 0) {
                    resultImage = results[0].image;
                }
            } catch (e) {
                console.log("Popcat فشل ❌");
            }

            // 🔹 المحاولة الثانية (API احتياطي)
            if (!resultImage) {
                try {
                    const backup = await axios.get(
                        `https://api.siputzx.my.id/api/tools/reverse-image?image=${encodeURIComponent(imgUrl)}`,
                        { timeout: 10000 }
                    );

                    const data = backup.data?.data || [];
                    if (Array.isArray(data) && data.length > 0) {
                        resultImage = data[0].image || data[0].thumbnail;
                    }
                } catch (e) {
                    console.log("Backup API فشل ❌");
                }
            }

            // ❌ إذا فشلوا الاثنين
            if (!resultImage) {
                return api.sendMessage("❌ فشل الاتصال بكل السيرفرات 😢", threadID);
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
            api.sendMessage("❌ حدث خطأ أثناء التنفيذ", threadID);
        }
    }
};
