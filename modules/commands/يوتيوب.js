const axios = require("axios");

module.exports = {
    config: {
        name: "يوتيوب",
        version: "6.0.0",
        author: "Fix Pro",
        countDown: 5,
        role: 0,
        description: "تحميل فيديو من يوتيوب مع حفظ الجودة لكل مستخدم + صورة",
        category: "media"
    },

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, senderID } = event;

        global.ytSearch = global.ytSearch || {};
        global.ytUserQuality = global.ytUserQuality || {};

        let query = args.join(" ");

        // 🎛️ تغيير الجودة
        if (["360", "720", "1080"].includes(query)) {
            global.ytUserQuality[senderID] = query;

            return api.sendMessage(
                `✅ تم حفظ الجودة لك: ${query}p`,
                threadID,
                messageID
            );
        }

        if (!query) {
            return api.sendMessage(
                "❌ اكتب اسم الفيديو أو الجودة\n\n📌 مثال:\nيوتيوب naruto\nيوتيوب 720",
                threadID,
                messageID
            );
        }

        try {
            const res = await axios.get(
                `https://api.betabotz.eu.org/api/search/ytsearch?q=${encodeURIComponent(query)}`
            );

            let results = res.data.result.slice(0, 5);

            if (!results.length) {
                return api.sendMessage("❌ لا يوجد نتائج", threadID);
            }

            global.ytSearch[threadID] = results;

            let msg = "📃 نتائج البحث:\n\n";

            results.forEach((v, i) => {
                msg += `${i + 1}- 🎬 ${v.title}\n⏱️ ${v.duration}\n\n`;
            });

            msg += "📌 اكتب رقم الفيديو";

            return api.sendMessage(msg, threadID, messageID);

        } catch (err) {
            console.log("SEARCH ERROR:", err?.response?.data || err.message);
            return api.sendMessage("⚠️ خطأ في البحث", threadID);
        }
    },

    onChat: async ({ api, event }) => {
        const { threadID, body, messageID, senderID } = event;

        if (!global.ytSearch || !global.ytSearch[threadID]) return;

        let choice = parseInt(body);
        if (isNaN(choice)) return;

        let list = global.ytSearch[threadID];

        if (choice < 1 || choice > list.length) {
            return api.sendMessage("❌ رقم غير صحيح", threadID);
        }

        let video = list[choice - 1];

        global.ytUserQuality = global.ytUserQuality || {};

        let quality = global.ytUserQuality[senderID] || "720";

        try {
            delete global.ytSearch[threadID];

            // 🎥 تحميل الفيديو
            const download = await axios.get(
                `https://api.betabotz.eu.org/api/download/ytmp4?url=${video.url}&quality=${quality}`
            );

            if (!download.data || !download.data.result) {
                throw new Error("API Error");
            }

            const videoUrl = download.data.result.mp4;

            const videoStream = await axios.get(videoUrl, {
                responseType: "stream"
            });

            // 🖼️ الصورة المصغرة
            let attachments = [videoStream.data];

            try {
                const thumbStream = await axios.get(video.thumbnail, {
                    responseType: "stream"
                });
                attachments.unshift(thumbStream.data);
            } catch {}

            return api.sendMessage(
                {
                    body: `🎬 ${video.title}\n⏱️ ${video.duration}\n📺 الجودة: ${quality}p`,
                    attachment: attachments
                },
                threadID,
                messageID
            );

        } catch (err) {
            console.log("DOWNLOAD ERROR:", err?.response?.data || err.message);

            return api.sendMessage(
                "⚠️ فشل تحميل الفيديو، جرب فيديو آخر أو جودة مختلفة",
                threadID
            );
        }
    }
};
