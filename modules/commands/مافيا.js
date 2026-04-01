const fs = require("fs-extra");

const dataFile = __dirname + "/data.json";
const pointsFile = __dirname + "/points.json";

let games = {};

/* =======================
   💎 DATA SYSTEM
======================= */

function loadData() {
  if (!fs.existsSync(dataFile)) return {};
  return JSON.parse(fs.readFileSync(dataFile));
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function loadPoints() {
  if (!fs.existsSync(pointsFile)) return {};
  return JSON.parse(fs.readFileSync(pointsFile));
}

function savePoints(data) {
  fs.writeFileSync(pointsFile, JSON.stringify(data, null, 2));
}

function getUser(data, id) {
  if (!data[id]) {
    data[id] = {
      coins: 0,
      rank: "🆕 مبتدئ",
      items: {}
    };
  }
  return data[id];
}

function getRank(coins) {
  if (coins >= 500) return "👑 أسطورة";
  if (coins >= 300) return "🔥 محترف";
  if (coins >= 150) return "⭐ قوي";
  if (coins >= 50) return "⚡ نشيط";
  return "🆕 مبتدئ";
}

/* =======================
   🏪 SHOP
======================= */

const shop = {
  "درع": 20,
  "كشف": 25,
  "رصاصة": 30,
  "إنقاذ": 25,
  "تبديل": 40
};

/* =======================
   🎮 MAIN COMMAND
======================= */

module.exports = {
  config: {
    name: "مافيا",
    version: "3.0",
    author: "ChatGPT",
    category: "game"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, senderID } = event;
    const cmd = args[0];

    let data = loadData();

    /* =======================
       🏪 SHOP COMMAND
    ======================= */
    if (cmd === "متجر") {
      let msg = "🏪 متجر المافيا 💎\n\n";

      for (let i in shop) {
        msg += `🛒 ${i} ➜ ${shop[i]} 💎\n`;
      }

      msg += "\n💡 شراء: مافيا شراء [اسم]";

      return api.sendMessage(msg, threadID);
    }

    /* =======================
       🛒 BUY
    ======================= */
    if (cmd === "شراء") {
      const item = args[1];
      const user = getUser(data, senderID);

      if (!item) return api.sendMessage("❌ اكتب اسم", threadID);
      if (!shop[item]) return api.sendMessage("❌ غير موجود", threadID);

      if (user.coins < shop[item]) {
        return api.sendMessage("❌ ما عندك 💎", threadID);
      }

      user.coins -= shop[item];
      user.items[item] = (user.items[item] || 0) + 1;

      saveData(data);

      return api.sendMessage(`✅ تم شراء ${item}`, threadID);
    }

    /* =======================
       💰 EARN COINS
    ======================= */
    if (cmd === "ربح") {
      const user = getUser(data, senderID);

      let earn = Math.floor(Math.random() * 20) + 10;

      user.coins += earn;
      user.rank = getRank(user.coins);

      saveData(data);

      return api.sendMessage(
        `💎 ربحت ${earn}\n🎖️ رتبتك: ${user.rank}`,
        threadID
      );
    }

    /* =======================
       👤 PROFILE
    ======================= */
    if (cmd === "بروفايل") {
      const user = getUser(data, senderID);

      return api.sendMessage(
        `👤 بروفايلك:\n\n💎 العملات: ${user.coins}\n🎖️ الرتبة: ${user.rank}`,
        threadID
      );
    }

    /* =======================
       🎮 START GAME (SIMPLE)
    ======================= */
    if (cmd === "بدء") {
      games[threadID] = {
        players: [],
        roles: {},
        points: loadPoints()
      };

      return api.sendMessage("🎮 تم بدء لعبة المافيا!", threadID);
    }

    return api.sendMessage("❌ أمر غير معروف", threadID);
  }
};
