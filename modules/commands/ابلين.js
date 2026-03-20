const axios = require("axios");

module.exports = {
  config: {
    name: "ابلين_الذكية",
    version: "7.0.0",
    author: "محمد (SINKO)",
    countDown: 0,
    role: 0,
    category: "AI"
  },

  handleEvent: async function ({ api, event }) {
    const { body, threadID, messageID, senderID, type } = event;
    
    if (type !== "message" && type !== "message_reply") return;
    if (!body || senderID == api.getCurrentUserID()) return;

    const input = body.toLowerCase();
    const keywords = ["ابلين", "بنتي", "يا مزه", "يا ابلين"];
    const hasName = keywords.some(word => input.includes(word));

    if (hasName) {
      api.setMessageReaction("💅", messageID, () => {}, true);
      api.sendTypingIndicator(threadID);

      try {
        // نظام الـ History عشان ابلين تتذكر الكلام القبل كدة (زي كود صاحبك)
        const history = [
          {
            role: "system",
            content: "إنتِ ابلين، بنت سودانية ردّاحة وذكية ومطورة بوتات. لسانك حار وبتقولي (يا وهم، بل بس، أحييي، يا رمة، يا مان). ردي بلهجتك السودانية فقط وممنوع الفصحى."
          },
          { role: "user", content: body }
        ];

        const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
        let formData = "";
        formData += `--${boundary}\r\nContent-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n`;
        formData += `--${boundary}\r\nContent-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n`;
        formData += `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nstandard\r\n`;
        formData += `--${boundary}\r\nContent-Disposition: form-data; name="hacker_is_stinky"\r\n\r\nvery_stinky\r\n`;
        formData += `--${boundary}\r\nContent-Disposition: form-data; name="enabled_tools"\r\n\r\n[]\r\n--${boundary}--\r\n`;

        const response = await axios({
          method: "POST",
          url: "https://api.deepai.org/hacking_is_a_serious_crime",
          headers: {
            "content-type": `multipart/form-data; boundary=${boundary}`,
            "origin": "https://deepai.org",
            "user-agent": "Mozilla/5.0"
          },
          data: formData
        });

        let reply = response.data.output || response.data.text || response.data;
        reply = reply.replace(/\\n/g, "\n").replace(/\\"/g, '"').trim();

        if (reply) {
          return api.sendMessage(reply, threadID, messageID);
        }

      } catch (err) {
        console.error("خطأ ابلين الجديد:", err.message);
        return api.sendMessage("أحييي يا محمد، عقل ابلين الجديد ده جاط شوية، حاول تاني! 🔨🗿", threadID, messageID);
      }
    }
  },

  onStart: async function ({ api, event }) {
    api.sendMessage("ابلين اشتغلت بمحرّك 'البل' الجديد.. نادوني ووروني عرض أكتافكم! 💅🚀", event.threadID);
  }
};
