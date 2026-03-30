const axios = require("axios");

module.exports = {
    config: {
        name: "جودة",
        version: "1.0.0",
        author: "Fix Pro",
        countDown: 5,
        role: 0,
        description: "رفع جودة الصورة إلى HD",
        category: "image"
    },

    onStart: async ({ api, event }) => {
        const { threadID, messageID, messageReply } = event;

        let imageUrl;

        // لازم رد على صورة
        if (messageReply && messageReply.attachments[0]) {
            imageUrl = messageReply.attachments[0].url;
        }

        if (!imageUrl) {
            return api.sendMessage(
                "❌ لازم ترد على صورة عشان أرفع جودتها",
                threadID,
                messageID
            );
        }

        try {
            // 🔥 API رفع الجودة (HD)
            const apiUrl = `https://api.lolhuman.xyz/api/upscale?img=${encodeURIComponent(imageUrl)}&apikey=free`;

            const response = await axios.get(apiUrl, {
                responseType: "stream"
            });

            return api.sendMessage(
                {
                    attachment: response.data
                },
                threadID,
                messageID
            );

        } catch (err) {
            console.log(err);
            return api.sendMessage(
                "⚠️ حدث خطأ أثناء رفع جودة الصورة",
                threadID,
                messageID
            );
        }
    }
};
