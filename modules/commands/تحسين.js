const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const OSS = require('ali-oss');

// دالة الإعداد الأساسية
function setupImageEditClient() {
  const timestamp = Date.now();
  const anonymousId = uuidv4();
  const sboxGuid = Buffer.from(`${timestamp}|${Math.floor(Math.random() * 1000)}|${Math.floor(Math.random() * 1000000000)}`).toString('base64');
  return axios.create({
    headers: {
      'Cookie': `anonymous_user_id=${anonymousId}; i18n_redirected=en; sbox-guid=${sboxGuid}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
}

module.exports = {
  config: {
    name: "تحسين",
    aliases: ["upscale", "hd"],
    version: "2.0",
    author: "AYOUB",
    description: "رفع جودة ووضوح الصور",
    countDown: 15,
    prefix: true,
    category: "ai"
  },

  onStart: async function({ api, event }) {
    const { threadID, messageID } = event;

    if (event.type !== "message_reply" || !event.messageReply.attachments || event.messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("⚠️ يجب الرد على صورة لتوضيحها!", threadID, messageID);
    }

    const waitingMsg = await api.sendMessage("⏳ جاري رفع الجودة وتوضيح التفاصيل...", threadID);
    const attachment = event.messageReply.attachments[0];
    const cacheDir = __dirname + "/cache";
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    try {
      const client = setupImageEditClient();

      // 1. الحصول على التوكن
      const stsRes = await client.get('https://notegpt.io/api/v1/oss/sts-token');
      const stsData = stsRes.data.data;

      // 2. الرفع لـ OSS
      const ossClient = new OSS({
        region: 'oss-us-west-1',
        accessKeyId: stsData.AccessKeyId,
        accessKeySecret: stsData.AccessKeySecret,
        stsToken: stsData.SecurityToken,
        bucket: 'nc-cdn'
      });
      
      const imgStream = await axios.get(attachment.url, { responseType: 'stream' });
      const ossPath = `notegpt/upscale/${uuidv4()}.jpg`;
      await ossClient.putStream(ossPath, imgStream.data);
      const uploadedUrl = `https://nc-cdn.oss-us-west-1.aliyuncs.com/${ossPath}`;

      // 3. طلب تحسين الجودة (Type 50)
      const editRes = await client.post('https://notegpt.io/api/v2/images/handle', {
        "image_url": uploadedUrl,
        "type": 50,
        "upscale_factor": 2, // يضاعف الحجم مرتين
        "model": "google/nano-banana"
      });
      
      const sessionId = editRes.data.data.session_id;

      // 4. الانتظار
      let results = null;
      for (let i = 0; i < 30; i++) {
        const statusRes = await client.get(`https://notegpt.io/api/v2/images/status?session_id=${sessionId}`);
        if (statusRes.data.data.status === 'succeeded') {
          results = statusRes.data.data.results;
          break;
        }
        await new Promise(r => setTimeout(r, 4000));
      }

      if (!results) throw new Error("Timeout");

      const resultPath = cacheDir + `/hd_${Date.now()}.png`;
      const finalImg = await axios.get(results[0].url, { responseType: 'stream' });
      const writer = fs.createWriteStream(resultPath);
      finalImg.data.pipe(writer);
      await new Promise((resolve) => writer.on('finish', resolve));

      api.unsendMessage(waitingMsg.messageID);
      api.sendMessage({
        body: "✨ تم تحسين جودة الصورة بنجاح!",
        attachment: fs.createReadStream(resultPath)
      }, threadID, () => fs.unlinkSync(resultPath), messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ فشل معالجة الصورة.", threadID, messageID);
    }
  }
};
