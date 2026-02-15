const fs = require('fs-extra');
const path = require('path');
const { Jimp } = require('jimp');

const config = {
    name: "خروفي",
    version: "1.0",
    author: "ابو عبيده علي",
    description: "رد على صورة شخص ليظهره على خروفك",
    role: 0,
    countDown: 3,
    event: true,
};

const cacheDir = path.join(__dirname, "../../cache");
fs.ensureDirSync(cacheDir);

function getRandomFileName() {
    return `sheep_${Date.now()}.jpg`;
}

module.exports = {
    config,

    // ===== أمر الإرسال =====
    onStart: async function({ api, event, usersData, sh }) {
        try {
            const { threadID, messageID } = event;

            if (!event.messageReply && Object.keys(event.mentions).length === 0) {
                return sh.reply("❌ رد على حد أو منشنه عشان علي خروفك");
            }

            const target = event.messageReply?.senderID || Object.keys(event.mentions)?.[0];

            // تحميل الخلفية
            const background = await Jimp.read("https://i.ibb.co/YThmPKSR/h2-Qh6-Jd-Wqf.jpg");

            // تحميل صور المستخدمين
            const userAvatar = await Jimp.read(await usersData.getAvatarUrl(event.senderID));
            const targetAvatar = await Jimp.read(await usersData.getAvatarUrl(target));

            userAvatar.resize(190, 190).circle();
            targetAvatar.resize(190, 190).circle();

            background.composite(userAvatar, 150, 200);
            background.composite(targetAvatar, 170, 430);

            const fileName = getRandomFileName();
            const filePath = path.join(cacheDir, fileName);

            await background.writeAsync(filePath);

            await sh.reply({ attachment: fs.createReadStream(filePath) });

            // حذف الصورة بعد الإرسال لتوفير المساحة
            setTimeout(() => fs.unlink(filePath).catch(() => {}), 60 * 1000);
        } catch (err) {
            console.error(err);
            sh.reply("❌ حدث خطأ أثناء إنشاء خروفك، حاول مرة أخرى.");
        }
    }
};
