const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "زواج",
    version: "2.6",
    author: "Gemini",
    countDown: 10,
    prefix: true,
    category: "ألعاب",
    description: "تزوج عشوائياً بمهر 5000 نقطة 💍",
    guide: { ar: "{pn}" }
  },

  onStart: async ({ api, event, Currencies, Users }) => {
    const { threadID, messageID, senderID } = event;
    const mahar = 5000;
    const cacheDir = path.join(__dirname, 'cache');

    try {
      // 1. التحقق من النقاط (مع تجاوز الخطأ إذا لم يوجد نظام عملات)
      try {
        const userMoney = (await Currencies.getData(senderID)).money;
        if (userMoney < mahar) {
          return api.sendMessage(`⚠️ | المهر غالي يا عريس! لازم يكون عندك ${mahar} نقطة.\nرصيدك: ${userMoney} 💸`, threadID, messageID);
        }
        await Currencies.decreaseMoney(senderID, mahar);
      } catch (e) { console.log("نظام العملات غير مفعل أو به مشكلة - استمرار الزواج مجاناً"); }

      // 2. جلب قائمة الأعضاء واختيار شريك
      const threadInfo = await api.getThreadInfo(threadID);
      const participants = threadInfo.participantIDs.filter(id => id !== api.getCurrentUserID() && id !== senderID);

      if (participants.length === 0) return api.sendMessage("💔 ما لقيت زول يتجوزك في الجروب ده!", threadID);
      
      const person2 = participants[Math.floor(Math.random() * participants.length)];

      // 3. جلب الأسماء
      const name1 = (await Users.getNameUser(senderID)) || "العريس";
      const name2 = (await Users.getNameUser(person2)) || "العروس";

      // 4. تحميل الصور مع نظام حماية
      await fs.ensureDir(cacheDir);
      const path1 = path.join(cacheDir, `g_${senderID}.png`);
      const path2 = path.join(cacheDir, `b_${person2}.png`);

      const imgUrl = (uid) => `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

      // محاولة تحميل الصور
      const download = async (url, dest) => {
        const res = await axios.get(url, { responseType: 'arraybuffer' });
        await fs.writeFile(dest, Buffer.from(res.data));
      };

      try {
        await Promise.all([download(imgUrl(senderID), path1), download(imgUrl(person2), path2)]);
      } catch (e) {
        return api.sendMessage(`💍 مبروك الزواج!\n🤵 العريس: ${name1}\n👰 العروس: ${name2}\n\n(تعذر تحميل الصور بسبب قيود فيسبوك)`, threadID, messageID);
      }

      // 5. إرسال عقد الزواج بالصور
      return api.sendMessage({
        body: `📜 **عقد زواج شرعي**\n\n🤵 العريس: ${name1}\n👰 العروس: ${name2}\n\n💰 تم دفع مهر وقدره: ${mahar} نقطة.\n\nمبروك للعروسين! يتربوا في عزكم. 💍✨`,
        attachment: [fs.createReadStream(path1), fs.createReadStream(path2)]
      }, threadID, () => {
        if (fs.existsSync(path1)) fs.unlinkSync(path1);
        if (fs.existsSync(path2)) fs.unlinkSync(path2);
      }, messageID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ حصل خطأ فني أثناء كتابة العقد، حاول مرة تانية.", threadID, messageID);
    }
  }
};
