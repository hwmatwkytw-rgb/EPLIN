const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createCanvas } = require('canvas');

// مسار قاعدة بيانات النقاط
const dataPath = path.join(__dirname, '../../includes/database/hangman_stats.json');

// التأكد من جاهزية ملف البيانات
if (!fs.existsSync(path.dirname(dataPath))) fs.ensureDirSync(path.dirname(dataPath));
if (!fs.existsSync(dataPath)) fs.writeJsonSync(dataPath, {});

const words = ["تفاحة", "كتاب", "شجرة", "نجمة", "قمر", "سمكة", "طائر", "سحابة", "نهر", "حجر", "سيارة", "مدرسة", "هاتف", "ساعة", "جمل", "أسد"];

async function drawHangman(gameData) {
    const { incorrectGuesses } = gameData;
    const canvas = createCanvas(400, 400); // صغرت الحجم ليكون أسرع في الرفع
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#F0F2F5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(50, 350); ctx.lineTo(150, 350); // القاعدة
    ctx.moveTo(100, 350); ctx.lineTo(100, 50);  // العمود
    ctx.lineTo(250, 50); ctx.lineTo(250, 100);  // الحبل
    ctx.stroke();

    const drawSteps = [
        () => { ctx.beginPath(); ctx.arc(250, 130, 30, 0, Math.PI * 2); ctx.stroke(); }, // الرأس
        () => { ctx.beginPath(); ctx.moveTo(250, 160); ctx.lineTo(250, 250); ctx.stroke(); }, // الجسم
        () => { ctx.beginPath(); ctx.moveTo(250, 180); ctx.lineTo(200, 220); ctx.stroke(); }, // يد 1
        () => { ctx.beginPath(); ctx.moveTo(250, 180); ctx.lineTo(300, 220); ctx.stroke(); }, // يد 2
        () => { ctx.beginPath(); ctx.moveTo(250, 250); ctx.lineTo(200, 300); ctx.stroke(); }, // رجل 1
        () => { ctx.beginPath(); ctx.moveTo(250, 250); ctx.lineTo(300, 300); ctx.stroke(); }  // رجل 2
    ];

    for (let i = 0; i < incorrectGuesses.length; i++) if (drawSteps[i]) drawSteps[i]();

    const filePath = path.join(__dirname, `cache_${Date.now()}.png`);
    fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
    return filePath;
}

module.exports = {
    config: {
        name: "مشنوق",
        version: "3.0.0",
        author: "سينكو",
        countDown: 5,
        prefix: true,
        category: "fun",
        description: "لعبة المشنوق المصلحة مع إظهار الحروف نصياً"
    },

    onStart: async function ({ api, event, args }) {
        let stats = fs.readJsonSync(dataPath);
        const { threadID, senderID } = event;

        if (args[0] === "rank") {
            let sortable = Object.entries(stats).sort(([,a],[,b]) => b.wins - a.wins);
            let msg = "🏆 ⸻ تـرتـيـب الأساطـير ⸻ 🏆\n\n";
            sortable.slice(0, 10).forEach(([id, data], index) => {
                msg += `${index + 1} - ${data.wins} فوز | النقاط: ${data.points}\n`;
            });
            return api.sendMessage(msg, threadID);
        }

        const word = words[Math.floor(Math.random() * words.length)];
        const gameData = { word, guessedLetters: [], incorrectGuesses: [], playerID: senderID };
        const imgPath = await drawHangman(gameData);
        
        // عرض الكلمة كشرطات في البداية
        const displayWord = word.split('').map(() => '＿').join(' ');

        return api.sendMessage({
            body: `─── ❃ ⸻ ❃ ⸻ ❃ ───\n  ⌬ لـعـبـة الـمـشـنـوق الـمـلـكـيـة\n─── ❃ ⸻ ❃ ⸻ ❃ ───\n\nالـكـلـمـة: [ ${displayWord} ]\n\nخمّن حرفاً بالرد على هذه الصورة.`,
            attachment: fs.createReadStream(imgPath)
        }, threadID, (err, info) => {
            if(fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            global.client.handleReply.push({ name: this.config.name, messageID: info.messageID, gameData });
        });
    },

    onReply: async function ({ api, event, handleReply }) {
        const { threadID, senderID, body } = event;
        const { gameData } = handleReply;

        if (senderID !== gameData.playerID) return;

        const char = body.trim(); // حذف المسافات
        if (char.length !== 1) return api.sendMessage("──❃ ┇ أرسل حرفاً واحداً فقط يا بطل!", threadID);

        // التحقق من الحرف (بدون تحويل لصغير لأنها عربية)
        if (gameData.word.includes(char)) {
            if (!gameData.guessedLetters.includes(char)) gameData.guessedLetters.push(char);
        } else {
            if (!gameData.incorrectGuesses.includes(char)) gameData.incorrectGuesses.push(char);
        }

        const win = gameData.word.split('').every(l => gameData.guessedLetters.includes(l));
        const lose = gameData.incorrectGuesses.length >= 6;
        const imgPath = await drawHangman(gameData);
        
        // إعداد شكل الكلمة المكتشفة نصياً
        const displayWord = gameData.word.split('').map(l => gameData.guessedLetters.includes(l) ? l : '＿').join(' ');

        // حذف الرسالة السابقة لتنظيف الشات
        api.unsendMessage(handleReply.messageID);

        if (win || lose) {
            let stats = fs.readJsonSync(dataPath);
            if (!stats[senderID]) stats[senderID] = { wins: 0, losses: 0, points: 0 };
            
            let resultMsg = "";
            if (win) {
                stats[senderID].wins++;
                stats[senderID].points += 50;
                resultMsg = `─── ❃ ⸻ ❃ ───\n🎉 كـفـو يـا سـيـنـكـو! فـزت بالـتحدي\nالكلمة: [ ${gameData.word} ]\nتم إضافة 50 نقطة لرصيدك 💰`;
            } else {
                stats[senderID].losses++;
                resultMsg = `─── ❃ ⸻ ❃ ───\n💀 لـلأسـف انـتـهت مـحاولاتك!\nالكلمة الصحيحة: [ ${gameData.word} ]`;
            }
            
            fs.writeJsonSync(dataPath, stats);
            
            // حذف الجلسة فوراً
            const index = global.client.handleReply.findIndex(item => item.messageID === handleReply.messageID);
            if (index !== -1) global.client.handleReply.splice(index, 1);
            
            return api.sendMessage({ body: resultMsg, attachment: fs.createReadStream(imgPath) }, threadID, () => {
                if(fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            });
        }

        // تحديث اللعبة بإرسال الكلمة المكتشفة نصياً
        api.sendMessage({ 
            body: `─── ❃ ⸻ ❃ ⸻ ❃ ───\nالـكـلـمـة: [ ${displayWord} ]\n❌ أخطاء: ${gameData.incorrectGuesses.join(' - ') || '0'}/6\n─── ❃ ⸻ ❃ ⸻ ❃ ───`, 
            attachment: fs.createReadStream(imgPath) 
        }, threadID, (err, info) => {
            if(fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            
            // تحديث جلسة الرد
            const index = global.client.handleReply.findIndex(item => item.messageID === handleReply.messageID);
            if (index !== -1) global.client.handleReply.splice(index, 1);
            
            global.client.handleReply.push({ name: this.config.name, messageID: info.messageID, gameData });
        });
    }
};
