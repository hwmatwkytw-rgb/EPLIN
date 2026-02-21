const fs = require('fs');
const path = require('path');

const userDBPath = path.join(__dirname, '..', '..', 'database', 'users.json');

function readDB(filePath) {
    try {
        if (!fs.existsSync(filePath)) return {};
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function writeDB(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}

module.exports = {
    config: {
        name: 'عمل',
        version: '1.1',
        author: 'Kenji Agent & Gemini',
        countDown: 600, // 10 دقائق
        prefix: true,
        category: 'اللعب',
        description: 'القيام ببعض العمل لكسب المال.',
        guide: { ar: '{pn}' }
    },
    onStart: async ({ api, event }) => {
        const { senderID, threadID, messageID } = event;
        const userDB = readDB(userDBPath);

        // التفاعل مع الرسالة برمز العملة
        api.setMessageReaction("🪙", messageID, () => {}, true);

        if (!userDB[senderID]) {
            const userInfo = await api.getUserInfo(senderID);
            userDB[senderID] = { 
                name: userInfo[senderID].name, 
                balance: 0 
            };
        }

        const jobs = [
            'الرقص في بلاط الملك ونيل إعجابه', 
            'توصيل طلبات سريعة', 
            'بيع الخضار في السوق الشعبي', 
            'تصميم جرافيك لشركة ناشئة', 
            'صيانة جوالات حديثة', 
            'تقديم دروس خصوصية', 
            'حراسة أمنية ليلية', 
            'غسيل السيارات الفارهة', 
            'صيد السمك في أعالي البحار', 
            'جمع وإعادة تدوير الخردة'
        ];
        
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const amount = Math.floor(Math.random() * (500 - 100 + 1)) + 100;

        userDB[senderID].balance += amount;
        writeDB(userDBPath, userDB);

        const msg = `●───── ⌬ ─────●
┇
⦿ ⟬ مركز العمل ⟭
┇ 𓋰 المهنة: ${job}
┇
⦿ ⟬ المكافأة ⟭
┇ 𓋰 كسبت: ${amount.toLocaleString()} رصيد
┇
⦿ ⟬ المحفظة ⟭
┇ 𓋰 رصيدك الحالي: ${userDB[senderID].balance.toLocaleString()}
┇
●───── ⌬ ─────●`;

        return api.sendMessage(msg, threadID);
    }
};
