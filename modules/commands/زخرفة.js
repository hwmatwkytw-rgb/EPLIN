module.exports = {
    config: {
        name: "زخرفة",
        version: "5.0",
        author: "Kenji Agent / Developed",
        countDown: 5,
        description: "محرر الزخرفة الشامل (عربي + إنجليزي)",
        category: "الأدوات",
        guide: { ar: "{pn} [النص]" }
    },

    onStart: async function ({ api, event, args }) {
        const text = args.join(" ");
        if (!text) return api.sendMessage("⚠️ الرجاء كتابة النص المراد زخرفته.", event.threadID);

        const isArabic = /[\u0600-\u06FF]/.test(text);

        // --- قاموس الخطوط الإنجليزية المتطور ---
        const fonts = {
            bold: { a: "𝐚", b: "𝐛", c: "𝐜", d: "𝐝", e: "𝐞", f: "𝐟", g: "𝐠", h: "𝐡", i: "𝐢", j: "𝐣", k: "𝐤", l: "𝐥", m: "𝐦", n: "𝐧", o: "𝐨", p: "𝐩", q: "𝐪", r: "𝐫", s: "𝐬", t: "𝐭", u: "𝐮", v: "𝐯", w: "𝐰", x: "𝐱", y: "𝐲", z: "𝐳" },
            italic: { a: "𝒂", b: "𝒃", c: "𝒄", d: "𝒅", e: "𝒆", f: "𝒇", g: "𝒈", h: "𝒉", i: "𝒊", j: "𝒋", k: "𝒌", l: "𝒍", m: "𝒎", n: "𝒏", o: "𝒐", p: "𝒑", q: "𝒒", r: "𝒓", s: "𝒔", t: "𝒕", u: "𝒖", v: "𝒗", w: "𝒘", x: "𝒙", y: "𝒚", z: "𝒛" },
            circles: { a: "ⓐ", b: "ⓑ", c: "ⓒ", d: "ⓓ", e: "ⓔ", f: "ⓕ", g: "ⓖ", h: "ⓗ", i: "ⓘ", j: "ⓙ", k: "ⓚ", l: "ⓛ", m: "ⓜ", n: "ⓝ", o: "ⓞ", p: "ⓟ", q: "ⓠ", r: "ⓡ", s: "ⓢ", t: "ⓣ", u: "ⓤ", v: "ⓥ", w: "ⓦ", x: "ⓧ", y: "ⓨ", z: "ⓩ" },
            squares: { a: "🄰", b: "🄱", c: "🄲", d: "🄳", e: "🄴", f: "🄵", g: "🄿", h: "🄷", i: "🄸", j: "🄹", k: "🄺", l: "🄻", m: "🄼", n: "🄽", o: "🄾", p: "🄿", q: "🅀", r: "🅁", s: "🅂", t: "🅃", u: "🅄", v: "🅅", w: "🅆", x: "🅇", y: "🅈", z: "🅉" },
            double: { a: "𝕒", b: "𝕓", c: "𝕔", d: "𝕕", e: "𝕖", f: "𝕗", g: "𝕘", h: "𝕙", i: "𝕚", j: "𝕛", k: "𝕜", l: "𝕝", m: "𝕞", n: "𝕟", o: "𝕠", p: "𝕡", q: "𝕢", r: "𝕣", s: "𝕤", t: "𝕥", u: "𝕦", v: "𝕧", w: "𝕨", x: "𝕩", y: "𝕪", z: "𝕫" },
            script: { a: "𝓪", b: "𝓫", c: "𝓬", d: "𝓭", e: "𝓮", f: "𝓯", g: "𝓰", h: "𝓱", i: "𝓲", j: "𝓳", k: "𝓴", l: "𝓵", m: "𝓶", n: "𝓷", o: "𝓸", p: "𝓹", q: "𝓺", r: "𝓻", s: "𝓼", t: "𝓽", u: "𝓾", v: "𝓿", w: "𝔀", x: "𝔁", y: "𝔂", z: "𝔃" },
            gothic: { a: "𝔞", b: "𝔟", c: "𝔠", d: "𝔡", e: "𝔢", f: "𝔣", g: "𝔤", h: "𝔥", i: "𝔦", j: "𝔧", k: "𝔨", l: "𝔩", m: "𝔪", n: "𝔫", o: "𝔬", p: "𝔭", q: "𝔮", r: "𝔯", s: "𝔰", t: "𝔱", u: "𝔲", v: "𝔳", w: "𝔴", x: "𝔵", y: "𝔶", z: "𝔷" }
        };

        function applyFont(txt, fontMap) {
            return txt.toLowerCase().split("").map(char => fontMap[char] || char).join("");
        }

        // --- زخارف عربية متطورة ---
        function arabicDecor(txt) {
            const types = [
                txt.split("").join("ـ"), // تمديد
                txt.split("").join(" "), // فراغ
                txt.split("").map(l => l + "ُ").join(""), // تشكيل عشوائي
                txt.split("").map(l => l + "ّ").join("") // تشكيل مكثف
            ];
            return types;
        }

        const results = [];

        // 1. قسم الإطارات الملكية
        results.push(`💎『 ${text} 』💎`);
        results.push(`👑 ⁞ ${text} ⁞ 👑`);
        results.push(`✨ ⟮ ${text} ⟯ ✨`);
        results.push(`🛡️ 【 ${text} 】 🛡️`);
        results.push(`⚔️ ◢ ${text} ◣ ⚔️`);
        results.push(`░▒▓█ ${text} █▓▒░`);

        // 2. معالجة النصوص حسب اللغة
        if (isArabic) {
            const arDecorated = arabicDecor(text);
            results.push(`🌸 ${arDecorated[0]} 🌸`);
            results.push(`🌿 ${arDecorated[1]} 🌿`);
            results.push(`🌙 ${arDecorated[2]} 🌙`);
            results.push(`🔥 ${text.split("").reverse().join("")} 🔥`); // معكوس
        } else {
            // إضافة كل الخطوط الإنجليزية المتاحة
            results.push(`𝓑𝓸𝓵𝓭: ${applyFont(text, fonts.bold)}`);
            results.push(`𝓘𝓽𝓪𝓵𝓲𝓬: ${applyFont(text, fonts.italic)}`);
            results.push(`𝓒𝓲𝓻𝓬𝓵𝓮𝓼: ${applyFont(text, fonts.circles)}`);
            results.push(`𝓢𝓺𝓾𝓪𝓻𝓮𝓼: ${applyFont(text, fonts.squares)}`);
            results.push(`𝓓𝓸𝓾𝓫𝓵𝓮: ${applyFont(text, fonts.double)}`);
            results.push(`𝓢𝓬𝓻𝓲𝓹𝓽: ${applyFont(text, fonts.script)}`);
            results.push(`𝓖𝓸𝓽𝓱𝓲𝓬: ${applyFont(text, fonts.gothic)}`);
        }

        // 3. زخارف فنية جانبية
        results.push(`╰┈➤ ${text} 🕸️`);
        results.push(`- ̗̀ ${text}  ̖́-`);
        results.push(`『 ${text.split("").join(" • ")} 』`);

        const header = "━─━─━─≪ ✠ ≫─━─━─━\n    ✨ نـتـائـج الـزخـرفـة ✨\n━─━─━─≪ ✠ ≫─━─━─━\n\n";
        api.sendMessage(header + results.join("\n\n"), event.threadID);
    }
};
