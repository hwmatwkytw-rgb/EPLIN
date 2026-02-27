const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const OSS = require('ali-oss');

// دالة إعداد العميل
function setupImageEditClient() {
  const timestamp = Date.now();
  const anonymousId = uuidv4();
  const sboxGuid = Buffer.from(`${timestamp}|${Math.floor(Math.random() * 1000)}|${Math.floor(Math.random() * 1000000000)}`).toString('base64');
  
  const cookies = [
    `anonymous_user_id=${anonymousId}`,
    `i18n_redirected=en`,
    `sbox-guid=${sboxGuid}`
  ].join('; ');
  
  return axios.create({
    headers: {
      'Cookie': cookies,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
    }
  });
}

module.exports = {
  config: {
    name: "تعديل",
    aliases: ["edit", "ai_edit"],
    version: "2.0",
    author: "AYOUB",
    description: "تعديل الصور بالذكاء الاصطناعي مع الزخرفة الفخمة",
    countDown: 10,
    prefix: true,
    category: "ai"
  },

  onStart: async function({ api, event, args }) {
    const { threadID, messageID } = event;

    // التحقق من الرد على صورة
    if (event.type !== "message_reply" || !event.messageReply.attachments || event.messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮\n  ⚠️ عذراً.. يجب الرد على صورة!\n╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯", threadID, messageID);
    }

    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage("╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮\n  💡 أضف وصفاً للتعديل بعد الأمر\n  مثال: تعديل تحويل لكرتون\n╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯", threadID, messageID);
    }

    // رسالة الانتظار المزخرفة
    const waitingMsg = await api.sendMessage(
`╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮
      ✨ جـاري الـتـعديـل ✨

  •——◤ 🛠️ الأداة : AI Edit ◥——•
──────────────────
  •——◤ ⏳ الـحالة : قيد المعالجة ◥——•
      
╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`, threadID);

    const processingID = waitingMsg.messageID;
    const attachment = event.messageReply.attachments[0];
    const cacheDir = __dirname + "/cache";
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    try {
      const client = setupImageEditClient();

      // 1. الحصول على التوكن
      const stsRes = await client.get('https://notegpt.io/api/v1/oss/sts-token', { headers: { 'x-token': '' } });
      const stsData = stsRes.data.data;

      // 2. رفع الصورة إلى OSS
      const ossClient = new OSS({
        region: 'oss-us-west-1',
        accessKeyId: stsData.AccessKeyId,
        accessKeySecret: stsData.AccessKeySecret,
        stsToken: stsData.SecurityToken,
        bucket: 'nc-cdn'
      });
      
      const imgStream = await axios.get(attachment.url, { responseType: 'stream' });
      const ossPath = `notegpt/web3in1/${uuidv4()}.jpg`;
      await ossClient.putStream(ossPath, imgStream.data);
      const uploadedUrl = `https://nc-cdn.oss-us-west-1.aliyuncs.com/${ossPath}`;

      // 3. بدء عملية التعديل
      const editRes = await client.post('https://notegpt.io/api/v2/images/handle', {
        "image_url": uploadedUrl,
        "type": 60,
        "user_prompt": prompt,
        "aspect_ratio": "match_input_image",
        "num": 1, // تم تقليل العدد لسرعة الاستجابة
        "model": "google/nano-banana",
        "sub_type": 3
      });
      
      const sessionId = editRes.data.data.session_id;

      // 4. تتبع الحالة
      let results = null;
      for (let i = 0; i < 30; i++) {
        const statusRes = await client.get(`https://notegpt.io/api/v2/images/status?session_id=${sessionId}`);
        if (statusRes.data.data.status === 'succeeded') {
          results = statusRes.data.data.results;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 4000));
      }

      if (!results) throw new Error("Timeout");

      // 5. تحميل النتيجة وإرسالها
      const resultPath = cacheDir + `/edited_${Date.now()}.png`;
      const finalImg = await axios.get(results[0].url, { responseType: 'stream' });
      const writer = fs.createWriteStream(resultPath);
      finalImg.data.pipe(writer);

      await new Promise((resolve) => writer.on('finish', resolve));

      api.unsendMessage(processingID);
      
      api.sendMessage({
        body: 
`╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮
      ✨ تـم الـتـعديـل بـنـجـاح ✨

  •——◤ 🖼️ الـحالة : نـجـاح ◥——•
──────────────────
  •——◤ 👤 الـطلب : ${prompt} ◥——•
      
╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯`,
        attachment: fs.createReadStream(resultPath)
      }, threadID, () => fs.unlinkSync(resultPath), messageID);

    } catch (error) {
      console.error(error);
      api.editMessage("╭━─━─━─≪ ஜ▲ஜ ≫─━─━─━╮\n  ❌ فشل تعديل الصورة\n╰━─━─━─≪ ஜ▼ஜ ≫─━─━─━╯", processingID);
    }
  }
};
