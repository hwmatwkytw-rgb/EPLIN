const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const OSS = require('ali-oss');

module.exports = {
    config: {
        name: 'عدلي',
        version: '1.1',
        author: 'محمد',
        countDown: 5,
        prefix: true,
        category: 'ai',
        description: 'تعديل الصور بالذكاء الاصطناعي مع ترجمة تلقائية للأوامر',
        guide: { en: '{pn} <الوصف بالترجمة>' },
    },

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, senderID, messageReply } = event;
        let description = args.join(' ').trim();

        if (!messageReply || !messageReply.attachments || messageReply.attachments[0].type !== 'photo') {
            return api.sendMessage('•-• ⚠️ يرجى الرد على صورة مع كتابة الوصف (مثلاً: حولها لكرتون)', threadID, messageID);
        }

        if (!description) {
            return api.sendMessage('•-• ⚠️ يرجى كتابة وصف للتعديل المطلوب', threadID, messageID);
        }

        const processingMsg = await api.sendMessage('•-• 🎨 جاري معالجة طلبك وترجمة الوصف...', threadID, messageID);

        try {
            // 1. ترجمة الوصف للإنجليزية لضمان أفضل نتيجة من الموديل
            const translationRes = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(description)}`);
            const translatedDescription = translationRes.data[0][0][0];

            const attachmentUrl = messageReply.attachments[0].url;
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

            const tempPath = path.join(cacheDir, `input_${senderID}.png`);
            const imageResp = await axios.get(attachmentUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(tempPath, imageResp.data);

            // 2. إعداد جلسة NoteGPT
            const timestamp = Date.now();
            const anonymousId = uuidv4();
            const cookies = `anonymous_user_id=${anonymousId}; i18n_redirected=en; sbox-guid=${uuidv4()}`;
            const client = axios.create({ headers: { 'Cookie': cookies, 'User-Agent': 'Mozilla/5.0' } });

            // 3. رفع الصورة
            const stsRes = await client.get('https://notegpt.io/api/v1/oss/sts-token');
            const stsData = stsRes.data.data;
            const ossClient = new OSS({
                region: 'oss-us-west-1',
                accessKeyId: stsData.AccessKeyId,
                accessKeySecret: stsData.AccessKeySecret,
                stsToken: stsData.SecurityToken,
                bucket: 'nc-cdn'
            });

            const ossPath = `notegpt/web3in1/${uuidv4()}.jpg`;
            await ossClient.put(ossPath, tempPath);
            const uploadedUrl = `https://nc-cdn.oss-us-west-1.aliyuncs.com/${ossPath}`;

            // 4. طلب التعديل (إرسال الوصف المترجم)
            const startRes = await client.post('https://notegpt.io/api/v2/images/handle', {
                image_url: uploadedUrl,
                type: 60,
                user_prompt: translatedDescription, // النص المترجم هنا
                aspect_ratio: 'match_input_image',
                num: 1, // صورة واحدة لسرعة الاستجابة
                model: 'google/nano-banana',
                sub_type: 3
            });

            if (startRes.data.code !== 100000) throw new Error('فشل بدء المعالجة');
            const sessionId = startRes.data.data.session_id;

            // 5. مراقبة الحالة
            let results = null;
            for (let i = 0; i < 20; i++) {
                await new Promise(r => setTimeout(r, 3000));
                const statusRes = await client.get(`https://notegpt.io/api/v2/images/status?session_id=${sessionId}`);
                if (statusRes.data.data.status === 'succeeded') {
                    results = statusRes.data.data.results;
                    break;
                } else if (statusRes.data.data.status === 'failed') throw new Error('فشلت العملية في السيرفر');
            }

            if (!results) throw new Error('استغرق الأمر وقتاً طويلاً');

            // 6. إرسال النتيجة
            const resultUrl = results[0].url;
            const finalImagePath = path.join(cacheDir, `result_${senderID}.png`);
            const finalImgRes = await axios.get(resultUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(finalImagePath, finalImgRes.data);

            await api.sendMessage({
                body: `✨ تم التعديل بنجاح!\n📝 الوصف المترجم: ${translatedDescription}`,
                attachment: fs.createReadStream(finalImagePath)
            }, threadID);

            // تنظيف الملفات
            fs.unlinkSync(tempPath);
            fs.unlinkSync(finalImagePath);
            await api.deleteMessage(processingMsg.messageID);

        } catch (error) {
            console.error(error);
            api.sendMessage(`•-• ❌ خطأ: ${error.message}`, threadID, messageID);
        }
    }
};
