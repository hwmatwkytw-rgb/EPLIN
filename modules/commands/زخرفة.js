module.exports = {
    config: {
        name: "زخرفة",
        version: "4.0",
        author: "Kenji Agent Legendary",
        countDown: 5,
        description: "زخرفة أسطورية ذكية للنصوص",
        category: "الأدوات",
        guide: { ar: "{pn} [النص]" }
    },

    onStart: async function ({ api, event, args }) {

        const text = args.join(" ");
        if (!text)
            return api.sendMessage("⚠️ اكتب النص المراد زخرفته.", event.threadID);

        const isArabic = /[\u0600-\u06FF]/.test(text);
        const isShort = text.length <= 6;

        // خرائط إنجليزي متعددة
        const fonts = [
            {a:"𝒂",b:"𝒃",c:"𝒄",d:"𝒅",e:"𝒆",f:"𝒇",g:"𝒈",h:"𝒉",i:"𝒊",j:"𝒋",k:"𝒌",l:"𝒍",m:"𝒎",n:"𝒏",o:"𝒐",p:"𝒑",q:"𝒒",r:"𝒓",s:"𝒔",t:"𝒕",u:"𝒖",v:"𝒗",w:"𝒘",x:"𝒙",y:"𝒚",z:"𝒛"},
            {a:"ⓐ",b:"ⓑ",c:"ⓒ",d:"ⓓ",e:"ⓔ",f:"ⓕ",g:"ⓖ",h:"ⓗ",i:"ⓘ",j:"ⓙ",k:"ⓚ",l:"ⓛ",m:"ⓜ",n:"ⓝ",o:"ⓞ",p:"ⓟ",q:"ⓠ",r:"ⓡ",s:"ⓢ",t:"ⓣ",u:"ⓤ",v:"ⓥ",w:"ⓦ",x:"ⓧ",y:"ⓨ",z:"ⓩ"},
            {a:"🅰",b:"🅱",c:"🅲",d:"🅳",e:"🅴",f:"🅵",g:"🅶",h:"🅷",i:"🅸",j:"🅹",k:"🅺",l:"🅻",m:"🅼",n:"🅽",o:"🅾",p:"🅿",q:"🆀",r:"🆁",s:"🆂",t:"🆃",u:"🆄",v:"🆅",w:"🆆",x:"🆇",y:"🆈",z:"🆉"}
        ];

        function convert(txt, map) {
            return txt.toLowerCase().split("").map(l => map[l] || l).join("");
        }

        function arabicDecorate(txt) {
            const tashkeel = ["َ","ً","ُ","ٌ","ِ","ٍ","ْ","ّ"];
            return txt.split("").map(l => {
                if (l === " ") return " ";
                return l + tashkeel[Math.floor(Math.random()*tashkeel.length)];
            }).join("");
        }

        function separator(txt) {
            const symbols = ["✦","•","ـ","✧","★","♡","⚡","♛"];
            return txt.split("").join(" " + symbols[Math.floor(Math.random()*symbols.length)] + " ");
        }

        function frame(txt) {
            const frames = [
                `『 ${txt} 』`,
                `༺ ${txt} ༻`,
                `꧁ ${txt} ꧂`,
                `◥ ${txt} ◤`,
                `✿ ${txt} ✿`,
                `♛ ${txt} ♛`
            ];
            return frames[Math.floor(Math.random()*frames.length)];
        }

        const results = [];

        // تاج لو قصير
        if (isShort) {
            results.push(`👑 ${text} 👑`);
            results.push(`♛ ${text} ♛`);
        }

        // إطار ذكي
        results.push(frame(text));

        // فصل احترافي
        results.push("✨ " + separator(text) + " ✨");

        // عكس
        results.push("🔥 " + text.split("").reverse().join("") + " 🔥");

        // قتالي
        results.push("⚔️ " + text + " ⚔️");

        // ملكي
        results.push("💎 " + text + " 💎");

        if (isArabic) {
            results.push("🌸 " + arabicDecorate(text) + " 🌸");
            results.push("👑 " + arabicDecorate(text) + " 👑");
        } else {
            const randomFont = fonts[Math.floor(Math.random()*fonts.length)];
            results.push("🔷 " + convert(text, randomFont) + " 🔷");
        }

        api.sendMessage("✨ زخرفة أسطورية:\n\n" + results.join("\n"), event.threadID);
    }
};
