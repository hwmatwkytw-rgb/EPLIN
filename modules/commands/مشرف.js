const fs = require('fs-extra');
const path = require('path');

const filePath = path.resolve(process.cwd(), "BeatriceSetUp", "roles.json");

// المطور
const DEVELOPER_ID = "100081948980908";

module.exports = {
  config: {
    name: "مشرف",
    version: "4.1",
    author: "Modified",
    countDown: 3,
    role: 2,
    prefix: true,
    description: "نظام رتب (رد + ايدي)",
    category: "owner",
    guide: {
      ar: "{pn} اضافة [ID/رد] [الرتبة]",
    },
  },

  onStart: async ({ api, event, args }) => {
    const { threadID, senderID, messageReply } = event;
    const action = args[0]?.toLowerCase();

    // 🔒 المطور فقط
    if (senderID !== DEVELOPER_ID) {
      return api.sendMessage("❌ هذا الأمر للمطور فقط", threadID);
    }

    if (!fs.existsSync(filePath)) {
      fs.writeJsonSync(filePath, {}, { spaces: 2 });
    }

    let data = fs.readJsonSync(filePath);

    // 🎯 تحديد الهدف (رد أو آيدي)
    let targetID = null;

    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (args[1]) {
      targetID = args[1];
    }

    const roleInput = args[2]?.toLowerCase();

    const rolesMap = {
      "مشرف": "admin",
      "admin": "admin",
      "سوبر": "super",
      "super": "super",
      "vip": "vip",
      "VIP": "vip"
    };

    // ======================
    // ➕ إضافة
    // ======================
    if (["اضافة", "add"].includes(action)) {
      if (!targetID) return api.sendMessage("⚠️ رد على الشخص أو حط ID", threadID);
      if (!roleInput) return api.sendMessage("⚠️ حدد رتبة (مشرف / سوبر / VIP)", threadID);

      const role = rolesMap[roleInput];
      if (!role) return api.sendMessage("❌ رتبة غير صحيحة", threadID);

      data[targetID] = role;
      save(data);

      return api.sendMessage(`✅ تم إعطاء رتبة ${roleInput}\nID: ${targetID}`, threadID);
    }

    // ======================
    // ➖ حذف
    // ======================
    else if (["حذف", "delete"].includes(action)) {
      if (!targetID) return api.sendMessage("⚠️ رد أو حط ID", threadID);

      if (!data[targetID]) {
        return api.sendMessage("ℹ️ هذا الشخص ليس لديه رتبة", threadID);
      }

      delete data[targetID];
      save(data);

      return api.sendMessage(`🗑️ تم حذف الرتبة\nID: ${targetID}`, threadID);
    }

    // ======================
    // 📜 قائمة
    // ======================
    else if (["قائمة", "list"].includes(action)) {
      let msg = "👑 قائمة الرتب:\n\n";

      Object.keys(data).forEach((id, i) => {
        let icon = "⭐";
        if (data[id] === "super") icon = "🔥";
        if (data[id] === "vip") icon = "💎";

        msg += `${i + 1}- ${id} (${data[id]}) ${icon}\n`;
      });

      if (!msg.trim()) msg = "لا يوجد رتب";

      return api.sendMessage(msg, threadID);
    }

    else {
      api.sendMessage(
        "📖 الاستخدام:\nمشرف اضافة [ID] [مشرف/سوبر/VIP]\nأو بالرد",
        threadID
      );
    }

    function save(d) {
      fs.writeJsonSync(filePath, d, { spaces: 2 });
    }
  }
};
