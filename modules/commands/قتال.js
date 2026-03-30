module.exports = {
    config: {
        name: "قتال",
        version: "1.1.0",
        author: "Fix Pro",
        countDown: 5,
        role: 0,
        description: "قتال تفاعلي بين شخصيتين بنظام HP",
        category: "anime"
    },

    onStart: async ({ api, event }) => {
        const { threadID, messageID, body } = event;

        if (!body || !body.toLowerCase().includes("vs")) {
            return api.sendMessage("❌ استخدم: اسم1 vs اسم2", threadID, messageID);
        }

        let [a, b] = body.split("vs").map(x => x.trim().toLowerCase());

        if (!a || !b) {
            return api.sendMessage("❌ تأكد من كتابة شخصيتين بشكل صحيح", threadID, messageID);
        }

        // ❤️ HP البداية
        let hpA = 100;
        let hpB = 100;

        const clamp = (n) => Math.max(0, n);

        // ⚔️ ضربة عشوائية
        const attack = () => {
            let dmg = Math.floor(Math.random() * 20) + 5; // 5 - 25
            let crit = Math.random() < 0.25; // 25% كريتيكال

            if (crit) dmg *= 2;

            return { dmg, crit };
        };

        let log = "";
        let round = 1;

        while (hpA > 0 && hpB > 0 && round <= 10) {

            // 🥊 A يضرب B
            let hitA = attack();
            let blockB = Math.random() < 0.18;

            if (!blockB) {
                hpB -= hitA.dmg;
                hpB = clamp(hpB);
            }

            // 🥊 B يضرب A
            let hitB = attack();
            let blockA = Math.random() < 0.18;

            if (!blockA) {
                hpA -= hitB.dmg;
                hpA = clamp(hpA);
            }

            log += `\n🔁 الجولة ${round}

🥊 ${a.toUpperCase()} ضرب ${hitA.dmg} ${hitA.crit ? "🔥 كريتيكال" : ""}
🛡️ ${b.toUpperCase()} ${blockB ? "صد الضربة 🛡️" : `HP: ${hpB}`}

🥊 ${b.toUpperCase()} ضرب ${hitB.dmg} ${hitB.crit ? "🔥 كريتيكال" : ""}
🛡️ ${a.toUpperCase()} ${blockA ? "صد الضربة 🛡️" : `HP: ${hpA}`}

────────────────`;

            round++;
        }

        let winner =
            hpA > hpB ? a :
            hpB > hpA ? b : "تعادل";

        let result =
            winner === "تعادل"
                ? "🤝 النتيجة تعادل!"
                : `🏆 الفائز هو: ${winner.toUpperCase()}`;

        return api.sendMessage(
`⚔️🔥 قتال أنمي تفاعلي 🔥⚔️

🥊 ${a.toUpperCase()} HP: ${hpA}
🥊 ${b.toUpperCase()} HP: ${hpB}

${result}

📜 تفاصيل القتال:
${log}

🎮 نظام: HP + Critical + Block + Rounds`,
            threadID,
            messageID
        );
    }
};
