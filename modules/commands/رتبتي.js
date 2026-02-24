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
        version: '4.0',
        author: 'Hridoy & Gemini',
        countDown: 5,
        prefix: true,
        category: 'level',
        description: 'بطاقة رتبة احترافية مع نجوم ودعم كامل للأسماء المزخرفة',
        guide: { en: '{pn} | {pn} top' },
    },

    onStart: async ({ api, event, args }) => {
        const { senderID, mentions, threadID } = event;
        const userDB = readDB(userDBPath);
        const sortedUsers = Object.values(userDB).sort((a, b) => b.rank - a.rank);

        const targetID = Object.keys(mentions).length > 0 ? Object.keys(mentions)[0] : (args[0] || senderID);
        if (!userDB[targetID]) return api.sendMessage("❌ هذا المستخدم غير مسجل.", threadID);

        const userData = userDB[targetID];
        const level = userData.rank || 1;
        const currentXP = userData.xp || 0;
        const name = userData.name || 'User';
        const rankIndex = sortedUsers.findIndex(user => user.userID === targetID);
        const rank = rankIndex >= 0 ? rankIndex + 1 : '???';

        try {
            // تثبيت الأبعاد لضمان ظهور العناصر
            const canvas = createCanvas(1000, 1000);
            const ctx = canvas.getContext('2d');

            // 1. تحميل الخلفية
            const backgroundUrl = 'https://i.ibb.co/35KLY4kv/1771968885514.jpg'; 
            const background = await loadImage(backgroundUrl);
            ctx.drawImage(background, 0, 0, 1000, 1000);

            // 2. وضع صورة البروفايل (تم تكبيرها وتصحيح مكانها للوجه)
            const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
            const avatar = await loadImage(avatarUrl);
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(755, 595, 115, 0, Math.PI * 2, true); // مكان الوجه بدقة
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 640, 480, 230, 230); 
            ctx.restore();

            // 3. كتابة الاسم المزخرف (استخدام تكتيك الظل لإبراز الرموز)
            ctx.fillStyle = "#ffffff";
            ctx.font = 'bold 55px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif'; // خطوط تدعم الرموز أكثر
            ctx.shadowColor = "black";
            ctx.shadowBlur = 10;
            ctx.fillText(name, 80, 620);

            // 4. رسم النجوم في المربعات العلوية حسب الرتبة
            // إذا كان العضو من التوب 10 يحصل على نجوم أكثر
            let starsCount = 1;
            if (rank <= 1) starsCount = 6;
            else if (rank <= 3) starsCount = 5;
            else if (rank <= 10) starsCount = 4;
            else if (level > 20) starsCount = 3;
            else starsCount = 2;

            const starX = [65, 155, 245, 335, 425, 515]; // إحداثيات المربعات الستة
            ctx.font = '50px Arial';
            ctx.shadowBlur = 15;
            ctx.shadowColor = "yellow";
            for (let i = 0; i < starsCount; i++) {
                ctx.fillText('⭐', starX[i], 425);
            }

            // 5. المعلومات الإضافية
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#ffffff";
            ctx.font = 'bold 35px Arial';
            ctx.fillText(`LEVEL: ${level}`, 80, 690);
            ctx.fillText(`RANK: #${rank}`, 80, 740);

            // شريط الخبرة النيوني
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
            ctx.fillRect(80, 770, 400, 12);
            ctx.fillStyle = "#00f2ff";
            const xpBar = Math.min((currentXP / (level * 500)) * 400, 400);
            ctx.fillRect(80, 770, xpBar, 12);

            // الحفظ والإرسال
            const cachePath = path.join(__dirname, 'cache', `rank_${targetID}.png`);
            if (!fs.existsSync(path.join(__dirname, 'cache'))) fs.mkdirSync(path.join(__dirname, 'cache'));
            
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(cachePath, buffer);

            api.sendMessage({
                body: `✨ تم تحديث بطاقتك يا ${name}`,
                attachment: fs.createReadStream(cachePath)
            }, threadID, () => fs.unlinkSync(cachePath));

        } catch (e) {
            console.log(e);
            api.sendMessage("❌ حدث خطأ في النظام، تأكد من وجود مجلد cache.", threadID);
        }
    }
};
