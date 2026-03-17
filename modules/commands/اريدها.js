const axios = require('axios');
const fs = require('fs-extra');
const { Shazam } = require("node-shazam");
const qs = require('qs');
const yts = require('yt-search');
const path = require('path');

module.exports = {
  config: {
    name: "اريدها",
    version: "2.0",
    author: "AbuUbaida x ابلين",
    countDown: 5,
    role: 0,
    category: "وسائط",
    guide: "رد على فيديو أو أوديو عشان أعرف ليك الأغنية"
  },
  
  onStart: async function({ api, event }) {
    // التأكد من وجود رد على رسالة
    if (event.type !== "message_reply") {
      return api.sendMessage("يا رمة رد على فيديو أو أوديو عشان أبحث ليك! 🙂🚮", event.threadID, event.messageID);
    }
    
    const attachment = event.messageReply.attachments[0];
    if (!attachment || !["audio", "video"].includes(attachment.type)) {
      return api.sendMessage("دا ما فيديو ولا أوديو يا وهم! ركز شوية..", event.threadID, event.messageID);
    }

    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    
    const filePath = path.join(cacheDir, `shazam_${event.senderID}.${attachment.type === "audio" ? "mp3" : "mp4"}`);

    try {
      api.setMessageReaction("🔍", event.messageID, () => {}, true);
      
      // تحميل الملف
      const response = await axios.get(attachment.url, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(response.data));
      
      const shazam = new Shazam();
      const recognise = await shazam.recognise(filePath, 'en-US');
      
      if (!recognise?.track) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage("أسف يا ملك، ما قدرت أتعرف على الأغنية دي.. حاول بقطع أنضف.", event.threadID);
      }

      const songInfo = {
        image: recognise.track.images?.coverart || "https://i.imgur.com/6oYvY88.png",
        name: recognise.track.title,
        author: recognise.track.subtitle
      };

      const imgStream = (await axios.get(songInfo.image, { responseType: "stream" })).data;
      
      const msg = await api.sendMessage({
        body: `⌯︙المؤلف ❍> ${songInfo.author} 👤\n⌯︙أسم الأغنية ❍> ${songInfo.name} ☔\n\nرد بكلمة "ارسلي" عشان أجيب ليك الأغنية كاملة! ✨`,
        attachment: imgStream
      }, event.threadID);

      // تسجيل الرد في نظام البوت
      global.client.handleReply.push({
        name: this.config.name,
        messageID: msg.messageID,
        songName: songInfo.name,
        author: event.senderID
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      fs.unlinkSync(filePath); // حذف الملف المؤقت

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage("❌ | حصل كلاش وأنا ببحث.. جرب تاني.", event.threadID);
    }
  },

  onReply: async function({ api, event, handleReply }) {
    const { songName, author } = handleReply;
    if (event.senderID !== author) return;
    if (event.body.trim().toLowerCase() !== "ارسلي") return;

    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);
      api.sendMessage(`دقيقة يا بطل.. جاري البحث عن "${songName}" في يوتيوب... 🎧`, event.threadID, event.messageID);

      const r = await yts(songName);
      const video = r.videos[0];
      if (!video) return api.sendMessage("ما لقيت الأغنية دي في يوتيوب! 💔", event.threadID);

      const mp3Data = await getMp3(video.url);
      const audioStream = (await axios.get(mp3Data.dlink, { responseType: "stream" })).data;

      await api.sendMessage({
        body: `✅ تفضل يا ملك: ${video.title}`,
        attachment: audioStream
      }, event.threadID, event.messageID);
      
      api.setMessageReaction("🎵", event.messageID, () => {}, true);
    } catch (e) {
      api.sendMessage("❌ | فشلت في تحميل الأغنية: " + e.message, event.threadID);
    }
  }
};

// وظائف التحميل من يوتيوب (نفس اللي أرسلتها مع تعديلات بسيطة للثبات)
async function getInfo(url) {
  let data = qs.stringify({ 'query': url, 'vt': 'youtube' });
  let config = {
    method: 'POST',
    url: 'https://ssvid.net/api/ajax/search',
    data: data
  };
  return (await axios.request(config)).data;
}

async function download(vidCode, KCode) {
  let data = qs.stringify({ 'vid': vidCode, 'k': KCode });
  let config = {
    method: 'POST',
    url: 'https://ssvid.net/api/ajax/convert',
    data: data
  };
  return (await axios.request(config)).data;
}

async function getMp3(link) {
  const info = await getInfo(link);
  const firstMp3 = Object.values(info.links.mp3)[0];
  return await download(info.vid, firstMp3.k);
}
