module.exports = {
  config: {
    name: "المطور",
    version: "1.0",
    author: "Ꮥ.ᎥᏁᎨᎧᎯᏴᎨᏟᎻᎥᎯᎶᎯ",
    countDown: 3,
    role: 1,
    description: "يعرض معلومات المطور بشكل فخم بزخارف",
    category: "معلومات",
    guide: { ar: "اكتب المطور لعرض معلومات المطور" }
  },

  onStart: async function ({ api, event }) {
    const { threadID } = event;

    const infoText = `
✧ الـــــــــﻤطوࢪ | Ꮥ.ᎥᏁᎨᎧ ✧

⊹ الــبادئة: [!] غابله لتغير
⊹ الــــــمطوࢪ: Ꮥ.ᎥᏁᎨᎧᎯᏴᎨᏟᎻᎥᎯᎶᎯ

⊹ الـعـمـر: 17

⊹ الـتـواصـل الـرسـمـي:
فـيـسـبـوك:
https://www.facebook.com/profile.php?id=61586897962846

━━━━━━━━━━━━━━━━━━
•◌────˚❀˚── ────˚❀˚────◌
عٌٌـلََآقُُـتٌٌـيََ بًًـآلََـنِِـآسِِ کْـأوٌٌرآقُُ آلََـشُُـجّّـر  
مًًـنِِ يََـبًًـقُُـﮯ يََـثًًـمًًـر  
وٌٌمًًـنِِ يََـسِِـقُُـطِِ لََـآ يََـعٌٌـوٌٌدٍٍ
─── ･ ｡ﾟ☆: *.............* :☆ﾟ. ───
𝐌𝐘 𝐑𝐄𝐋𝐀𝐓𝐈𝐎𝐍𝐒𝐇𝐈𝐏 𝐖𝐈𝐓𝐇 𝐏𝐄𝐎𝐏𝐋𝐄 𝐈𝐒 𝐋𝐈𝐊𝐄 𝐓𝐇𝐄 𝐋𝐄𝐀𝐕𝐄𝐒 𝐎𝐅 𝐀 𝐓𝐑𝐄𝐄.  
𝐓𝐇𝐎𝐒𝐄 𝐖𝐇𝐎 𝐑𝐄𝐌𝐀𝐈𝐍 𝐁𝐄𝐀𝐑 𝐅𝐑𝐔𝐈𝐓,  
𝐀𝐍𝐃 𝐓𝐇𝐎𝐒𝐄 𝐖𝐇𝐎 𝐅𝐀𝐋𝐋 𝐃𝐎 𝐍𝐎𝐓 𝐑𝐄𝐓𝐔𝐑𝐍
•◌────˚❀˚───◌ ────˚❀˚────

━━━━━━━━━━━━━━━━━━
⊹ خـبـرتـي فـي الـبـوتـات:
• برمجة وتطوير بوتات فيسبوك ♧
`;

    const imageURL = "https://i.ibb.co/sJp75WCF/75b56d9d0b03b232909a1d1cb61f00a1.jpg";

    try {
      const imgStream = (await require("axios").get(imageURL, { responseType: "stream" })).data;

      return api.sendMessage(
        {
          body: infoText,
          attachment: imgStream
        },
        threadID
      );
    } catch (err) {
      console.error("Developer info error:", err);
      return api.sendMessage("اظن سينكو  🦧.", threadID);
    }
  }
};
