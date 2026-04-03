import axios from 'axios';

export default {
  config: {
    name: 'زوجني',
    version: '1.0',
    author: 'سينكو -تعديل V',
    countDown: 5,
    prefix: true,
    category: 'ai',
    description: 'تزويج عشوائي من الجروب',
    guide: { ar: '{pn}' }
  },

  onCall: async ({ api, event, args }) => {
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

      const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662"; 
      
      const avatar1 = await axios.get(`https://graph.facebook.com/${event.senderID}/picture?width=720&height=720&access_token=${token}`, { responseType: 'stream' });
      avatar1.data.path = "avatar1.png"; 

      const avatar2 = await axios.get(`https://graph.facebook.com/${randomID}/picture?width=720&height=720&access_token=${token}`, { responseType: 'stream' });
      avatar2.data.path = "avatar2.png"; 

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
