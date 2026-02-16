const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "زواج",
    version: "2.5",
    author: "Gemini",
    countDown: 10,
    prefix: true,
    category: "ألعاب",
    description: "تزوج عشوائياً بمهر 5000 نقطة 💍",
    guide: { ar: "{pn}" }
  },

  onStart: async ({ api, event, Currencies }) => {
    const { threadID, messageID, senderID } = event;
    const mahar = 5000; // قيمة المهر

    try {
      // 1. التحقق من النقاط (المهر)
      const userMoney = (await Currencies.getData(senderID)).money;
      if (userMoney < mahar) {
        return api.sendMessage(`⚠️ | يا عريس، المهر غالي! لازم يكون عندك ${mahar} نقطة على الأقل عشان تتجوز. \nرصيدك الحالي: ${userMoney} فقط. 💸`, threadID, messageID);
      }

      // 2. جلب قائمة الأعضاء واختيار العروس
      const threadInfo = await api.getThreadInfo(threadID);
      const participants = threadInfo.participantIDs;
      let person2 = participants[Math.floor(Math.random() * participants.length)];

      while (person2 === senderID || person2 === api.getCurrentUserID()) {
        person2 = participants[Math.floor(Math.random() * participants.length)];
      }

      // 3. خصم المهر
      await Currencies.decreaseMoney(senderID, mahar);

      // 4. جلب المعلومات والصور
      const info1 = await api.getUserInfo(senderID);
      const info2 = await api.getUserInfo(person2);
      
      const name1 = info1[senderID].name;
      const name2 = info2[person2].name;

      const img1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
      const img2 = `https://graph.facebook.com/${person2}/picture?width=512&height=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

      const cacheDir = path.join(__dirname, 'cache');
      await fs.ensureDir(cacheDir);
      const path1 = path.join(cacheDir, `groom_${senderID}.png`);
      const path2 = path.join(cacheDir, `bride_${person2}.png`);

      const [res1, res2] = await Promise.all([
        axios.get(img1, { responseType: 'arraybuffer' }),
        axios.get(img2, { responseType: 'arraybuffer' })
      ]);

      await fs.writeFile(path1, Buffer.from(res1.data));
      await fs.writeFile(path2, Buffer.from(res2.data));

      // 5. إرسال عقد الزواج
      const msg = {
        body: `📜 **عقد زواج شرعي**\n\n🤵 العريس: ${name1}\n👰 العروس: ${name2}\n\n💰 تم دفع مهر وقدره: ${mahar} نقطة.\n\nمبروك للعروسين! يتربوا في عزكم يا شباب. 💍✨`,
        attachment: [fs.createReadStream(path1), fs.createReadStream(path2)]
      };

      api.sendMessage(msg, threadID, () => {
        fs.unlinkSync(path1);
        fs.unlinkSync(path2);
      }, messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage("💔 | حصلت مشكلة في عقد الزواج، المأذون هرب!", threadID, messageID);
    }
  }
};
