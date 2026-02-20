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
        version: '2.1',
        author: 'Hridoy & Gemini',
        countDown: 5,
        prefix: true,
        category: 'level',
        description: 'عرض بطاقة رتبتك فوق خلفية فضائية رائعة',
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
            const canvas = createCanvas(1000, 500);
            const ctx = canvas.getContext('2d');

            // --- التعديل هنا: استخدام رابط الصورة المباشر ---
            const backgroundUrl = 'https://i.ibb.co/mVDXgTnd/file-00000000772072468ab3dc00063b508b-1.png'; 
            const background = await loadImage(backgroundUrl);
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            // --- تظليل خفيف ---
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // --- صورة المستخدم ---
            const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
            const avatar = await loadImage(avatarUrl);
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(150, 250, 100, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 50, 150, 200, 200);
            ctx.restore();

            // --- النصوص ---
            ctx.fillStyle = "#ffffff";
            ctx.font = 'bold 50px Arial';
            ctx.fillText(name, 300, 220);

            ctx.font = '35px Arial';
            ctx.fillText(`المستوى: ${level}`, 300, 280);
            ctx.fillText(`الرتبة: #${rank}`, 300, 330);
            ctx.fillText(`الخبرة: ${currentXP} XP`, 300, 380);

            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
            const imagePath = path.join(cacheDir, `rank_${targetID}.png`);
            
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(imagePath, buffer);

            api.sendMessage({
                body: `📊 بطاقة رتبة ${name}`,
                attachment: fs.createReadStream(imagePath)
            }, threadID, () => {
                if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
            });

        } catch (error) {
            console.error(error);
            api.sendMessage("❌ حدث خطأ أثناء تصميم البطاقة.", threadID);
        }
    },
};
