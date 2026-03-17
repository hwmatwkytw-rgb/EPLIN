const axios = require('axios');
const crypto = require("crypto");

// دالة بدء جلسة استخراج الـ prompt
async function startSession(imgUrl) {
  let sessionID = crypto.randomBytes(4).toString("hex").toUpperCase();
  let data = JSON.stringify({
    data: [null, null, imgUrl, 0.3, 0.85, "threshold", 25, 10, false, false],
    event_data: null,
    fn_index: 2,
    trigger_id: 26,
    session_hash: sessionID
  });

  let config = {
    method: 'POST',
    url: 'https://pixai-labs-pixai-tagger-demo.hf.space/gradio_api/queue/join?__theme=system',
    headers: { 'Content-Type': 'application/json' },
    data: data,
    timeout: 30000
  };

  const res = await axios.request(config);
  return { data: res.data, sessionID };
}

// دالة الحصول على النتيجة
async function getResult(sessionID) {
  let config = {
    method: 'GET',
    url: 'https://pixai-labs-pixai-tagger-demo.hf.space/gradio_api/queue/data?session_hash=' + sessionID,
    timeout: 60000
  };
  return (await axios.request(config)).data;
}

// دالة استخراج الـ prompt من الصورة
async function extractPrompt(imageUrl) {
  try {
    const session = await startSession(imageUrl);
    await new Promise(resolve => setTimeout(resolve, 4000)); // زيادة وقت الانتظار قليلاً للمعالجة
    const data = await getResult(session.sessionID);
    
    // البحث عن الـ prompt في النتيجة
    const match = data.match(/"output":\{"data":\["([^"]+)","([^"]+)","([^"]+)"/);
    if (match) {
      const prompt = match[1];            
      const character = (match[2] && match[2] !== '—') ? match[2] : null; 
      const series = (match[3] && match[3] !== '—') ? match[3] : null; 
      return [series, character, prompt].filter(Boolean).join(", ");
    }
    
    const altMatch = data.match(/"data":\["([^"]+)"/);
    return altMatch ? altMatch[1] : null;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  config: {
    name: 'برومبت',
    version: '1.5',
    author: 'AbuUbaida x ابلين',
    countDown: 15,
    role: 0,
    category: 'ai',
    guide: '{pn} [رد على صورة]'
  },

  onStart: async function ({ api, event }) {
    let imageUrl = null;

    // فحص الرد أو المرفقات
    if (event.type === "message_reply" && event.messageReply.attachments?.[0]?.type === "photo") {
      imageUrl = event.messageReply.attachments[0].url;
    } else if (event.attachments?.[0]?.type === "photo") {
      imageUrl = event.attachments[0].url;
    }

    if (!imageUrl) {
      return api.sendMessage('⚠️ | يا وهم رد على صورة أو أرسل صورة مع الأمر عشان أطلع ليك الـ Prompt!', event.threadID, event.messageID);
    }

    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);
      
      const extractedPrompt = await extractPrompt(imageUrl);
      
      if (extractedPrompt) {
        api.sendMessage(`✅ | الـ Prompt المستخرج:\n\n${extractedPrompt}`, event.threadID, event.messageID);
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      } else {
        api.sendMessage('❌ | ما قدرت أطلع Prompt من الصورة دي، يمكن ما معمولة بذكاء اصطناعي.', event.threadID, event.messageID);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
      }
      
    } catch (error) {
      api.sendMessage(`⚠️ | حصل كلاش أثناء المعالجة: ${error.message}`, event.threadID, event.messageID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
