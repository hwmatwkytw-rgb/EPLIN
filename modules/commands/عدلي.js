const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const OSS = require('ali-oss');

module.exports = {
  config: {
    name: 'عدلي',
    version: '2.0',
    author: 'AbuUbaida - Modified',
    countDown: 5,
    prefix: true,
    category: 'ai',
    description: 'تعديل الصور بالذكاء الاصطناعي - نسخة محسنة وثابتة',
    guide: { ar: '{pn} <وصف التعديل>' },
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, senderID, messageReply } = event;
    const description = args.join(' ').trim();

    if (!messageReply || !messageReply.attachments || messageReply.attachments[0].type !== 'photo') {
      return api.sendMessage('⚠️ لازم ترد على صورة.', threadID, messageID);
    }

    if (!description) {
      return api.sendMessage('⚠️ اكتب وصف التعديل بعد الأمر.', threadID, messageID);
    }

    const processingMsg = await api.sendMessage('🎨 جاري التعديل... انتظر قليلاً.', threadID);

    try {
      /* 1️⃣ ترجمة */
      const trans = await axios.get(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(description)}`
      );
      const translatedText = trans.data[0][0][0];

      /* 2️⃣ تجهيز مجلد الكاش */
      const cacheDir = path.resolve(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const tempPath = path.join(cacheDir, `input_${uuidv4()}.jpg`);
      const finalPath = path.join(cacheDir, `output_${uuidv4()}.jpg`);

      /* 3️⃣ تحميل الصورة */
      const imgBuffer = await axios.get(messageReply.attachments[0].url, { responseType: 'arraybuffer' });
      fs.writeFileSync(tempPath, imgBuffer.data);

      /* 4️⃣ إعداد جلسة NoteGPT */
      const sessionCookie = `anonymous_user_id=${uuidv4()}; sbox-guid=${uuidv4()}`;
      const client = axios.create({
        headers: {
          'Cookie': sessionCookie,
          'User-Agent': 'Mozilla/5.0',
          'Origin': 'https://notegpt.io',
          'Referer': 'https://notegpt.io/ai-image-editor'
        }
      });

      /* 5️⃣ رفع الصورة لـ OSS */
      const sts = await client.get('https://notegpt.io/api/v1/oss/sts-token');

      const oss = new OSS({
        region: 'oss-us-west-1',
        accessKeyId: sts.data.data.AccessKeyId,
        accessKeySecret: sts.data.data.AccessKeySecret,
        stsToken: sts.data.data.SecurityToken,
        bucket: 'nc-cdn'
      });

      const ossName = `notegpt/web3in1/${uuidv4()}.jpg`;
      await oss.put(ossName, tempPath);

      const imgUrl = `https://nc-cdn.oss-us-west-1.aliyuncs.com/${ossName}`;

      /* 6️⃣ إرسال طلب التعديل (نسخة قوية) */
      const start = await client.post('https://notegpt.io/api/v2/images/handle', {
        image_url: imgUrl,
        user_prompt: `Ultra realistic detailed edit, clearly modify the image: ${translatedText}, keep same face and identity`,
        negative_prompt: "low quality, blurry, distorted, unchanged image",
        model: "stabilityai/stable-diffusion-xl-base-1.0",
        type: 60,
        sub_type: 4,
        num: 1,
        aspect_ratio: "match_input_image",
        strength: 0.9
      });

      if (start.data.code !== 100000)
        throw new Error('السيرفر رفض الطلب.');

      /* 7️⃣ متابعة الحالة */
      let resultUrl = null;

      for (let i = 0; i < 25; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const status = await client.get(
          `https://notegpt.io/api/v2/images/status?session_id=${start.data.data.session_id}`
        );

        if (status.data.data.status === 'succeeded') {
          resultUrl = status.data.data.results[0].url;
          break;
        }
      }

      if (!resultUrl)
        throw new Error('انتهت المهلة، السيرفر بطيء.');

      if (resultUrl === imgUrl)
        throw new Error('لم يتم تعديل الصورة (رجع نفس الأصل).');

      /* 8️⃣ تحميل النتيجة */
      const resImg = await axios.get(resultUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(finalPath, resImg.data);

      await api.sendMessage({
        body: `✨ تم التعديل بنجاح!\n📝 التعديل المفهوم: ${translatedText}`,
        attachment: fs.createReadStream(finalPath)
      }, threadID);

      /* 9️⃣ تنظيف */
      [tempPath, finalPath].forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
      api.deleteMessage(processingMsg.messageID);

    } catch (err) {
      console.error(err);
      api.editMessage(`❌ فشل التعديل:\n${err.message}`, processingMsg.messageID);
    }
  }
};
