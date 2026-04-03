╭───〔 𓆩 📄 مـحـتـوى الـمـلـف 𓆪 〕───╮
┃ ꕥ الـاسم: ردود.js
╰──────────────────╯

code:
const fs = require("fs-extra");
const path = require("path");

const filePath = path.join(__dirname, "replies.json");

function loadReplies() {
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "{}");
  return JSON.parse(fs.readFileSync(filePath));
}

function saveReplies(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  config: {
    name: "ردود",
    version: "2.1",
    author: "سينكو",
    countDown: 3,
    prefix: false,
    category: "fun",
    description: "ردود تلقائية + إضافة ردود جديدة",
  },

  handleEvent: async ({ api, event }) => {
    const body = event.body;
    if (!body) return;

    let text = body.toLowerCase();
    let replies = loadReplies();

    // إضافة رد جديد
    if (text.includes("=>")) {
      const [key, value] = body.split("=>").map(t => t.trim());

      if (!key || !value) return;

      replies[key.toLowerCase()] = value;
      saveReplies(replies);

      return api.sendMessage(
        `✾ ┇ تم إضافة رد جديد ✅\n\n◍ ${key} ➜ ${value}`,
        event.threadID
      );
    }

    // 🔥 التعديل الوحيد (ردود جزئية بدون تغيير البنية)
    const responseKey = Object.keys(replies).find(k => text.includes(k));

    if (responseKey) {
      return api.sendMessage(replies[responseKey], event.threadID);
    }
  }
};
