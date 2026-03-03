const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: 'إشعار',
        version: '1.2',
        author: 'سينكو',
        countDown: 5,
        prefix: true,
        adminOnly: true,
        description: 'إرسال إشعار إلى جميع المجموعات بزخرفة المسار الطولي.',
        category: 'admin',
        guide: {
            ar: '{pn} <النص> (أو الرد على صورة/فيديو مع النص)'
        },
    },

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, messageReply } = event;

        const text = args.join(' ').trim();
        if (!text) {
            return api.sendMessage(
                "●───── ⌬ ─────●\n" +
                "┇ ⚠️ يرجى كتابة النص\n" +
                "●───── ⌬ ─────●",
                threadID,
                messageID
            );
        }

        try {
            const sendTime = new Date().toLocaleString('ar-EG', { hour12: true, hour: 'numeric', minute: 'numeric' });

            const allThreads = await api.getThreadList(100, null, ['INBOX']);
            const groupThreads = allThreads.filter(
                t => t.isGroup && t.participantIDs.includes(api.getCurrentUserID())
            );

            if (groupThreads.length === 0) {
                return api.sendMessage('⚠️ لا توجد مجموعات مفعّل فيها البوت.', threadID, messageID);
            }

            let attachments = [];
            if (messageReply && messageReply.attachments?.length > 0) {
                const cacheDir = path.resolve(__dirname, 'cache');
                await fs.ensureDir(cacheDir);

                for (const attachment of messageReply.attachments) {
                    const url = attachment.url || (attachment.type === 'photo' ? attachment.largePreviewUrl : null);
                    if (!url) continue;

                    const filePath = path.resolve(cacheDir, `notify_${Date.now()}.png`);
                    const res = await axios.get(url, { responseType: 'arraybuffer' });
                    await fs.writeFile(filePath, res.data);
                    attachments.push(fs.createReadStream(filePath));
                }
            }

            // --- صياغة الرسالة بالستايل الطولي المختار ---
            const notificationMessage =
                `●─────── ⌬ ───────●\n` +
                `┇ ⦿ ⟬ إشـعـار إداري ⟭\n` +
                `┇\n` +
                `┇  الـمـرسل: المطور\n` +
                `┇  الـرسـالـة: \n` +
                `┇ 『 ${text} 』\n` +
                `┇\n` +
                `┇  الـتـوقـيـت: ${sendTime}\n` +
                `●─────── ⌬ ───────●`;

            let successCount = 0;
            for (const thread of groupThreads) {
                await new Promise(resolve => {
                    api.sendMessage({
                        body: notificationMessage,
                        attachment: attachments.length ? attachments : undefined
                    }, thread.threadID, (err) => {
                        if (!err) successCount++;
                        resolve();
                    });
                });
            }

            // تنظيف الكاش
            attachments.forEach(s => { if (fs.existsSync(s.path)) fs.unlinkSync(s.path); });

            return api.sendMessage(
                `●────── ⌬ ──────●\n` +
                `┇ ✅ تـم الإرسـال بـنـجـاح\n` +
                `┇  لـعـدد: 〖 ${successCount} 〗 مـجـمـوعـة\n` +
                `●────── ⌬ ──────●`,
                threadID,
                messageID
            );

        } catch (err) {
            console.error(err);
            api.sendMessage('❌ حدث خطأ أثناء إرسال الإشعار.', threadID, messageID);
        }
    },
};
