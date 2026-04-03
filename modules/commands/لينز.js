const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: 'لينز',
        version: '1.0',
        author: 'Fix Pro',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'يجلب صورة مشابهة للصورة التي تم الرد عليها',
        category: 'tools',
        guide: '{pn} (بالرد على صورة)',
    },

    onStart: async ({ api, event }) => {
        try {
            const { threadID, messageReply } = event;

            if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
                return api.sendMessage("❌ لازم ترد على صورة!", threadID);
            }

            const attachment = messageReply.attachments[0];

            if (attachment.type !== "photo") {
                return api.sendMessage("❌ الرد لازم يكون على صورة!", threadID);
            }

            const imgUrl = attachment.url;

            // API البحث عن صورة مشابهة
            const res = await axios.get(`https://api.popcat.xyz/lens?image=${encodeURIComponent(imgUrl)}`);
            
            if (!res.data || !res.data.length) {
                return api.sendMessage("❌ لم يتم العثور على صورة مشابهة", threadID);
            }

            const resultImage = res.data[0].url;

            const cachePath = path.join(__dirname, 'cache');
            if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);

            const imgPath = path.join(cachePath, `lens_${Date.now()}.jpg`);

            const imgData = await axios.get(resultImage, { responseType: "arraybuffer" });
            fs.writeFileSync(imgPath, Buffer.from(imgData.data, "binary"));

            api.sendMessage({
                body: "🔍 هذه صورة مشابهة:",
                attachment: fs.createReadStream(imgPath)
            }, threadID, () => {
                fs.unlinkSync(imgPath);
            });

        } catch (err) {
            console.error(err);
            api.sendMessage("❌ حدث خطأ أثناء البحث عن الصورة", event.threadID);
        }
    }
};
