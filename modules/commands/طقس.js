const axios = require('axios');

module.exports = {
  config: {
    name: "طقس",
    version: "1.5",
    author: "Kenji",
    countDown: 5,
    prefix: true,
    category: "fun",
    description: "عرض حالة الطقس بزخرفة النخبة"
  },

  onStart: async ({ api, event, args }) => {
    const city = args.join(" ");
    if (!city) return api.sendMessage("⚠️ ‹ يرجى كتابة اسم المدينة (مثال: طقس السودان)", event.threadID);

    try {
      // استخدام API بمفتاح جديد ومستقر
      const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=e269f829f045233e70d744f933157f44&units=metric&lang=ar`);
      const d = res.data;

      const msg = `
   ┏━━━━━━━ ⚡︎ ━━━━━━━┓
      𝗥𝗘𝗔𝗟-𝗧𝗜𝗠𝗘 𝗪𝗘𝗔𝗧𝗛𝗘𝗥
   ┗━━━━━━━ ⚡︎ ━━━━━━━┛

   📍 الـمـكـان : ${d.name} | ${d.sys.country}
   🌡️ الـحـرارة : ${Math.round(d.main.temp)}°C
   ☁️ الـحـالـة : ${d.weather[0].description}
   💧 الـرطـوبـة : ${d.main.humidity}%

   ◈ ━━━━━━━━━━━━━━ ◈
    💨 الـريـاح : ${d.wind.speed} m/s
    🕒 الـتـوقـيت : ${new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
   ◈ ━━━━━━━━━━━━━━ ◈
   ✨ 𝖲𝖨𝖭𝖪𝖮 𝖤𝖣𝖨𝖳𝖨𝖮𝖭 ✨`;

      api.sendMessage(msg, event.threadID, event.messageID);
    } catch (e) {
      console.error(e);
      api.sendMessage("❌ ‹ لم يتم العثور على المدينة، حاول كتابة الاسم بشكل صحيح.", event.threadID);
    }
  }
};
