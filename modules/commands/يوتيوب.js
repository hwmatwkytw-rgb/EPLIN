const axios = require("axios");

module.exports = {
    config: {
        name: "يوتيوب",
        version: "6.1.0",
        author: "Fix Pro",
        countDown: 5,
        role: 0,
        description: "يوتيوب بدون أخطاء + حماية كاملة",
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
                "❌ اكتب اسم الفيديو\nمثال: يوتيوب naruto",
                threadID,
                messageID
            );
        }

        try {
            const res = await axios.get(
                `https://api.betabotz.eu.org/api/search/ytsearch?q=${encodeURIComponent(query)}`
            );

            if (!res.data || !res.data.result) {
                throw new Error("Search API Failed");
            }

            let results = res.data.result.slice(0, 5);

            global.ytSearch[threadID] = results;

            let msg = "📃 نتائج البحث:\n\n";

            results.forEach((v, i) => {
                msg += `${i + 1}- 🎬 ${v.title}\n⏱️ ${v.duration}\n\n`;
            });

            msg += "📌 اكتب رقم الفيديو";

            return api.sendMessage(msg, threadID, messageID);

        } catch (err) {
            console.log("SEARCH ERROR:", err.message);

            return api.sendMessage(
                "⚠️ فشل البحث، حاول مرة ثانية",
                threadID
            );
        }
    },

    onChat: async ({ api, event }) => {
        const { threadID, body, messageID, senderID } = event;

        if (!global.ytSearch || !global.ytSearch[threadID]) return;

        let choice = parseInt(body);
        if (isNaN(choice)) return;

        let list = global.ytSearch[threadID];

        if (!list[choice - 1]) {
            return api.sendMessage("❌ اختيار غير صحيح", threadID);
        }

        let video = list[choice - 1];

        let quality = (global.ytUserQuality && global.ytUserQuality[senderID]) || "720";

        try {
            delete global.ytSearch[threadID];

            const download = await axios.get(
                `https://api.betabotz.eu.org/api/download/ytmp4?url=${video.url}&quality=${quality}`
            );

            if (!download.data || !download.data.result || !download.data.result.mp4) {
                throw new Error("Download API Failed");
            }

            const videoUrl = download.data.result.mp4;

            const videoStream = await axios.get(videoUrl, {
                responseType: "stream",
                timeout: 60000
            });

            let attachments = [];

            // 🎬 إضافة الصورة (اختياري)
            if (video.thumbnail) {
                try {
                    const thumb = await axios.get(video.thumbnail, {
                        responseType: "stream"
                    });
                    attachments.push(thumb.data);
                } catch {}
            }

            attachments.push(videoStream.data);

            return api.sendMessage(
                {
                    body: `🎬 ${video.title}\n📺 الجودة: ${quality}p`,
                    attachment: attachments
                },
                threadID,
                messageID
            );

        } catch (err) {
            console.log("DOWNLOAD ERROR:", err.message);

            return api.sendMessage(
                "⚠️ فشل تحميل الفيديو ❌\n\n💡 جرب:\n- فيديو ثاني\n- جودة أقل (360)",
                threadID
            );
        }
    }
};
