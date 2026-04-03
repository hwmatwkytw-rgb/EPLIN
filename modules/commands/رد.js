const DEVELOPER_ID = "100081948980908";

module.exports = {
  config: {
    name: "رد",
    version: "1.0",
    author: "سينكو",
    countDown: 3,
    prefix: true,
    category: "system",
    description: "إرسال رسالة من المستخدم إلى المطور",
    guide: { ar: "{pn} [رسالتك]" }
  },

  onStart: async ({ api, event, args }) => {
    const message = args.join(" ");
    if (!message)
      return api.sendMessage("✾ ┇ اكتب رسالتك لإرسالها للمطور", event.threadID);

    const text =
`⏣────── ✾ ⌬ ✾ ──────⏣
✾ ┇ رسالة جديدة من مستخدم
✾ ┇ الاسم: ${event.senderName || "مستخدم"}
✾ ┇ الايدي: ${event.senderID}
✾ ┇
✾ ┇ الرسالة:
✾ ┇ ${message}
⏣────── ✾ ⌬ ✾ ──────⏣`;

    return api.sendMessage(text, DEVELOPER_ID);
  }
};
