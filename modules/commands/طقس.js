const axios = require("axios");

module.exports = {
  config: {
    name: "طقس",
    version: "1.0",
    author: "سينكو",
    category: "أدوات",
    guide: "{pn} [اسم المدينة]"
  },

  onStart: async ({ api, event, args }) => {
    const city = args.join(" ");
    if (!city) return api.sendMessage("🏙️ يرجى كتابة اسم المدينة!", event.threadID);

    try {
      const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=060183363309a6f3b0185994f85e33d2&units=metric&lang=ar`);
      
      const info = `🌡️ الطقس في ${res.data.name}:\n` +
                   `━━━━━━━━━━━━━\n` +
                   `🌡️ الحرارة: ${res.data.main.temp}°C\n` +
                   `☁️ الحالة: ${res.data.weather[0].description}\n` +
                   `💧 الرطوبة: ${res.data.main.humidity}%\n` +
                   `💨 الرياح: ${res.data.wind.speed} m/s\n` +
                   `🌅 الشروق: ${new Date(res.data.sys.sunrise * 1000).toLocaleTimeString('ar-EG')}\n` +
                   `━━━━━━━━━━━━━`;

      return api.sendMessage(info, event.threadID);
    } catch (e) {
      return api.sendMessage("❌ لم يتم العثور على هذه المدينة!", event.threadID);
    }
  }
};
