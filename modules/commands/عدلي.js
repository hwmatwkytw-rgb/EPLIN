const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
    config: {
        name: 'عدلي',
        version: '1.0',
        author: 'محمد',
        countDown: 3,
        prefix: true,        // يحتاج بادئة مثل /
        noPrefix: false,
        groupAdminOnly: false,
        description: 'تعديل الصور بناءً على الوصف',
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

        // التحقق أن المستخدم رد على صورة
        if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
            return api.sendMessage('•-• الرجاء الرد على صورة مع كتابة /عدلي <الوصف>', threadID, messageID);
        }

        if (!description) {
            return api.sendMessage('•-• الرجاء كتابة وصف لتعديل الصورة', threadID, messageID);
        }

        const processingMsg = await api.sendMessage('•-• جاري تعديل الصورة...', threadID, messageID);
        const processingID = processingMsg.messageID;

        try {
            // رابط الصورة من الرسالة المردودة
            const imageUrl = event.messageReply.attachments[0].url;

            // تحميل الصورة مؤقتاً
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const tempImagePath = path.join(__dirname, `temp_${userId}.png`);
            fs.writeFileSync(tempImagePath, imageResponse.data);

            // إعداد FormData يدويًا
            const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
            let formData = "";
            formData += `--${boundary}\r\n`;
            formData += `Content-Disposition: form-data; name="image"; filename="image.png"\r\n`;
            formData += `Content-Type: image/png\r\n\r\n`;
            formData += fs.readFileSync(tempImagePath);
            formData += `\r\n--${boundary}\r\n`;
            formData += `Content-Disposition: form-data; name="prompt"\r\n\r\n${description}\r\n`;
            formData += `--${boundary}--\r\n`;

            // طلب تعديل الصورة من نفس API الموجود عندك
            const response = await axios({
                method: 'POST',
                url: 'https://api.deepai.org/hacking_is_a_serious_crime', // نفس API الموجود
                headers: {
                    'content-type': `multipart/form-data; boundary=${boundary}`,
                    'origin': 'https://deepai.org',
                    'user-agent': 'Mozilla/5.0'
                },
                data: formData,
                responseType: 'arraybuffer' // نستقبل الصورة مباشرة
            });

            const editedImagePath = path.join(__dirname, `edited_${userId}.png`);
            fs.writeFileSync(editedImagePath, response.data);

            // إرسال الصورة المعدلة للمستخدم
            await api.sendMessage({ attachment: fs.createReadStream(editedImagePath) }, threadID);

            // حذف الملفات المؤقتة
            fs.unlinkSync(tempImagePath);
            fs.unlinkSync(editedImagePath);

            await api.deleteMessage(processingID);

        } catch (error) {
            await api.editMessage(`•-• ❌ حصل خطأ: ${error.message}`, processingID);
        }
    },
};
