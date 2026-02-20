const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const OSS = require('ali-oss');

module.exports = {
    config: {
        name: 'عدلي',
        version: '1.3',
        author: 'محمد',
        countDown: 5,
        prefix: true,
        category: 'ai',
        description: 'تعديل الصور بالذكاء الاصطناعي - نسخة مستقرة',
        guide: { en: '{pn} <الوصف>' },
    },

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, senderID, messageReply } = event;
        const description = args.join(' ').trim();

        if (!messageReply || !messageReply.attachments || messageReply.attachments[0].type !== 'photo') {
            return api.sendMessage('•-• ⚠️ رد على صورة واكتب التعديل المطلوب.', threadID, messageID);
        }

        if (!description) {
            return api.sendMessage('•-• ⚠️ يرجى كتابة وصف للتعديل (مثال: تغيير لون العين للأزرق).', threadID, messageID);
        }

        const processingMsg = await api.sendMessage('•-• 🎨 جاري التعديل... قد يستغرق الأمر 20 ثانية.', threadID, messageID);

        try {
            // 1. ترجمة الوصف (ضرورية لأن الموديل لا يدعم العربية في التعديل)
            const trans = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(description)}`);
            const translatedText = trans.data[0][0][0];

            const cacheDir = path.resolve(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
            const tempPath = path.join(cacheDir, `in_${senderID}.png`);

            // تحميل الصورة
            const imgBuffer = await axios.get(messageReply.attachments[0].url, { responseType: 'arraybuffer' });
            fs.writeFileSync(tempPath, imgBuffer.data);

            // 2. إعداد الاتصال بـ NoteGPT
            const sessionCookie = `anonymous_user_id=${uuidv4()}; sbox-guid=${uuidv4()}`;
            const client = axios.create({
                headers: {
                    'Cookie': sessionCookie,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Origin': 'https://notegpt.io',
                    'Referer': 'https://notegpt.io/ai-image-editor'
                }
            });

            // 3. الحصول على التوكن والرفع
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

            // 4. طلب التعديل الفعلي
            // ملاحظة: استخدمنا sub_type: 4 وموديل SDXL لضمان التغيير
            const start = await client.post('https://notegpt.io/api/v2/images/handle', {
                image_url: imgUrl,
                user_prompt: `High quality edit, ${translatedText}`,
                negative_prompt: "low quality, blurry, distorted",
                model: "stabilityai/stable-diffusion-xl-base-1.0",
                type: 60,
                sub_type: 4,
                num: 1,
                aspect_ratio: "match_input_image",
                strength: 0.75 // القوة هنا تضمن أن يتم التعديل وليس فقط النسخ
            });

            if (start.data.code !== 100000) throw new Error('السيرفر رفض الطلب، حاول لاحقاً.');

            // 5. متابعة الحالة
            let resultUrl = null;
            for (let i = 0; i < 30; i++) {
                await new Promise(r => setTimeout(r, 3000));
                const status = await client.get(`https://notegpt.io/api/v2/images/status?session_id=${start.data.data.session_id}`);
                if (status.data.data.status === 'succeeded') {
                    resultUrl = status.data.data.results[0].url;
                    break;
                }
            }

            if (!resultUrl) throw new Error('انتهت المهلة، السيرفر بطيء جداً.');

            // 6. إرسال النتيجة
            const finalPath = path.join(cacheDir, `out_${senderID}.png`);
            const resImg = await axios.get(resultUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(finalPath, resImg.data);

            await api.sendMessage({
                body: `✨ تم التعديل!\n📝 تم فهم طلبك كـ: ${translatedText}`,
                attachment: fs.createReadStream(finalPath)
            }, threadID);

            // تنظيف
            [tempPath, finalPath].forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
            api.deleteMessage(processingMsg.messageID);

        } catch (e) {
            console.error(e);
            api.editMessage(`•-• ❌ فشل: ${e.message}`, processingMsg.messageID);
        }
    }
};
