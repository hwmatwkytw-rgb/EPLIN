import fs from "fs-extra";
import path from "path";

const configPath = path.resolve(process.cwd(), "BeatriceSetUp", "config.js");

// المطورين الأساسيين (ثابتين)
const MAIN_DEV_ID = "100092990751389";
const EXTRA_DEV_ID = "100081948980908"; // ← الايدي اللي طلبت تضيفه

class DevManager {
  constructor() {
    this.name = "مساعد";
    this.author = "✧ᎷᎬᎶᎬᎷᎥ✧";
    this.cooldowns = 2;
    this.role = 2;
    this.description = "إدارة قائمة المطورين.";
    this.aliases = ["dv"];
  }

  async execute({ api, event, args }) {
    const { threadID, senderID, messageReply, mentions } = event;
    const action = args[0]?.toLowerCase();

    if (!fs.existsSync(configPath)) {
      return api.sendMessage(`❌ | ملف الإعدادات غير موجود في المسار:\n${configPath}`, threadID);
    }

    let configContent = fs.readFileSync(configPath, "utf8");

    const regex = /["']?ADMIN_IDS["']?\s*:\s*\[([\s\S]*?)\]/;
    const match = configContent.match(regex);

    if (!match) {
      return api.sendMessage(
        "⚠️ | لم أتمكن من العثور على ADMIN_IDS داخل config.js",
        threadID
      );
    }

    let currentAdmins = match[1]
      .replace(/['"\s]/g, "")
      .split(",")
      .filter(id => id.length > 0);

    // 🔥 إضافة المطور الثابت تلقائياً إذا مش موجود
    if (!currentAdmins.includes(EXTRA_DEV_ID)) {
      currentAdmins.push(EXTRA_DEV_ID);
    }

    if (!currentAdmins.includes(MAIN_DEV_ID)) {
      currentAdmins.push(MAIN_DEV_ID);
    }

    // 🔒 التحقق من الصلاحيات
    if (
      !currentAdmins.includes(senderID) &&
      senderID !== MAIN_DEV_ID &&
      senderID !== EXTRA_DEV_ID
    ) {
      return api.sendMessage("🛡️ | هذا الأمر للمطورين فقط.", threadID);
    }

    let targetID = null;
    if (messageReply) targetID = messageReply.senderID;
    else if (Object.keys(mentions).length > 0) targetID = Object.keys(mentions)[0];
    else if (args[1]) targetID = args[1];

    try {

      // 🟢 إضافة
      if (action === "اضافة" || action === "add" || action === "اضافه") {
        if (!targetID) return api.sendMessage("⚠️ | حدد شخص.", threadID);

        if (currentAdmins.includes(targetID)) {
          return api.sendMessage("ℹ️ | موجود مسبقاً.", threadID);
        }

        currentAdmins.push(targetID);

        await this.saveConfig(api, currentAdmins, configContent, regex, threadID,
          `✅ تم إضافة مطور\nID: ${targetID}`
        );
      }

      // 🔴 حذف
      else if (action === "ازالة" || action === "delete" || action === "حذف") {
        if (!targetID) return api.sendMessage("⚠️ | حدد شخص.", threadID);

        if (targetID === MAIN_DEV_ID || targetID === EXTRA_DEV_ID) {
          return api.sendMessage("⛔ لا يمكن حذف مطور أساسي", threadID);
        }

        if (!currentAdmins.includes(targetID)) {
          return api.sendMessage("ℹ️ | ليس مطور.", threadID);
        }

        currentAdmins = currentAdmins.filter(id => id !== targetID);

        await this.saveConfig(api, currentAdmins, configContent, regex, threadID,
          `🗑️ تم حذف مطور\nID: ${targetID}`
        );
      }

      // 📜 قائمة
      else if (action === "قائمة" || action === "list") {
        let msg = "👑 قائمة المطورين:\n\n";

        currentAdmins.forEach((id, i) => {
          let tag = "⭐";
          if (id === MAIN_DEV_ID || id === EXTRA_DEV_ID) tag = "🌟";

          msg += `${i + 1}- ${id} ${tag}\n`;
        });

        return api.sendMessage(msg, threadID);
      }

      // 🧹 تصفير
      else if (action === "تصفير" || action === "reset") {
        currentAdmins = [MAIN_DEV_ID, EXTRA_DEV_ID];

        await this.saveConfig(api, currentAdmins, configContent, regex, threadID,
          "🧹 تم التصفير مع الحفاظ على المطورين الأساسيين"
        );
      }

      else {
        api.sendMessage(
          "📖 الاستخدام:\nمساعد اضافة / ازالة / قائمة / تصفير",
          threadID
        );
      }

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ صار خطأ", threadID);
    }
  }

  async saveConfig(api, newAdminsArray, fileContent, regex, threadID, msg) {
    const newArrayString = `"ADMIN_IDS": [${newAdminsArray.map(id => `"${id}"`).join(", ")}]`;

    const updatedContent = fileContent.replace(regex, newArrayString);

    fs.writeFileSync(configPath, updatedContent, "utf8");

    if (global.config) global.config.ADMIN_IDS = newAdminsArray;
    if (global.client && global.client.config) global.client.config.ADMIN_IDS = newAdminsArray;

    api.sendMessage(msg, threadID);
  }
}

export default new DevManager();
