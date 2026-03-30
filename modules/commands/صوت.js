const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
    config: {
        name: "صوت",
        version: "1.0.0",
        author: "Fix Pro",
        countDown: 5,
        role: 0,
        description: "تحويل النص إلى صوت",
        category: "voice"
    },

    onStart: async ({ api, event }) => {
        const { threadID, messageID, body } = event;

        if (!body) {
            return api.sendMessage("❌ اكتب نص لتحويله إلى صوت", threadID, messageID);
        }

        const text = body;

        try {

            // 🔊 رابط تحويل النص إلى صوت
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ar&client=tw-ob`;

            const path = __dirname + "/voice.mp3";

            // تحميل الصوت
            const response = await axios({
                url,
                method: "GET",
                responseType: "stream"
            });

            const writer = fs.createWriteStream(path);
            response.data.pipe(writer);

            writer.on("finish", () => {
                return api.sendMessage(
                    {
                        body: "🔊 تم تحويل النص إلى صوت:",
                        attachment: fs.createReadStream(path)
                    },
                    threadID,
                    () => fs.unlinkSync(path),
                    messageID
                );
            });

            writer.on("error", () => {
                return api.sendMessage("❌ خطأ أثناء إنشاء الملف الصوتي", threadID, messageID);
            });

        } catch (err) {
            console.log(err);
            return api.sendMessage("❌ فشل في تشغيل الأمر الصوتي", threadID, messageID);
        }
    }
};
