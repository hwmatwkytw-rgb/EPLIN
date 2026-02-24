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
        version: '3.5',
        author: 'Hridoy & Gemini',
        countDown: 5,
        prefix: true,
        category: 'level',
        description: 'بطاقة رتبة احترافية مع دعم الزخارف والنجوم',
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
        const name = userData.name || 'مستخدم مجهول';
        const rankIndex = sortedUsers.findIndex(user => user.userID === targetID);
        const rank = rankIndex >= 0 ? rankIndex + 1 : '???';

        try {
            // تحميل الخلفية أولاً لمعرفة أبعادها الحقيقية
            const backgroundUrl = 'https://i.ibb.co/35KLY4kv/1771968885514.jpg'; 
            const background = await loadImage(backgroundUrl);
            
            const canvas = createCanvas(background.width, background.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            // --- 1. وضع صورة البروفايل بدقة مكان الوجه ---
            const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
            const avatar = await loadImage(avatarUrl);
            
            ctx.save();
            ctx.beginPath();
            // تم ضبط المركز والقطر ليغطي وجه الشخصية الكرتونية تماماً
            ctx.arc(752, 580, 110, 0, Math.PI * 2, true); 
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 642, 470, 220, 220); 
            ctx.restore();

            // --- 2. كتابة الاسم (حل مشكلة المربعات والزخارف) ---
            ctx.save();
            ctx.fillStyle = "#ffffff";
            // استخدمنا Sans-Serif لضمان دعم أكبر للرموز والزخارف
            ctx.font = 'bold 65px "Arial Unicode MS", "Segoe UI Symbol", sans-serif'; 
            ctx.shadowColor = "rgba(0, 242, 255, 0.8)";
            ctx.shadowBlur = 15;
            ctx.fillText(name, 100, 610);
            ctx.restore();

            // --- 3. نظام النجوم في المربعات العلوية ---
            // المربعات تبدأ من اليسار، سنضع نجماً بناءً على المستوى (مثلاً نجمة لكل 5 مستويات)
            const starsCount = Math.min(Math.floor(level / 5) + 1, 6); // بحد أقصى 6 نجوم
            const starPositions = [85, 175, 265, 355, 445, 535]; // إحداثيات المربعات في صورتك
            
            ctx.fillStyle = "#FFD700"; // لون ذهبي للنجوم
            ctx.font = '50px Arial';
            for (let i = 0; i < starsCount; i++) {
                ctx.fillText('⭐', starPositions[i], 420);
            }

            // --- 4. معلومات المستوى والخبرة ---
            ctx.fillStyle = "#ffffff";
            ctx.font = 'bold 40px Arial';
            ctx.fillText(`LEVEL: ${level}`, 100, 680);
            ctx.fillText(`RANK: #${rank}`, 100, 740);

            // شريط التقدم (XP)
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            ctx.fillRect(100, 770, 400, 15);
            ctx.fillStyle = "#00f2ff";
            const progressWidth = Math.min((currentXP / (level * 1000)) * 400, 400); 
            ctx.fillRect(100, 770, progressWidth, 15);

            // --- إرسال الصورة ---
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
            const imagePath = path.join(cacheDir, `rank_${targetID}.png`);
            
            fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));

            api.sendMessage({
                body: `✨ تم تحديث بطاقتك يا ${name}`,
                attachment: fs.createReadStream(imagePath)
            }, threadID, () => {
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            });

        } catch (error) {
            console.error(error);
            api.sendMessage("❌ حدث خطأ في معالجة الخطوط أو الصورة.", threadID);
        }
    },
};
