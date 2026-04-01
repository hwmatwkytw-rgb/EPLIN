module.exports = {
    config: {
        name: "اكسو",
        version: "1.3.0",
        author: "Fix Pro",
        countDown: 3,
        role: 0,
        description: "لعبة إكس أو بالرد لاختيار اللاعبين",
        category: "game"
    },

    onStart: async ({ api, event }) => {
        const { threadID, messageID, senderID, messageReply } = event;

        global.xoGame = global.xoGame || {};
        global.userPoints = global.userPoints || {};
        global.groupPoints = global.groupPoints || {};

        // 🚫 إذا فيه مباراة شغالة في نفس الجروب
        if (global.xoGame[threadID] && global.xoGame[threadID].active) {
            return api.sendMessage(
                "❌ توجد مباراة شغالة بالفعل في هذا الجروب!\n⏳ انتظر انتهاء المباراة",
                threadID,
                messageID
            );
        }

        // 🎮 بدء اللعبة بالرد لاختيار الخصم
        if (messageReply) {

            let opponent = messageReply.senderID;

            if (opponent === senderID) {
                return api.sendMessage("❌ لا يمكنك اللعب مع نفسك", threadID);
            }

            global.xoGame[threadID] = {
                board: ["1","2","3","4","5","6","7","8","9"],
                players: [senderID, opponent],
                turn: senderID,
                symbols: {
                    [senderID]: "❌",
                    [opponent]: "⭕"
                },
                active: true,
                lastMsgID: null
            };

            return api.sendMessage(
                `🎮 بدأت لعبة إكس أو!

❌ اللاعب: ${senderID}
⭕ الخصم: ${opponent}

🔥 ابدأ اللعب!`,
                threadID,
                messageID
            );
        }

        return api.sendMessage(
            "ℹ️ لبدء اللعبة:\n- اكتب: اكسو\n- ثم رد على لاعب ليتم اختياره",
            threadID
        );
    },

    onChat: async ({ api, event }) => {
        const { threadID, senderID, body } = event;

        if (!global.xoGame || !global.xoGame[threadID]) return;

        let game = global.xoGame[threadID];

        if (!game.active) return;
        if (!body || isNaN(body)) return;
        if (game.turn !== senderID) return;

        let pos = parseInt(body) - 1;

        if (pos < 0 || pos > 8) return;
        if (game.board[pos] === "❌" || game.board[pos] === "⭕") return;

        let symbol = game.symbols[senderID];
        game.board[pos] = symbol;

        const winCases = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];

        const checkWin = (sym) => {
            return winCases.some(c =>
                c.every(i => game.board[i] === sym)
            );
        };

        // 🗑️ حذف الرسالة القديمة
        if (game.lastMsgID) {
            try {
                await api.unsendMessage(game.lastMsgID);
            } catch (e) {}
        }

        // 🎉 فوز
        if (checkWin(symbol)) {

            game.active = false;

            global.userPoints[senderID] =
                (global.userPoints[senderID] || 0) + 1;

            global.groupPoints[threadID] =
                (global.groupPoints[threadID] || 0) + 1;

            delete global.xoGame[threadID];

            return api.sendMessage(
                `🎉 انتهت اللعبة!

🏆 الفائز: ${symbol}
⭐ نقاط اللاعب: ${global.userPoints[senderID]}
🏠 نقاط الجروب: ${global.groupPoints[threadID]}`,
                threadID
            );
        }

        // 🔁 تبديل الدور
        let index = game.players.indexOf(senderID);
        game.turn = game.players[(index + 1) % 2];

        api.sendMessage(
            `🎮 الدور على ${game.symbols[game.turn]}\n\n` +
            `${game.board[0]} | ${game.board[1]} | ${game.board[2]}\n` +
            `---------\n` +
            `${game.board[3]} | ${game.board[4]} | ${game.board[5]}\n` +
            `---------\n` +
            `${game.board[6]} | ${game.board[7]} | ${game.board[8]}`,
            threadID,
            (err, info) => {
                if (!err) game.lastMsgID = info.messageID;
            }
        );
    }
};
