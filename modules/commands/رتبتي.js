const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, registerFont } = require('canvas');

const userDBPath = path.join(__dirname, '..', '..', 'database', 'users.json');

function readDB(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

module.exports = {
    config: {
        name: 'رتبتي',
        version: '2.5',
        author: 'Hridoy & Gemini',
        countDown: 5,
        prefix: true,
        category: 'level',
        description: 'بطاقة رتبة احترافية مدمجة مع الشخصية',
        guide: { en: '{pn} | {pn} top' },
    },

    onStart: async ({ api, event, args }) => {
        const { senderID, mentions, threadID } = event;
        const userDB = readDB(userDBPath);
        const sortedUsers = Object.values(userDB).sort((a, b) => b.rank - a.rank);

        if (args[0] === 'top') {
            const topUsers = sortedUsers.slice(0, 10);
            let message = '🏆 أفضل 10 مستخدمين:\n';
            topUsers.forEach((u, i) => message += `${i + 1}. ${u.name}: مستوى ${u.rank}\n`);
            return api.sendMessage(message, threadID);
        }

        const targetID = Object.keys(mentions).length > 0 ? Object.keys(mentions)[0] : (args[0] || senderID);
        if (!userDB[targetID]) return api.sendMessage("❌ هذا المستخدم غير مسجل.", threadID);

        const userData = userDB[targetID];
        const level = userData.rank || 1;
        const currentXP = userData.xp || 0;
        const name = userData.name || 'مستخدم مجهول';
        const rankIndex = sortedUsers.findIndex(user => user.userID === targetID);
        const rank = rankIndex >= 0 ? rankIndex + 1 : '???';

        try {
            // أبعاد الصورة الأصلية (تقريبية بناءً على الرابط)
            const canvas = createCanvas(1000, 1000); 
            const ctx = canvas.getContext('2d');

            // --- تحميل الخلفية الجديدة ---
            const backgroundUrl = 'https://i.ibb.co/35KLY4kv/1771968885514.jpg'; 
            const background = await loadImage(backgroundUrl);
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            // --- رسم وجه المستخدم مكان وجه الشخصية ---
            // ملاحظة: قمت بضبط الإحداثيات لتكون في منطقة الرأس (وسط علوي تقريباً)
            const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
            const avatar = await loadImage(avatarUrl);
            
            ctx.save();
            ctx.beginPath();
            // الدائرة وضعت في مكان وجه الشخصية (يمكنك تعديل 500, 320 إذا لم تكن دقيقة)
            ctx.arc(505, 315, 115, 0, Math.PI * 2, true); 
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 390, 200, 230, 230); // قص ولصق الصورة
            ctx.restore();

            // --- تصميم الاسم (Style Logo) ---
            ctx.textAlign = "center";
            
            // إضافة ظل للنص ليعطي عمق
            ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;

            // تدرج لوني ذهبي/أبيض فخم
            const gradient = ctx.createLinearGradient(0, 500, 0, 650);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#ffd700');

            ctx.fillStyle = gradient;
            ctx.font = 'bold 80px Arial'; // اسم العضو كشعار
            ctx.fillText(name, 500, 650);

            // --- معلومات الرتبة أسفل الاسم ---
            ctx.shadowBlur = 5; // تقليل الظل للمعلومات
            ctx.font = 'bold 40px Arial';
            ctx.fillStyle = "#ffffff";
            ctx.fillText(`LEVEL: ${level} | RANK: #${rank}`, 500, 720);
            
            ctx.font = '30px Arial';
            ctx.fillStyle = "#00ffcc"; // لون نيوني للخبرة
            ctx.fillText(`XP: ${currentXP}`, 500, 770);

            // --- حفظ وإرسال ---
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
            const imagePath = path.join(cacheDir, `rank_${targetID}.png`);
            
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(imagePath, buffer);

            api.sendMessage({
                body: `🔥 تم تصميم بطاقتك يا ${name} بنجاح!`,
                attachment: fs.createReadStream(imagePath)
            }, threadID, () => {
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            });

        } catch (error) {
            console.error(error);
            api.sendMessage("❌ حدث خطأ أثناء تركيب الصورة.", threadID);
        }
    },
};
