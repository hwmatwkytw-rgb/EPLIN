const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

module.exports = {
    config: {
        name: 'عدلي',
        version: '1.0',
        author: 'محمد',
        countDown: 3,
        prefix: true,
        noPrefix: false,
        groupAdminOnly: false,
        description: 'تعديل الصور باستخدام DeepAI بدون مشاكل',
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

            // إعداد FormData لطلب DeepAI
            const form = new FormData();
            form.append('image', fs.createReadStream(tempPath));
            form.append('prompt', description);

            // استدعاء DeepAI Image Editor API
            const response = await axios.post(
                'https://api.deepai.org/api/image-editor',
                form,
                {
                    headers: {
                        'Api-Key': 'YOUR_DEEPAI_API_KEY', // ضع مفتاحك هنا
                        ...form.getHeaders()
                    }
                }
            );

            if (!response.data.output_url) throw new Error('❌ فشل في تعديل الصورة');

            // تحميل الصورة المعدلة
            const editedImageResp = await axios.get(response.data.output_url, { responseType: 'arraybuffer' });
            const editedPath = path.join(cacheDir, `edited_${userId}.png`);
            fs.writeFileSync(editedPath, editedImageResp.data);

            // إرسال الصورة المعدلة
            await api.sendMessage({ attachment: fs.createReadStream(editedPath) }, threadID);

            // حذف الملفات المؤقتة
            fs.unlinkSync(tempPath);
            fs.unlinkSync(editedPath);
            await api.deleteMessage(processingID);

        } catch (error) {
            console.error(error);
            await api.editMessage(`•-• ❌ حصل خطأ: ${error.message}`, processingID);
        }
    },
};
