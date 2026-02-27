const { removeHomeDir, log } = global.utils;

module.exports = {
	config: {
		name: "ايف", // تم تغيير الاسم من eval إلى اختبار
		version: "1.6",
		author: "NTKhang (Arabic by Gemini)",
		countDown: 5,
		role: 2,
		description: {
			vi: "Test code nhanh",
			en: "اختبار الأكواد البرمجية بسرعة",
			ar: "اختبار الأكواد البرمجية بسرعة"
		},
		category: "owner",
		guide: {
			vi: "{pn} <đoạn code cần test>",
			en: "{pn} <الكود المراد اختباره>",
			ar: "{pn} <الكود المراد اختباره>"
		}
	},

	langs: {
		ar: {
			error: "❌ حدث خطأ أثناء التنفيذ:"
		}
	},

	onStart: async function ({ api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
		
		// الحماية: التحقق من الآيدي الخاص بك
		const myID = "61588108307572";
		if (event.senderID !== myID) {
			return api.setMessageReaction("🚯", event.messageID, () => {}, true);
		}

		// وظيفة مساعدة لعرض المخرجات
		function output(msg) {
			if (typeof msg == "number" || typeof msg == "boolean" || typeof msg == "function")
				msg = msg.toString();
			else if (msg instanceof Map) {
				let text = `Map(${msg.size}) `;
				text += JSON.stringify(mapToObj(msg), null, 2);
				msg = text;
			}
			else if (typeof msg == "object")
				msg = JSON.stringify(msg, null, 2);
			else if (typeof msg == "undefined")
				msg = "undefined";

			message.reply(msg);
		}

		function out(msg) {
			output(msg);
		}

		function mapToObj(map) {
			const obj = {};
			map.forEach(function (v, k) {
				obj[k] = v;
			});
			return obj;
		}

		// تحضير اللغة العربية
		const lang = (key) => module.exports.langs.ar[key] || key;

		const cmd = `
		(async () => {
			try {
				${args.join(" ")}
			}
			catch(err) {
				log.err("eval command", err);
				message.send(
					"${lang("error")}\\n" +
					(err.stack ?
						removeHomeDir(err.stack) :
						removeHomeDir(JSON.stringify(err, null, 2) || "")
					)
				);
			}
		})()`;
		
		eval(cmd);
	}
};
