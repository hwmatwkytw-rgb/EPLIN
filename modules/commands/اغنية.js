const axios = require("axios");
const fs = require('fs-extra'); // استخدام fs-extra لضمان توافق أفضل مع Kenji

const baseApiUrl = async () => {
    try {
        const base = await axios.get(`https://raw.githubusercontent.com/cyber-ullash/cyber-ullash/refs/heads/main/UllashApi.json`);
        return base.data.api;
    } catch (e) {
        return "https://api.kenji-api.site"; // رابط احتياطي في حال فشل الرابط الأساسي
    }
};

module.exports.config = {
    name: "اغنية",
    version: "2.1.0",
    aliases: ["music", "play"],
    credits: "bela (Modified for Kenji)",
    countDown: 5,
    hasPermssion: 0,
    description: "تحميل مقاطع صوتية من يوتيوب",
    commandCategory: "media",
    usages: "{pn} [اسم الأغنية أو الرابط]",
    usePrefix: true
};

module.exports.run = async ({ api, args, event }) => {
    const { threadID, messageID, senderID } = event;
    const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    
    if (!args[0]) return api.sendMessage("⚠️ يرجى إدخال اسم الأغنية أو الرابط!", threadID, messageID);

    try {
        let videoID;
        const urlYtb = checkurl.test(args[0]);

        if (urlYtb) {
            const match = args[0].match(checkurl);
            videoID = match ? match[1] : null;
            api.sendMessage("⏳ جارٍ التحميل، يرجى الانتظار...", threadID, messageID);
            
            const apiUrl = await baseApiUrl();
            const { data } = await axios.get(`${apiUrl}/ytDl3?link=${videoID}&format=mp3`);
            
            const path = __dirname + `/cache/sing_${senderID}.mp3`;
            const audioStream = await getStream(data.downloadLink, path);

            return api.sendMessage({
                body: `🎵 تم التحميل بنجاح:\n📌 العنوان: ${data.title}`,
                attachment: audioStream
            }, threadID, () => fs.unlinkSync(path), messageID);
        }

        let keyWord = args.join(" ");
        const apiUrl = await baseApiUrl();
        api.sendMessage(`🔍 جارٍ البحث عن: ${keyWord}...`, threadID, messageID);

        const res = await axios.get(`${apiUrl}/ytFullSearch?songName=${encodeURIComponent(keyWord)}`);
        const result = res.data.slice(0, 6);

        if (result.length == 0) return api.sendMessage("❌ لم يتم العثور على نتائج.", threadID, messageID);

        let msg = "🎶 نتائج البحث:\n\n";
        const thumbnails = [];
        
        for (let i = 0; i < result.length; i++) {
            msg += `${i + 1}. ${result[i].title}\n⏱️ الوقت: ${result[i].time}\n\n`;
            // تحميل الصور المصغرة للعرض
            const thumbPath = __dirname + `/cache/thumb_${senderID}_${i}.jpg`;
            thumbnails.push(getStream(result[i].thumbnail, thumbPath));
        }

        const streams = await Promise.all(thumbnails);

        return api.sendMessage({
            body: msg + "🔢 رد برقم الأغنية للتحميل",
            attachment: streams
        }, threadID, (err, info) => {
            if (global.client && global.client.handleReply) {
                global.client.handleReply.push({
                    name: this.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    result
                });
            }
        }, messageID);

    } catch (err) {
        return api.sendMessage("❌ حدث خطأ: " + err.message, threadID, messageID);
    }
};

module.exports.handleReply = async ({ event, api, handleReply }) => {
    const { threadID, messageID, body, senderID } = event;
    if (handleReply.author != senderID) return;

    try {
        const choice = parseInt(body);
        if (isNaN(choice) || choice > handleReply.result.length || choice <= 0) {
            return api.sendMessage("⚠️ اختيار غير صالح، اختر رقم من 1 إلى 6", threadID, messageID);
        }

        api.unsendMessage(handleReply.messageID);
        api.sendMessage("📥 جارٍ معالجة طلبك...", threadID, messageID);

        const infoChoice = handleReply.result[choice - 1];
        const apiUrl = await baseApiUrl();
        const { data } = await axios.get(`${apiUrl}/ytDl3?link=${infoChoice.id}&format=mp3`);

        const path = __dirname + `/cache/sing_${senderID}.mp3`;
        const audioStream = await getStream(data.downloadLink, path);

        return api.sendMessage({
            body: `✅ العنوان: ${data.title}\n🔝 الجودة: ${data.quality || 'Standard'}`,
            attachment: audioStream
        }, threadID, () => fs.unlinkSync(path), messageID);

    } catch (error) {
        api.sendMessage("❌ عذراً، تعذر تحميل الملف (قد يتجاوز 25 ميجا)", threadID, messageID);
    }
};

async function getStream(url, pathName) {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    fs.writeFileSync(pathName, Buffer.from(res.data));
    return fs.createReadStream(pathName);
}
