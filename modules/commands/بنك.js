const fs = require('fs');
const path = require('path');

const bankDBPath = path.join(__dirname, '..', '..', 'database', 'bank.json');

function readBankDB() {
    try {
        const data = fs.readFileSync(bankDBPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return {};
        return {};
    }
}

function writeBankDB(data) {
    try {
        fs.writeFileSync(bankDBPath, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error('❌ خطأ في الحفظ:', error);
    }
}

module.exports = {
    config: {
        name: 'بنك',
        version: '2.0',
        author: 'Edited by Abu Obaida',
        countDown: 5,
        prefix: true,
        description: 'نظام اقتصادي متكامل (بنك، رهان، استثمار، تحويل)',
        category: 'اقتصاد',
        guide: {
            ar: '◈ ─── 𓊆 الأوامـر الـمـتـاحـة 𓊉 ─── ◈\n' +
                '⬩ {pn} انشاء ⠐ لفتح حسابك\n' +
                '⬩ {pn} راتب ⠐ الحصول على المكافأة\n' +
                '⬩ {pn} رهان <المبلغ> ⠐ مضاعفة أموالك\n' +
                '⬩ {pn} استثمار <المبلغ> ⠐ تشغيل الأموال\n' +
                '⬩ {pn} تحويل <المبلغ> ⠐ بالرد على الشخص\n' +
                '⬩ {pn} الأعلى ⠐ قائمة الأثرياء'
        },
    },

    onStart: async ({ api, event, args }) => {
        const { senderID, threadID, messageReply } = event;
        const bankDB = readBankDB();
        const subcommand = args[0] ? args[0].toLowerCase() : null;

        // --- إنشاء حساب ---
        if (subcommand === 'انشاء') {
            if (bankDB[senderID]) return api.sendMessage('◈ ───\n⚠️ لديك حساب نشط بالفعل.\n◈ ───', threadID);
            bankDB[senderID] = { bankBalance: 500, loan: false, loanAmount: 0, lastDaily: 0 };
            writeBankDB(bankDB);
            return api.sendMessage('◈ ───\n✅ تم إنشاء حسابك ومنحك 500 كهدية.\n◈ ───', threadID);
        }

        if (!bankDB[senderID]) return api.sendMessage('⚠️ يرجى إنشاء حساب أولاً: بنك انشاء', threadID);

        // --- نظام الراتب اليومي ---
        if (subcommand === 'راتب') {
            const cooldown = 24 * 60 * 60 * 1000;
            if (Date.now() - bankDB[senderID].lastDaily < cooldown) return api.sendMessage('⚠️ لقد استلمت راتبك بالفعل، عد غداً.', threadID);
            
            const reward = Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
            bankDB[senderID].bankBalance += reward;
            bankDB[senderID].lastDaily = Date.now();
            writeBankDB(bankDB);
            return api.sendMessage(`◈ ───\n✅ تم استلام راتبك اليومي بقيمة: ${reward}\n◈ ───`, threadID);
        }

        // --- نظام الرهان (قمار) ---
        if (subcommand === 'رهان') {
            const bet = parseInt(args[1]);
            if (isNaN(bet) || bet <= 0) return api.sendMessage('⚠️ أدخل مبلغاً صحيحاً للرهان.', threadID);
            if (bet > bankDB[senderID].bankBalance) return api.sendMessage('⚠️ رصيدك لا يكفي لهذا الرهان.', threadID);

            const win = Math.random() > 0.5;
            if (win) {
                bankDB[senderID].bankBalance += bet;
                api.sendMessage(`◈ ─── 𓊆 نـتـيـجـة الـرهـان 𓊉 ─── ◈\n\n◉ لـقـد فـزت بـالـرهـان!\n◉ الـربـح: +${bet}\n◉ رصـيـدك الآن: ${bankDB[senderID].bankBalance}\n━━━━━━━━━━━━━━━━━`, threadID);
            } else {
                bankDB[senderID].bankBalance -= bet;
                api.sendMessage(`◈ ─── 𓊆 نـتـي_جـة الـرهـان 𓊉 ─── ◈\n\n◉ لـأسـف خـسـرت الـرهـان.\n◉ الـخـسـارة: -${bet}\n◉ رصـيـدك الآن: ${bankDB[senderID].bankBalance}\n━━━━━━━━━━━━━━━━━`, threadID);
            }
            return writeBankDB(bankDB);
        }

        // --- نظام التحويل ---
        if (subcommand === 'تحويل') {
            if (!messageReply) return api.sendMessage('⚠️ قم بالرد على الشخص الذي تريد التحويل له.', threadID);
            const targetID = messageReply.senderID;
            const amount = parseInt(args[1]);

            if (isNaN(amount) || amount <= 0) return api.sendMessage('⚠️ أدخل مبلغاً صحيحاً للتحويل.', threadID);
            if (amount > bankDB[senderID].bankBalance) return api.sendMessage('⚠️ رصيدك غير كافٍ.', threadID);
            if (!bankDB[targetID]) return api.sendMessage('⚠️ الطرف الآخر لا يملك حساب بنكي.', threadID);

            bankDB[senderID].bankBalance -= amount;
            bankDB[targetID].bankBalance += amount;
            writeBankDB(bankDB);
            return api.sendMessage(`◈ ───\n✅ تم تحويل ${amount} بنجاح إلى المستلم.\n◈ ───`, threadID);
        }

        // --- نظام الاستثمار ---
        if (subcommand === 'استثمار') {
            const investAmount = parseInt(args[1]);
            if (isNaN(investAmount) || investAmount < 100) return api.sendMessage('⚠️ أقل مبلغ للاستثمار هو 100.', threadID);
            if (investAmount > bankDB[senderID].bankBalance) return api.sendMessage('⚠️ رصيدك لا يكفي.', threadID);

            const profitRate = (Math.random() * (1.5 - 0.5) + 0.5).toFixed(2);
            const result = Math.floor(investAmount * profitRate);
            
            bankDB[senderID].bankBalance = (bankDB[senderID].bankBalance - investAmount) + result;
            writeBankDB(bankDB);

            let investMsg = `◈ ─── 𓊆 تـقـريـر الاسـتـثـمـار 𓊉 ─── ◈\n\n`;
            investMsg += `◉ نـسـبـة الـنـجـاح: 『 ${Math.floor(profitRate * 100)}% 』\n`;
            investMsg += `◉ الـنـتـيـجـة الـمـالـيـة: 『 ${result} 』\n`;
            investMsg += `━━━━━━━━━━━━━━━━━\n`;
            investMsg += `│← رصـيـدك الـحـالـي: ${bankDB[senderID].bankBalance} 𓋹`;
            return api.sendMessage(investMsg, threadID);
        }

        // --- الحالة الافتراضية: عرض الرصيد ---
        if (!subcommand) {
            const userData = bankDB[senderID];
            let statusMessage = `◈ ─── 𓊆 الـمـركـز الـمـالـي 𓊉 ─── ◈\n\n`;
            statusMessage += `✧ الـرصـيـد الـحـالـي ⠐\n`;
            statusMessage += `◉ 『 ${userData.bankBalance} 』\n`;
            statusMessage += `━━━━━━━━━━━━━━━━━\n`;
            statusMessage += `✧ الـديـون والـقـروض ⠐\n`;
            statusMessage += `⬩ الـمـبـلـغ: 『 ${userData.loanAmount || 0} 』\n\n`;
            statusMessage += `◈ ───────────────── ◈\n`;
            statusMessage += `│← الـمـطـوࢪ: سينكو 𓋹`;
            return api.sendMessage(statusMessage, threadID);
        }

        // --- الأعلى رصيداً ---
        if (subcommand === 'الأعلى') {
            const sorted = Object.values(bankDB).sort((a, b) => b.bankBalance - a.bankBalance).slice(0, 10);
            let topMsg = `◈ ─── 𓊆 قـائـمـة الأثـريـاء 𓊉 ─── ◈\n\n`;
            for (let i = 0; i < sorted.length; i++) {
                topMsg += `${i + 1}. 用户: ${sorted[i].userID.slice(0,6)}... \n⬩ الـرصـيـد: 『 ${sorted[i].bankBalance} 』\n┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈\n`;
            }
            return api.sendMessage(topMsg, threadID);
        }
    }
};
