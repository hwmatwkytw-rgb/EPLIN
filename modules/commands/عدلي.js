const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

            const tempDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const tempPath = path.join(tempDir, `temp_${userId}.png`);
            const imageResp = await axios.get(attachment.url, { responseType: 'arraybuffer' });
            fs.writeFileSync(tempPath, imageResp.data);

            // إرسال الصورة مباشرة لـ Notegpt API بدون رفع OSS
            const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
            let formData = "";
            formData += `--${boundary}\r\n`;
            formData += `Content-Disposition: form-data; name="image"; filename="image.png"\r\n`;
            formData += `Content-Type: image/png\r\n\r\n`;
            formData += fs.readFileSync(tempPath);
            formData += `\r\n--${boundary}\r\n`;
            formData += `Content-Disposition: form-data; name="prompt"\r\n\r\n${description}\r\n`;
            formData += `--${boundary}--\r\n`;

            const response = await axios({
                method: 'POST',
                url: 'https://api.deepai.org/hacking_is_a_serious_crime',
                headers: {
                    'content-type': `multipart/form-data; boundary=${boundary}`,
                    'origin': 'https://deepai.org',
                    'user-agent': 'Mozilla/5.0'
                },
                data: formData,
                responseType: 'arraybuffer'
            });

            const editedPath = path.join(tempDir, `edited_${userId}.png`);
            fs.writeFileSync(editedPath, response.data);

            await api.sendMessage({ attachment: fs.createReadStream(editedPath) }, threadID);

            fs.unlinkSync(tempPath);
            fs.unlinkSync(editedPath);
            await api.deleteMessage(processingID);

        } catch (error) {
            console.error(error);
            await api.editMessage(`•-• ❌ حصل خطأ: ${error.message}`, processingID);
        }
    },
};
