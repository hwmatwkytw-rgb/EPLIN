// ==================================
// إرسال رسالة الترحيب - تعديل الزقرة فقط (النسخة الشغالة)
// ==================================
async function sendGroupWelcome(api, threadID, userIDs) {
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const mentions = [];
    
    // رجعت بناء النص الأصلي عشان يشتغل معاك بدون مشاكل
    let bodyText = `╭━━〔نـورتـم مــجمـوعـــتنه〕━━╮\n✾ ┇ ⸻⸻⸻⸻⸻\n\n`;

    let count = 1;

    for (const id of userIDs) {
      const key = `${id}_${threadID}`;
      if (welcomedUsers.has(key)) continue;

      welcomedUsers.add(key);

      try {
        const userInfo = await api.getUserInfo(id);
        const name = userInfo?.[id]?.name || "عضو جديد";
        const tag = `@${name}`;

        // تغيير الرموز الجانبية فقط مع الحفاظ على المنشن
        bodyText += `✾ ┇  ✦ ${count} ➜ ${tag}\n`;

        mentions.push({
          tag,
          id
        });

        count++;
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    }

    if (!mentions.length) return;

    const memberCount = threadInfo.participantIDs.length;

    // رجعت كلامك الأصلي بالحرف داخل الزقرة الجديدة
    bodyText += `\n✾ ┇ ━━━━━━━━━━━━━━━\n✾ ┇ 👥 عدد الأعضاء الآن : ${memberCount}\n✾ ┇ 🎉 نتمنى لك أوقات ممتعة معنا\n✾ ┇ 🤝 شارك – تفاعل – استمتع\n✾ ┇ 💬 أي استفسار لا تتردد\n\n✾ ┇    ≛ ⇄ 𝐓𝐍𝐗『 𝑾𝒆𝒍𝒄𝒐𝒎𝒆 💫 』\n╰━━━〔   ✾  S I  ✾   〕━━━╯`;

    await api.sendMessage(
      {
        body: bodyText,
        mentions
      },
      threadID
    );

    log('info', `Users welcomed with mention in ${threadID}`);

  } catch (error) {
    log('error', `sendGroupWelcome error: ${error.message}`);
  }
}
