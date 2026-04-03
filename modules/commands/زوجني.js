const axios = require('axios');

module.exports = {
  config: {
    name: 'زوجني',
    version: '1.0',
    author: 'سينكو',
    countDown: 5,
    prefix: true,
    category: 'ai',
    description: 'تزويج عشوائي من الجروب',
    guide: { ar: '{pn}' }
  },

  onStart: async ({ api, event, args }) => {

    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const members = threadInfo.participantIDs;

      if (!members || members.length < 2) {
        return api.sendMessage("⏣ ❌ لازم يكون فيه أعضاء أكثر في الجروب", event.threadID);
      }

      const filtered = members.filter(id => id != event.senderID);
      const randomID = filtered[Math.floor(Math.random() * filtered.length)];

      const name1 = await api.getUserInfo(event.senderID);
      const name2 = await api.getUserInfo(randomID);

      const user1 = name1[event.senderID].name;
      const user2 = name2[randomID].name;

      const msg = 
`⏣────── ✾ ⌬ ✾ ──────⏣
✾ ┇
✾ ┇ ⏣ ⟬ الــزواج ⟭
✾ ┇ ◍ العريس: ${user1}
✾ ┇ ◍ العروس: ${user2}
✾ ┇ 💞 مبروك عليكم 💞
✾ ┇
⏣────── ✾ ⌬ ✾ ──────⏣`;

      // ✅ إصلاح جلب الصور
      const getAvatar = async (id) => {
        const res = await axios.get(`https://graph.facebook.com/${id}/picture?width=512&height=512&redirect=false`);
        return await axios.get(res.data.data.url, { responseType: 'stream' });
      };

      const avatar1 = await getAvatar(event.senderID);
      const avatar2 = await getAvatar(randomID);

      api.sendMessage({
        body: msg,
        attachment: [avatar1.data, avatar2.data],
        mentions: [
          { id: event.senderID, tag: user1 },
          { id: randomID, tag: user2 }
        ]
      }, event.threadID);

    } catch (e) { 
      api.sendMessage("⏣ ❌ حدث خطأ أثناء تنفيذ الأمر", event.threadID); 
    }
  }
};
