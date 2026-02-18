const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { log } = require('../../logger/logger');

module.exports = {
    config: {
        name: "قبلة",
        aliases: [],
        author: "Hridoy",
        countDown: 2,
        role: 0,
        description: "إنشاء صورة قبلة بين صاحب الأمر والشخص المذكور أو صاحب الرد.",
        category: "fun",
        guide: {
            ar: "   {pn} @شخص أو رد على رسالة: إنشاء صورة قبلة بينك وبين الشخص."
        }
    },

    onStart: async ({ event, api }) => {
        try {
            const chatId = event.threadID;
            const userId = event.senderID;
            const messageId = event.messageID;

            // التفاعل بالقلب 💕 على رسالة المستخدم فوراً
            api.setMessageReaction("💕", messageId, (err) => {}, true);

            const commandUserInfo = await api.getUserInfo(userId);
            const commandUsername = commandUserInfo[userId]?.name || 'مستخدم';
            const commandUserAvatar = `https://graph.facebook.com/${userId}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

            let targetUserId;
            if (event.messageReply) {
                targetUserId = event.messageReply.senderID;
            } else if (event.mentions && Object.keys(event.mentions).length > 0) {
                targetUserId = Object.keys(event.mentions)[0];
            } else {
                return api.sendMessage(
                    '❌ منشن شخص أو رد على رسالته أولاً.',
                    chatId,
                    messageId
                );
            }

            if (targetUserId === userId) {
                return api.sendMessage(
                    '😅 ما ممكن تبوس نفسك!',
                    chatId,
                    messageId
                );
            }

            const targetUserInfo = await api.getUserInfo(targetUserId);
            const targetUsername = targetUserInfo[targetUserId]?.name || 'مستخدم';
            const targetUserAvatar = `https://graph.facebook.com/${targetUserId}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

            const genderApiBase = 'https://hridoy-apis.vercel.app/tools/gender-predict';
            const [commandGenderRes, targetGenderRes] = await Promise.all([
                axios.get(`${genderApiBase}?name=${encodeURIComponent(commandUsername)}&apikey=hridoyXQC`),
                axios.get(`${genderApiBase}?name=${encodeURIComponent(targetUsername)}&apikey=hridoyXQC`)
            ]);

            const commandGender = commandGenderRes.data?.gender || 'unknown';
            const targetGender = targetGenderRes.data?.gender || 'unknown';

            let avatar1, avatar2;
            if (commandGender === 'female' || (commandGender === 'unknown' && targetGender === 'male')) {
                avatar1 = commandUserAvatar;
                avatar2 = targetUserAvatar;
            } else {
                avatar1 = targetUserAvatar;
                avatar2 = commandUserAvatar;
            }

            const apiUrl = `https://hridoy-apis.vercel.app/canvas/kiss?avatar1=${encodeURIComponent(avatar1)}&avatar2=${encodeURIComponent(avatar2)}&apikey=hridoyXQC`;
            const tempDir = path.join(__dirname, '..', '..', 'temp');
            const tempFilePath = path.join(tempDir, `${userId}_${Date.now()}.png`);

            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }

            try {
                const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
                if (response.status !== 200) {
                    throw new Error('فشل إنشاء الصورة');
                }
                fs.writeFileSync(tempFilePath, Buffer.from(response.data, 'binary'));
            } catch (err) {
                log('error', `فشل تحميل صورة القبلة: ${err.message}`);
                return api.sendMessage(
                    '❌ حصل خطأ أثناء إنشاء الصورة، حاول مرة تانية.',
                    chatId,
                    messageId
                );
            }

            const caption = `🙅 قبلة بين ${commandUsername} و ${targetUsername}`;
            try {
                api.sendMessage({
                    body: caption,
                    mentions: [
                        { tag: commandUsername, id: userId },
                        { tag: targetUsername, id: targetUserId }
                    ],
                    attachment: fs.createReadStream(tempFilePath)
                }, chatId, () => {
                    try {
                        fs.unlinkSync(tempFilePath);
                    } catch (err) {
                        log('error', `فشل حذف الملف المؤقت: ${err.message}`);
                    }
                }, messageId); // جعل الرد كـ Reply
            } catch (err) {
                log('error', `خطأ في إرسال الرسالة: ${err.message}`);
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (e) {}
                return api.sendMessage(
                    '⚠️ حصل خطأ أثناء إرسال الصورة.',
                    chatId,
                    messageId
                );
            }

            log('info', `قبلة: ${userId} -> ${targetUserId} في ${chatId}`);
        } catch (error) {
            log('error', `خطأ أمر قبلة: ${error?.message || error}`);
            if (event && event.threadID)
                api.sendMessage('❌ حصل خطأ غير متوقع، حاول لاحقاً.', event.threadID);
        }
    }
};

process.on('unhandledRejection', (reason) => {
    log('error', 'Unhandled Promise Rejection: ' + (reason?.message || reason));
});
