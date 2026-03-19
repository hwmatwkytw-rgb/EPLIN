const fs = require("fs-extra");
const path = __dirname + "/cache/replies.json";

module.exports = {
  config: {
    name: "ردود",
    aliases: ["reply", "الردود"],
    version: "1.5.0",
    author: "AbuUbaida",
    countDown: 0,
    role: 1, 
    category: "system"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    // التأكد من وجود المجلد والملف
    if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache");
    if (!fs.existsSync(path)) fs.writeJsonSync(path, {});

    const action = args[0]?.toLowerCase();
    const storage = fs.readJsonSync(path);

    if (!action) {
      return api.sendMessage("『 نظام الردود 』\n\n✾ الـصيغة:\n- ردود اضف [كلمة] | [رد]\n- ردود حذف [كلمة]", threadID, messageID);
    }

    // --- إضـافـة رد ---
    if (action === "اضف" || action === "أضف") {
      const content = args.slice(1).join(" ").split("|").map(t => t.trim());
      const trigger = content[0]?.toLowerCase();
      const response = content[1];

      if (!trigger || !response) {
        return api.sendMessage("✾ خـطأ: اسـتخدم الـفاصلة | بـين الـكلمة والـرد.", threadID, messageID);
      }

      storage[trigger] = response;
      fs.writeJsonSync(path, storage);
      return api.sendMessage(`✅ تـم حـفظ الـرد:\n⚝ الـكلمة: ${trigger}\n⚝ الـرد: ${response}`, threadID, messageID);
    }

    // --- حـذف رد ---
    if (action === "حذف") {
      const trigger = args.slice(1).join(" ").trim().toLowerCase();
      if (!storage[trigger]) return api.sendMessage("✾ الـكلمة غير مـوجودة!", threadID, messageID);

      delete storage[trigger];
      fs.writeJsonSync(path, storage);
      return api.sendMessage(`✅ تـم حـذف الـرد الخاص بـ "${trigger}"`, threadID, messageID);
    }
  }
};
