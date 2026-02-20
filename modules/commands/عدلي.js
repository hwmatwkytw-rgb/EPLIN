const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const OSS = require('ali-oss');

module.exports = {
  config: {
    name: 'عدلي',
    version: '3.0',
    author: 'AbuUbaida - Ultra Fixed',
    countDown: 5,
    prefix: true,
    category: 'ai',
    description: 'تعديل الصور بالذكاء الاصطناعي - نسخة ثابتة ومحسنة',
    guide: { ar: '{pn} <وصف التعديل>' },
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, messageID, messageReply } = event;
    const description = args.join(' ').trim();

    if (!messageReply || !messageReply.attachments || messageReply.attachments[0].type !== 'photo') {
      return api.sendMessage('⚠️ لازم ترد على صورة.', threadID, messageID);
    }

    if (!description) {
      return api.sendMessage('⚠️ اكتب وصف التعديل بعد الأمر.', threadID, messageID);
    }

    const processingMsg = await api.sendMessage('🎨 جاري التعديل... انتظر قليلاً.', threadID);

    let tempPath = null;
    let finalPath = null;

    try {

      /* 1️⃣ ترجمة */
      const trans = await axios.get(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(description)}`
      );
      const translatedText = trans.data[0][0][0];

      /* 2️⃣ تجهيز الكاش */
      const cacheDir = path.resolve(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      tempPath = path.join(cacheDir, `input_${uuidv4()}.jpg`);
      finalPath = path.join(cacheDir, `output_${uuidv4()}.jpg`);

      /* 3️⃣ تحميل الصورة */
      const imgBuffer = await axios.get(messageReply.attachments[0].url, { responseType: 'arraybuffer' });
      fs.writeFileSync(tempPath, imgBuffer.data);

      /* 4️⃣ إعداد جلسة */
      const sessionCookie = `anonymous_user_id=${uuidv4()}; sbox-guid=${uuidv4()}`;
      const client = axios.create({
        headers: {
          'Cookie': sessionCookie,
          'User-Agent': 'Mozilla/5.0',
          'Origin': 'https://notegpt.io',
          'Referer': 'https://notegpt.io/ai-image-editor'
        },
        timeout: 60000
      });

      /* 5️⃣ الحصول على STS */
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

      /* 6️⃣ إرسال طلب التعديل (محاولة مع إعادة) */
      let start;
      let attempts = 0;

      while (attempts < 2) {
        start = await client.post('https://notegpt.io/api/v2/images/handle', {
          image_url: imgUrl,
          user_prompt: `Transform the image clearly and noticeably: ${translatedText}. 
Keep same person identity but apply strong visible changes.`,
          negative_prompt: "low quality, blurry, distorted, unchanged image",
          model: "stabilityai/stable-diffusion-xl-base-1.0",
          type: 60,
          sub_type: 4,
          num: 1,
          aspect_ratio: "match_input_image",
          strength: 0.7
        });

        if (start.data.code === 100000) break;

        attempts++;
        await new Promise(r => setTimeout(r, 2000));
      }

      if (!start || start.data.code !== 100000)
        throw new Error('السيرفر رفض الطلب.');

      /* 7️⃣ متابعة الحالة */
      let resultUrl = null;

      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 3000));

        const status = await client.get(
          `https://notegpt.io/api/v2/images/status?session_id=${start.data.data.session_id}`
        );

        if (status.data.data.status === 'succeeded') {
          resultUrl = status.data.data.results[0]?.url;
          break;
        }

        if (status.data.data.status === 'failed') {
          throw new Error('فشل المعالجة من السيرفر.');
        }
      }

      if (!resultUrl)
        throw new Error('انتهت المهلة، السيرفر بطيء.');

      /* 8️⃣ تحميل النتيجة */
      const resImg = await axios.get(resultUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(finalPath, resImg.data);

      await api.sendMessage({
        body: `✨ تم التعديل بنجاح!\n📝 التعديل المفهوم: ${translatedText}`,
        attachment: fs.createReadStream(finalPath)
      }, threadID);

    } catch (err) {
      console.error(err);
      await api.editMessage(`❌ فشل التعديل:\n${err.message}`, processingMsg.messageID);
    } finally {

      /* 9️⃣ تنظيف */
      [tempPath, finalPath].forEach(p => {
        if (p && fs.existsSync(p)) fs.unlinkSync(p);
      });

      if (processingMsg?.messageID)
        api.deleteMessage(processingMsg.messageID).catch(() => {});
    }
  }
};
