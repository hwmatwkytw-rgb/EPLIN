module.exports = {
    config: {
        name: "عنك",
        version: "1.5",
        author: "سينكو",
        countDown: 5,
        role: 2,
        prefix: true,
        description: "عرض معلومات تفصيلية عن المستخدم بزخرفة المسار الطولي.",
        category: "fun",
        guide: { ar: "{pn} [@منشن | ID]" }
    },
    onStart: async function ({ api, event, args }) {
        const { threadID, messageID, senderID, mentions } = event;
        const targetID = Object.keys(mentions)[0] || args[0] || senderID;

        api.getUserInfo(targetID, (err, info) => {
            if (err) return api.sendMessage("●───── ⌬ ─────●\n┇ ❌ فشل في جلب المعلومات.\n●───── ⌬ ─────●", threadID, messageID);
            
            const user = info[targetID];
            if (!user) return api.sendMessage("●───── ⌬ ─────●\n┇ ❌ لم يتم العثور على هذا المستخدم.\n●───── ⌬ ─────●", threadID, messageID);

            const msg = `●─────── ⌬ ───────●
┇ ⦿ ⟬ مـعـلـومـات الـمـسـتـخـدم ⟭
┇
┇  الإسـم: ${user.name}
┇  الـمـعـرف: ${targetID}
┇  الـجـنـس: ${user.gender == 2 ? "ذكـر" : "أنـثـى"}
┇  الـلـغـة: ${user.vanity || "عربي"}
┇  الـرابـط: fb.com/${targetID}
┇
●─────── ⌬ ───────●
  𓆩☆𓆪`;

            api.sendMessage(msg, threadID, messageID);
        });
    }
};
