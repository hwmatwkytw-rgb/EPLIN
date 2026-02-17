const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

module.exports = {
    config: {
        name: "تثبيت",
        version: "1.0.0",
        author: "Hridoy",
        description: "تثبيت آخر تحديث للبوت من GitHub",
        category: "المطور",
        role: 2,
        prefix: true
    },

    onStart: async function ({ api, event, args }) {
        const { threadID, messageID } = event;
        const repoUrl = "https://github.com/1dev-hridoy/NexaSim-v2";

        try {
            await api.sendMessage("🔄 جاري فحص التحديثات وجلب الملفات...", threadID, messageID);
            
            // ملاحظة: هذا الكود يقوم بتنزيل ملف package.json كمثال للتحديث
            // في البيئة الفعلية يجب الحذر عند استبدال ملفات النظام
            const response = await axios.get(`${repoUrl.replace('github.com', 'raw.githubusercontent.com')}/main/package.json`);
            
            if (response.data) {
                fs.writeJsonSync(path.join(process.cwd(), 'package.json'), response.data, { spaces: 2 });
                await api.sendMessage("✅ تم تحديث ملف الإعدادات. جاري تثبيت المكتبات...", threadID, messageID);
                
                try {
                    execSync('npm install', { stdio: 'inherit' });
                    await api.sendMessage("🚀 اكتملت العملية. سيتم إعادة تشغيل البوت الآن.", threadID, () => process.exit(1));
                } catch (e) {
                    await api.sendMessage("⚠️ فشل تثبيت المكتبات، يرجى المحاولة يدوياً.", threadID);
                }
            }
        } catch (err) {
            await api.sendMessage(`❌ فشل التحديث: ${err.message}`, threadID, messageID);
        }
    }
};
