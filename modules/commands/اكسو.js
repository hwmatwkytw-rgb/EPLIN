module.exports = {
    config: {
        name: "اكسو",
        version: "1.5.0",
        author: "Fix Pro",
        countDown: 3,
        role: 0,
        description: "لعبة إكس أو احترافية مع عداد وقت",
        category: "game"
    },

    onStart: async ({ api, event }) => {
        const { threadID, messageID, senderID, messageReply } = event;

        global.xoGame = global.xoGame || {};
        global.userPoints = global.userPoints || {};
        global.groupPoints = global.groupPoints || {};

        if (global.xoGame[threadID] && global.xoGame[threadID].active) {
            return api.sendMessage("❌ توجد مباراة شغالة بالفعل!", threadID, messageID);
        }

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
                lastMsgID: null,
                timer: null,
                timeLimit: 20,
                timeLeft: 20
            };

            startTurnTimer(api, threadID, global.xoGame[threadID]);

            return api.sendMessage(
                "🎮 بدأت لعبة إكس أو! ابدأ اللعب",
                threadID,
                messageID
            );
        }

        return api.sendMessage("ℹ️ اكتب (اكسو) ثم رد على لاعب", threadID);
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
            return winCases.some(c => c.every(i => game.board[i] === sym));
        };

        if (game.lastMsgID) {
            try { await api.unsendMessage(game.lastMsgID); } catch {}
        }

        if (checkWin(symbol)) {

            if (game.timer) clearInterval(game.timer);

            game.active = false;

            global.userPoints[senderID] =
                (global.userPoints[senderID] || 0) + 1;

            global.groupPoints[threadID] =
                (global.groupPoints[threadID] || 0) + 1;

            delete global.xoGame[threadID];

            return api.sendMessage(
`🎉 انتهت اللعبة!

🏆 الفائز: ${symbol}
⭐ نقاطه: ${global.userPoints[senderID]}`,
                threadID
            );
        }

        let index = game.players.indexOf(senderID);
        game.turn = game.players[(index + 1) % 2];

        startTurnTimer(api, threadID, game);

        api.sendMessage(
`『 ✦ 𝑿𝑶 𝑮𝑨𝑴𝑬 ✦ 』

╭━━━━━╮
${game.board[0]} | ${game.board[1]} | ${game.board[2]}
${game.board[3]} | ${game.board[4]} | ${game.board[5]}
${game.board[6]} | ${game.board[7]} | ${game.board[8]}
╰━━━━━╯

⋘ ──── ∗ ✧ ∗ ──── ⋙
⌬ الدور : ${game.symbols[game.turn]}
⏳ الوقت : ${game.timeLeft} ثانية
⌬ اختر خانة من 1 إلى 9
⋘ ──── ∗ ✧ ∗ ──── ⋙`,
            threadID,
            (err, info) => {
                if (!err) game.lastMsgID = info.messageID;
            }
        );
    }
};

// 🔥 نظام التايمر
function startTurnTimer(api, threadID, game) {

    if (game.timer) clearInterval(game.timer);

    game.timeLeft = game.timeLimit;

    game.timer = setInterval(() => {

        if (!game.active) {
            clearInterval(game.timer);
            return;
        }

        game.timeLeft--;

        if (game.timeLeft <= 0) {

            clearInterval(game.timer);

            let index = game.players.indexOf(game.turn);
            let next = game.players[(index + 1) % 2];

            game.turn = next;

            api.sendMessage(
                `⏰ انتهى الوقت!\n⌬ تم تخطي الدور`,
                threadID
            );

            startTurnTimer(api, threadID, game);
        }

    }, 1000);
    }
