const axios = require('axios');

module.exports = {
  config: {
    name: 'يوتيوب',
    version: '7.0',
    author: 'Fix Pro',
    countDown: 5,
    prefix: true,
    adminOnly: false,
    description: 'تحميل فيديو من يوتيوب مع حفظ الجودة لكل مستخدم',
    category: 'media',
    guide: {
      ar: '{pn} يوتيوب [اسم الفيديو]\n{pn} يوتيوب [360/720/1080]'
    },
  },

  onStart: async ({ api, event, args }) => {
    try {
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
          "❌ اكتب اسم الفيديو",
          threadID,
          messageID
        );
      }

      let results = [];

      // 🔍 البحث (API 1)
      try {
        const res1 = await axios.get(
          `https://api.betabotz.eu.org/api/search/ytsearch?q=${encodeURIComponent(query)}`
        );

        if (res1.data && res1.data.result) {
          results = res1.data.result;
        }
      } catch {}

      // 🔄 API احتياطي
      if (!results.length) {
        try {
          const res2 = await axios.get(
            `https://ytsearch-3.herokuapp.com/api?query=${encodeURIComponent(query)}`
          );

          if (res2.data && res2.data.result) {
            results = res2.data.result.map(v => ({
              title: v.title,
              duration: v.timestamp,
              url: v.url,
              thumbnail: v.thumbnail
            }));
          }
        } catch {}
      }

      if (!results.length) {
        return api.sendMessage(
          "⚠️ فشل البحث ❌",
          threadID,
          messageID
        );
      }

      results = results.slice(0, 5);
      global.ytSearch[threadID] = results;

      let msg = "📃 نتائج البحث:\n\n";

      results.forEach((v, i) => {
        msg += `${i + 1}- 🎬 ${v.title}\n⏱️ ${v.duration}\n\n`;
      });

      msg += "📌 اكتب رقم الفيديو";

      return api.sendMessage(msg, threadID, messageID);

    } catch (error) {
      console.error("YT ERROR:", error);
      return api.sendMessage(
        "⚠️ حدث خطأ أثناء البحث",
        event.threadID
      );
    }
  },

  onChat: async ({ api, event }) => {
    try {
      const { threadID, body, senderID } = event;

      if (!global.ytSearch || !global.ytSearch[threadID]) return;

      let choice = parseInt(body);
      if (isNaN(choice)) return;

      let list = global.ytSearch[threadID];

      if (!list[choice - 1]) {
        return api.sendMessage("❌ رقم غير صحيح", threadID);
      }

      let video = list[choice - 1];
      let quality = (global.ytUserQuality && global.ytUserQuality[senderID]) || "720";

      delete global.ytSearch[threadID];

      try {
        const download = await axios.get(
          `https://api.betabotz.eu.org/api/download/ytmp4?url=${video.url}&quality=${quality}`
        );

        if (!download.data || !download.data.result) {
          throw new Error("Download failed");
        }

        const videoUrl = download.data.result.mp4;

        const stream = await axios.get(videoUrl, {
          responseType: "stream"
        });

        return api.sendMessage(
          {
            body: `🎬 ${video.title}\n📺 ${quality}p`,
            attachment: stream.data
          },
          threadID
        );

      } catch (err) {
        return api.sendMessage(
          "⚠️ فشل تحميل الفيديو\n💡 جرب جودة 360",
          threadID
        );
      }

    } catch (error) {
      console.error("YT CHAT ERROR:", error);
      return api.sendMessage(
        "⚠️ حدث خطأ",
        event.threadID
      );
    }
  }
};
