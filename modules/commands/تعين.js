module.exports = {
    config: {
        name: ' تعين',
        version: '1.0',
        author: 'Hridoy',
        countDown: 5,
        prefix: true,
        groupAdminOnly: false,
        description: 'تعيين رتبة المستخدم، نقاط الخبرة أو إعادة ضبطها (لأدمن البوت فقط).',
        category: 'admin',
        guide: {
            ar: '   {pn} xp [@mention|uid] <العدد>' +
                '\n   {pn} level [@mention|uid] <المستوى>' +
                '\n   {pn} reset [@mention|uid]'
        },
    },
    onStart: async ({ api, event, args }) => {
        const { senderID, mentions } = event;
        const config = readDB(configPath);

        if (!config.adminUIDs || !config.adminUIDs.includes(senderID)) {
            return api.sendMessage("ليس لديك إذن لاستخدام هذا الأمر.", event.threadID);
        }

        const subcommand = args.shift();
        let targetID;
        let valueArg;

        if (mentions && Object.keys(mentions).length > 0) {
            targetID = Object.keys(mentions)[0];
            const mentionText = mentions[targetID];
            const remainingText = args.join(' ');
            valueArg = remainingText.replace(mentionText, '').trim();
        } else {
            targetID = args.shift();
            valueArg = args.join(' ');
        }

        if (!subcommand || !targetID) {
            return api.sendMessage('استخدام غير صحيح. الرجاء اتباع الدليل.', event.threadID);
        }

        const userDB = readDB(userDBPath);

        if (!userDB[targetID]) {
            return api.sendMessage("هذا المستخدم لا يمتلك حسابًا.", event.threadID);
        }

        switch (subcommand) {
            case 'xp':
                const xpAmount = parseInt(valueArg);
                if (isNaN(xpAmount) || xpAmount < 0) {
                    return api.sendMessage('الرجاء إدخال عدد نقاط خبرة صالح وغير سلبي.', event.threadID);
                }
                userDB[targetID].xp = xpAmount;
                writeDB(userDBPath, userDB);
                return api.sendMessage(`تم تعيين نقاط الخبرة لـ ${userDB[targetID].name} إلى ${xpAmount}.`, event.threadID);

            case 'level':
                const levelAmount = parseInt(valueArg);
                if (isNaN(levelAmount) || levelAmount < 0) {
                    return api.sendMessage('الرجاء إدخال مستوى صالح وغير سلبي.', event.threadID);
                }
                userDB[targetID].rank = levelAmount;
                writeDB(userDBPath, userDB);
                return api.sendMessage(`تم تعيين مستوى ${userDB[targetID].name} إلى ${levelAmount}.`, event.threadID);

            case 'reset':
                userDB[targetID].xp = 0;
                userDB[targetID].rank = 1;
                userDB[targetID].totalxp = 0; 
                writeDB(userDBPath, userDB);
                return api.sendMessage(`تم إعادة ضبط رتبة ونقاط خبرة ${userDB[targetID].name}.`, event.threadID);

            default:
                return api.sendMessage('الأمر غير صالح. استخدم xp أو level أو reset.', event.threadID);
        }
    },
};
