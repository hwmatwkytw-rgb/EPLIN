const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: 'اغنية',
        version: '2.0',
        author: 'محمد',
        countDown: 5,
        prefix: true, // يفضل يكون ببريفكس عشان ما يشتغل مع كل كلمة
        category: 'media',
        description: 'تحميل أغاني من يوتيوب بلسان ابلين المستفز',
        guide: {
            en: '{pn} <اسم الأغنية>'
        }
    },

    onStart: async ({ api, event, args }) => {
        const { threadID, messageID, senderID: userId } = event;
        const query = args.join(' ').trim();

        if (!query) {
            return api.sendMessage('•-• دايرة أغني ليك في إذنك؟ أكتب اسم الأغنية يا  🙄', threadID, messageID);
        }

        const infoMsg = await api.sendMessage('•-• لحظه من وقتك... 🥱', threadID, messageID);
        const processingID = infoMsg.messageID;

        try {
            // جلب رابط الـ API
            const getApi = await axios.get(`https://raw.githubusercontent.com/cyber-ullash/cyber-ullash/refs/heads/main/UllashApi.json`);
            const baseUrl = getApi.data.api;

            // البحث عن الأغنية
            const searchRes = await axios.get(`${baseUrl}/ytFullSearch?songName=${encodeURIComponent(query)}`);
            const results = searchRes.data.slice(0, 6);

            if (results.length === 0) {
                return api.editMessage('•-• ما لقيت شي.. غايتو ذوقك ده إلا في سوق الجمعة 😒', processingID);
            }

            // تجهيز قائمة النتائج بأسلوب ابلين
            let msg = "🎶 هاك دي الحاجات اللقيتها يا :\n\n";
            const thumbnails = [];

            // تأكد من وجود مجلد cache
            const cachePath = path.join(__dirname, 'cache');
            if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);

            for (let i = 0; i < results.length; i++) {
                msg += `${i + 1}. ${results[i].title}\n⏱️ الزمن: ${results[i].time}\n\n`;
            }

            api.editMessage(msg + "🔢 رد برقم الأغنية عشان أحملها ليك وسكتنا.. 🥱", processingID);

            // إضافة نظام الرد (Reply)
            if (global.client && global.client.handleReply) {
                global.client.handleReply.push({
                    name: 'اغنية', // يجب أن يطابق اسم الأمر في الـ config
                    messageID: processingID,
                    author: userId,
                    result: results,
                    baseUrl: baseUrl
                });
            }

        } catch (error) {
            console.error(error);
            api.editMessage(`•-• السيرفر قرف من أغانيك وضرب.. جرب تاني يا وهم 😒`, processingID);
        }
    },

    // نظام التعامل مع اختيار الرقم (Reply)
    onReply: async ({ api, event, handleReply }) => {
        const { threadID, messageID, body, senderID } = event;
        if (handleReply.author != senderID) return;

        try {
            const choice = parseInt(body);
            if (isNaN(choice) || choice > handleReply.result.length || choice <= 0) {
                return api.sendMessage("•-• ركز  .. قلت ليك رقم من 1 لـ 6 🙄", threadID, messageID);
            }

            api.unsendMessage(handleReply.messageID);
            const loading = await api.sendMessage("•-• جاري التحميل.. أصبر شوية ما تطير 📥🥱", threadID);

            const selected = handleReply.result[choice - 1];
            const downloadRes = await axios.get(`${handleReply.baseUrl}/ytDl3?link=${selected.id}&format=mp3`);
            
            const filePath = path.join(__dirname, 'cache', `music_${senderID}.mp3`);
            
            // تحميل الملف
            const response = await axios({
                method: 'get',
                url: downloadRes.data.downloadLink,
                responseType: 'arraybuffer'
            });

            fs.writeFileSync(filePath, Buffer.from(response.data));

            await api.sendMessage({
                body: `•-• هاك أغنيتك يا مزه:\n📌 العنوان: ${selected.title}\nسجمك ما تسمعها عالي! 💅😒`,
                attachment: fs.createReadStream(filePath)
            }, threadID, () => fs.unlinkSync(filePath), messageID);

            api.unsendMessage(loading.messageID);

        } catch (e) {
            api.sendMessage("•-• الملف كبير شديد على وشك ده.. ما قدرت أحمله 😒", threadID, messageID);
        }
    }
};
