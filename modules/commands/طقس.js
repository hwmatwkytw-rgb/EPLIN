const axios = require('axios');

module.exports = {
  config: {
    name: "طقس",
    version: "1.2",
    author: "Kenji",
    countDown: 5,
    prefix: true,
    category: "fun",
    description: "عرض حالة الطقس بزخرفة كونية"
  },

  onStart: async ({ api, event, args }) => {
    const city = args.join(" ");
    if (!city) return api.sendMessage("🪐 ‹ يرجى تحديد المدينة لفتح الرادار..", event.threadID);

    try {
      const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=026778f8303378385d8e7c1bc3326129&units=metric&lang=ar`);
      const d = res.data;

      // اختيار إيموجي الطقس المناسب
      const weatherEmoji = d.main.temp > 30 ? "🔥" : d.main.temp > 20 ? "☀️" : "☁️";

      const msg = `
   ☄️ ───  𝗦𝗞𝗬  𝗦𝗖𝗔𝗡𝗡𝗘𝗥  ─── ☄️
   
   🌑 الـمـديـنـة : ${d.name}
   🌡️ الـحـرارة : ${d.main.temp}°C ${weatherEmoji}
   🌬️ الـحـالـة : ${d.weather[0].description}
   💧 الـرطـوبـة : ${d.main.humidity}%
   
   ◈ ────────────── ◈
    🛰️ الـريـاح : ${d.wind.speed} 𝗆/𝗌
    🌅 الـشروق : ${new Date(d.sys.sunrise * 1000).toLocaleTimeString('ar-EG')}
   ◈ ────────────── ◈
   ✨ 𝖲𝖨𝖭𝖪𝖮 𝖴𝖭𝖨𝖵𝖤𝖱𝖲𝖤 ✨`;

      api.sendMessage(msg, event.threadID, event.messageID);
    } catch (e) {
      api.sendMessage("🛰️ ‹ فشل الاتصال بالأقمار الصناعية.", event.threadID);
    }
  }
};
