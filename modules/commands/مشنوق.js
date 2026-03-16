const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createCanvas } = require('canvas');

// مسار قاعدة بيانات النقاط
const dataPath = path.join(__dirname, '../../includes/database/hangman_stats.json');

// التأكد من جاهزية ملف البيانات
if (!fs.existsSync(path.dirname(dataPath))) fs.ensureDirSync(path.dirname(dataPath));
if (!fs.existsSync(dataPath)) fs.writeJsonSync(dataPath, {});

const words = ["تفاحة", "كتاب", "شجرة", "نجمة", "قمر", "سمكة", "طائر", "سحابة", "نهر", "حجر", "سيارة", "مدرسة", "هاتف", "ساعة"];

async function drawHangman(gameData) {
    const { word, guessedLetters, incorrectGuesses } = gameData;
    const canvas = createCanvas(400, 500);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#F0F2F5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#404040';
    ctx.textAlign = 'center';
    ctx.fillText('لعبة المشنوق الملكية', canvas.width / 2, 40);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(50, 400); ctx.lineTo(150, 400);
    ctx.moveTo(100, 400); ctx.lineTo(100, 100);
    ctx.lineTo(250, 100); ctx.lineTo(250, 150);
    ctx.stroke();

    const drawSteps = [
        () => { ctx.beginPath(); ctx.arc(250, 180, 30, 0, Math.PI * 2); ctx.stroke(); },
        () => { ctx.beginPath(); ctx.moveTo(250, 210); ctx.lineTo(250, 300); ctx.stroke(); },
        () => { ctx.beginPath(); ctx.moveTo(250, 230); ctx.lineTo(200, 270); ctx.stroke(); },
        () => { ctx.beginPath(); ctx.moveTo(250, 230); ctx.lineTo(300, 270); ctx.stroke(); },
        () => { ctx.beginPath(); ctx.moveTo(250, 300); ctx.lineTo(200, 350); ctx.stroke(); },
        () => { ctx.beginPath(); ctx.moveTo(250, 300); ctx.lineTo(300, 350); ctx.stroke(); }
    ];

    for (let i = 0; i < incorrectGuesses.length; i++) if (drawSteps[i]) drawSteps[i]();

    const displayWord = word.split('').map(l => guessedLetters.includes(l) ? l : '_').join(' ');
    ctx.font = '40px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(displayWord, canvas.width / 2, 450);

    const filePath = path.join(__dirname, `cache_${Date.now()}.png`);
    fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
    return filePath;
}

module.exports = {
    config: {
        name: "مشنوق",
        version: "2.1.0",
        author: "سينكو",
        countDown: 5,
        prefix: true,
        category: "fun",
        description: "لعبة المشنوق مع حذف بيانات الجلسة فور انتهائها"
    },

    onStart: async function ({ api, event, args }) {
        let stats = fs.readJsonSync(dataPath);
        const { threadID, senderID } = event;

        if (args[0] === "rank") {
            let sortable = Object.entries(stats).sort(([,a],[,b]) => b.wins - a.wins);
            let msg = "🏆 ⸻ تـرتـيـب الأساطـير ⸻ 🏆\n\n";
            sortable.slice(0, 10).forEach(([id, data], index) => {
                msg += `${index + 1} - ID: ${id.slice(0,6)}.. | الفوز: ${data.wins} | النقاط: ${data.points}\n`;
            });
            return api.sendMessage(msg, threadID);
        }

        const word = words[Math.floor(Math.random() * words.length)];
        const gameData = { word, guessedLetters: [], incorrectGuesses: [], playerID: senderID };
        const imgPath = await drawHangman(gameData);

        return api.sendMessage({
            body: `─── ❃ ⸻ ❃ ───\n  ⌬ بـدأت الـتـحدي!\n─── ❃ ⸻ ❃ ───\nالـلاعب: @${senderID}\nخمّن الحرف بالرد على الصورة.`,
            attachment: fs.createReadStream(imgPath),
            mentions: [{ tag: `@${senderID}`, id: senderID }]
        }, threadID, (err, info) => {
            fs.unlinkSync(imgPath);
            // إضافة البيانات لنظام الردود
            global.client.handleReply.push({ name: this.config.name, messageID: info.messageID, gameData });
        });
    },

    onReply: async function ({ api, event, handleReply }) {
        const { threadID, senderID, body } = event;
        const { gameData } = handleReply;

        // التحقق من أن اللاعب هو نفسه صاحب اللعبة
        if (senderID !== gameData.playerID) return;

        const char = body.trim().toLowerCase();
        if (char.length !== 1) return api.sendMessage("──❃ ┇ أرسل حرفاً واحداً فقط!", threadID);

        // معالجة التخمين
        if (gameData.word.includes(char)) {
            if (!gameData.guessedLetters.includes(char)) gameData.guessedLetters.push(char);
        } else {
            if (!gameData.incorrectGuesses.includes(char)) gameData.incorrectGuesses.push(char);
        }

        const win = gameData.word.split('').every(l => gameData.guessedLetters.includes(l));
        const lose = gameData.incorrectGuesses.length >= 6;
        const imgPath = await drawHangman(gameData);

        // حذف الصورة القديمة لتنظيف الشات
        api.unsendMessage(handleReply.messageID);

        if (win || lose) {
            let stats = fs.readJsonSync(dataPath);
            if (!stats[senderID]) stats[senderID] = { wins: 0, losses: 0, points: 0 };
            
            let resultMsg = "";
            if (win) {
                stats[senderID].wins++;
                stats[senderID].points += 50;
                resultMsg = `─── ❃ ⸻ ❃ ───\n🎉 فـزت يـا بـطـل!\nالكلمة: [ ${gameData.word} ]\nتم إضافة 50 نقطة لرصيدك 💰`;
            } else {
                stats[senderID].losses++;
                resultMsg = `─── ❃ ⸻ ❃ ───\n لـلأسـف خـسـرت!\nالكلمة: [ ${gameData.word} ]`;
            }
            
            fs.writeJsonSync(dataPath, stats);
            
            // --- نظام الحذف الفوري ---
            // حذف جلسة المستخدم من قائمة الانتظار لكي لا يتمكن من الرد مجدداً
            const index = global.client.handleReply.findIndex(item => item.messageID === handleReply.messageID);
            if (index !== -1) global.client.handleReply.splice(index, 1);
            
            return api.sendMessage({ body: resultMsg, attachment: fs.createReadStream(imgPath) }, threadID, () => fs.unlinkSync(imgPath));
        }

        // إذا لم تنتهِ اللعبة، نحدث الجلسة بصورة جديدة
        api.sendMessage({ body: `──❃ ┇ تخمينك مستمر.. استمر!`, attachment: fs.createReadStream(imgPath) }, threadID, (err, info) => {
            fs.unlinkSync(imgPath);
            // حذف الجلسة القديمة وإضافة الجديدة لمنع تضخم الذاكرة
            const index = global.client.handleReply.findIndex(item => item.messageID === handleReply.messageID);
            if (index !== -1) global.client.handleReply.splice(index, 1);
            
            global.client.handleReply.push({ name: this.config.name, messageID: info.messageID, gameData });
        });
    }
};
