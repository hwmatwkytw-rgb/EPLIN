const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const OSS = require('ali-oss');

module.exports = {
    config: {
        name: 'عدلي',
        version: '1.0',
        author: 'محمد',
        countDown: 3,
        prefix: true,
        noPrefix: false,
        groupAdminOnly: false,
        description: 'تعديل الصور باستخدام AI بدون API Key',
        category: 'ai',
        guide: {
            en: '{pn} <الوصف> - رد على صورة ليتم تعديلها'
        },
    },

    onStart: async ({ api, event, args }) => {
        const threadID = event.threadID;
        const messageID = event.messageID;
        const userId = event.senderID;
        const description = args.join(' ').trim();

        if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
            return api.sendMessage('•-• الرجاء الرد على صورة مع كتابة /عدلي <الوصف>', threadID, messageID);
        }

        if (!description) {
            return api.sendMessage('•-• الرجاء كتابة وصف لتعديل الصورة', threadID, messageID);
        }

        const processingMsg = await api.sendMessage('•-• 🎨 جاري تعديل الصورة...', threadID, messageID);
        const processingID = processingMsg.messageID;

        try {
            const attachment = event.messageReply.attachments[0];
            if (attachment.type !== 'photo') return api.editMessage('•-• ❌ هذا ليس صورة', processingID);

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

            // تحميل الصورة مؤقتًا
            const tempPath = path.join(cacheDir, `temp_${userId}.png`);
            const imageResp = await axios.get(attachment.url, { responseType: 'arraybuffer' });
            fs.writeFileSync(tempPath, imageResp.data);

            // ======================
            // إعداد Notegpt Client
            // ======================
            const timestamp = Date.now();
            const anonymousId = uuidv4();
            const sboxGuid = Buffer.from(`${timestamp}|${Math.floor(Math.random()*1000)}|${Math.floor(Math.random()*1000000000)}`).toString('base64');
            const cookies = [
                `anonymous_user_id=${anonymousId}`,
                `i18n_redirected=en`,
                `_ga_PFX3BRW5RQ=GS2.1.s${timestamp}$o1$g0$t${timestamp}$j60$l0$h${timestamp+100000}`,
                `_ga=GA1.1.${Math.floor(Math.random()*2000000000)}.${timestamp}`,
                `sbox-guid=${sboxGuid}`
            ].join('; ');

            const client = axios.create({ headers: { 'Cookie': cookies, 'User-Agent': 'Mozilla/5.0' } });

            // الحصول على STS Token
            const stsRes = await client.get('https://notegpt.io/api/v1/oss/sts-token', { headers:{ 'accept':'*/*','x-token':'' } });
            if(stsRes.data.code !== 100000) throw new Error('فشل في الحصول على STS Token');
            const stsData = stsRes.data.data;

            // رفع الصورة على OSS
            const ossClient = new OSS({
                region:'oss-us-west-1',
                accessKeyId:stsData.AccessKeyId,
                accessKeySecret:stsData.AccessKeySecret,
                stsToken:stsData.SecurityToken,
                bucket:'nc-cdn'
            });
            const ossPath = `notegpt/web3in1/${uuidv4()}.jpg`;
            const stream = fs.createReadStream(tempPath);
            await ossClient.putStream(ossPath, stream);
            const uploadedUrl = `https://nc-cdn.oss-us-west-1.aliyuncs.com/${ossPath}`;

            // بدء تحرير الصورة
            const startRes = await client.post('https://notegpt.io/api/v2/images/handle',{
                image_url: uploadedUrl,
                type:60,
                user_prompt:description,
                aspect_ratio:'match_input_image',
                num:4,
                model:'google/nano-banana',
                sub_type:3
            },{ headers:{ 'accept':'application/json, text/plain, */*' } });

            if(startRes.data.code !== 100000) throw new Error('فشل في بدء تحرير الصورة');
            const sessionId = startRes.data.data.session_id;

            // متابعة حالة التحرير
            let attempts = 0, results;
            while(attempts<30){
                const statusRes = await client.get(`https://notegpt.io/api/v2/images/status?session_id=${sessionId}`,{ headers:{ 'accept':'application/json, text/plain, */*' } });
                if(statusRes.data.code===100000){
                    const status = statusRes.data.data.status;
                    if(status==='succeeded'){ results = statusRes.data.data.results; break; }
                    else if(status==='failed') throw new Error('فشل في تحرير الصورة');
                }
                attempts++;
                await new Promise(r=>setTimeout(r,4000));
            }
            if(!results) throw new Error('انتهت مهلة انتظار تحرير الصورة');

            // تحميل الصور المعدلة وإرسالها
            const editedImages = [];
            const filesToDelete = [];
            for(let i=0;i<results.length;i++){
                const url = results[i].url;
                const filePath = path.join(cacheDir, `edited_${userId}_${i+1}.png`);
                const imgRes = await axios.get(url,{responseType:'stream'});
                const writer = fs.createWriteStream(filePath);
                imgRes.data.pipe(writer);
                await new Promise((resolve,reject)=>{writer.on('finish',resolve); writer.on('error',reject);});
                editedImages.push(fs.createReadStream(filePath));
                filesToDelete.push(filePath);
            }

            if(editedImages.length===0) return api.editMessage('❌ فشل في تحميل الصور المحررة', processingID);

            await api.sendMessage({ body:"✨ تم تعديل الصورة بنجاح", attachment:editedImages }, threadID);

            // حذف الملفات المؤقتة
            setTimeout(()=>filesToDelete.forEach(f=>fs.existsSync(f)&&fs.unlinkSync(f)),3000);
            fs.unlinkSync(tempPath);
            await api.deleteMessage(processingID);

        } catch(error){
            console.error(error);

            let errorMessage = `•-• ❌ حصل خطأ: ${error.message}`;
            if(error.response){
                errorMessage += `\nStatus Code: ${error.response.status}`;
                errorMessage += `\nResponse Data: ${JSON.stringify(error.response.data).substring(0,1000)}`;
            }

            await api.editMessage(errorMessage, processingID);
        }
    },
};
