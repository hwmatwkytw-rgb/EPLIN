const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

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
        version: '3.0',
        author: 'Hridoy & Gemini',
        countDown: 5,
        prefix: true,
        category: 'level',
        description: 'بطاقة رتبة احترافية مدمجة مع الشخصية بدقة',
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
            // إنشاء كانفاس بنفس أبعاد الصورة الأصلية تقريباً
            const canvas = createCanvas(1000, 1000);
            const ctx = canvas.getContext('2d');

            // --- تحميل الخلفية التي طلبتها ---
            const backgroundUrl = 'https://i.ibb.co/35KLY4kv/1771968885514.jpg'; 
            const background = await loadImage(backgroundUrl);
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            // --- وضع صورة البروفايل مكان وجه الشخصية (دقة عالية) ---
            const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
            const avatar = await loadImage(avatarUrl);
            
            ctx.save();
            ctx.beginPath();
            // الإحداثيات هنا تستهدف رأس الشخصية في يمين الصورة
            ctx.arc(755, 575, 75, 0, Math.PI * 2, true); 
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 680, 500, 150, 150); 
            ctx.restore();

            // --- كتابة الاسم بشكل لوغو جذاب ---
            ctx.save();
            // إضافة توهج خلف الاسم
            ctx.shadowColor = "#00f2ff";
            ctx.shadowBlur = 20;
            ctx.fillStyle = "#ffffff";
            ctx.font = 'bold 70px Arial'; 
            ctx.textAlign = "left";
            
            // وضع الاسم في جهة اليسار ليتوازن مع الشخصية في اليمين
            ctx.fillText(name, 100, 600);
            ctx.restore();

            // --- معلومات الرتبة بتصميم أنيق ---
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.font = 'bold 35px Arial';
            ctx.fillText(`LEVEL: ${level}`, 100, 660);
            ctx.fillText(`RANK: #${rank}`, 100, 710);
            
            // شريط خبرة صغير تحت المعلومات
            ctx.fillStyle = "#00f2ff";
            ctx.fillRect(100, 730, 300, 10);

            // --- الحفظ والإرسال ---
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
            const imagePath = path.join(cacheDir, `rank_${targetID}.png`);
            
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(imagePath, buffer);

            api.sendMessage({
                body: `✅ بطاقة رتبتك الجديدة يا ${name}`,
                attachment: fs.createReadStream(imagePath)
            }, threadID, () => {
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            });

        } catch (error) {
            console.error(error);
            api.sendMessage("❌ حدث خطأ أثناء معالجة الصورة.", threadID);
        }
    },
};
