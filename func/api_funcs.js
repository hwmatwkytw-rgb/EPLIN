const axios = require("axios");
const FormData = require('form-data');
const fs = require('fs');
const crypto = require("crypto");
const { videoDuration } = require('@numairawan/video-duration');
const path = require('path');

function Sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pinterest(search) {
  const url = 'https://api.pinterest.com/v3/search/pins/';
  const params = {
    query: search,
    etslf: 25901,
    fields: 'pin.images[736x,236x],pin.id,pin.grid_title,pin.carousel_data(),board.id,pin.is_video',
    eq: search,
    page_size: 50,
    asterix: true,
    commerce_only: false,
    filters: '',
    rs: 'autocomplete',
  };
  const headers = {
    'host': 'api.pinterest.com',
    'x-pinterest-app-type': '4',
    'x-b3-parentspanid': 'ec23b7572b936eea',
    'pinterest-app-info': 'version=1.0;build=1;environment=Release',
    'x-b3-traceid': '94175633547e9980',
    'x-pinterest-appstate': 'active',
    'x-pinterest-device': 'A5010',
    'x-pinterest-device-hardwareid': '7410062322815261',
    'x-b3-spanid': 'd40682d32fc4a4dc',
    'x-pinterest-installid': 'fe46b4c9019b41a5afbc7be35a18112',
    'accept-language': 'en-GB',
    'authorization': 'Bearer MTQzMTYwMjoxMDc1NTE2MDkyMTcwMTQxNDQwOjkyMjMzNzIwMzY4NTQ3NzU4MDc6MXwxNzUxOTI5MjQzOjE1NTUyMDAwLS03MjU2ZjkyNjk2OGI3ZDZkNTUwYjdhNmZlOWE4ZWVjZg==',
    'x-pinterest-carrier-name': 'IAM/Itissallat',
    'x-pinterest-carrier-mcc': '01',
    'x-pinterest-carrier-mnc': '604',
    'x-pinterest-carrier-radio-technology': 'UMTS',
    'accept-encoding': 'gzip',
    'cookie': '_b=AYrTjWU2BHdD1ZKTf0fYReUGRcQk7+J1nSFpF/UNP1KmigpBHaL/5onmLFyk7DiXfsI=; _pinterest_ct=TWc9PSZLKzVkenZTS2RSVFZtaExCYUlESGZZNWxBWENuTDQyMTdWRENvclVyWmd1V2k1R3dGSHNCS296TXhqSEhkczlNOFUwb2lpaVlsUHI5ZnBwbmI1WUdid2x6dExsUDE1ME9oL0N3K0dMZ2ppTT0mK2RiS2xwd2JUY0FQa20ybVMzWHVhQ2pTZGxjPQ==; _ir=0'
  };
  const response = await axios.get(url, { params, headers });
  const Data = response.data.data
    .filter(item => item.type === "pin")
    .map((item) => {
      let imageUrls = [];
      if (item.carousel_data && item.carousel_data.carousel_slots) {
        imageUrls = item.carousel_data.carousel_slots
          .map(slot => slot.images?.['736x']?.url)
          .filter(u => u);
      } else {
        const singleImageUrl = item.images?.['736x']?.url || item.link || '';
        if (singleImageUrl) imageUrls.push(singleImageUrl);
      }
      return { id: item.id, title: item.grid_title || '', image_urls: imageUrls };
    })
    .filter(item => item.image_urls.length > 0);
  const imgs = Data.flatMap(pin => pin.image_urls);
  return { count: imgs.length, data: imgs };
}

class MidJourney {
  constructor() {
    this.path = path.join(__dirname, '../modules/commands/cache/Midjourney.json');
  }

  async ReadToken() {
    try {
      const data = fs.readFileSync(this.path, 'utf-8');
      return JSON.parse(data).token;
    } catch (error) {
      return null;
    }
  }

  async SaveToken(token) {
    try {
      fs.writeFileSync(this.path, JSON.stringify({ token }));
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async ScrapeToken() {
    const { email } = await this.MakeMail();
    await this.Verificate(email);
    const code = await this.GetMails(email);
    if (code) {
      const { email: registeredEmail, password, Code: verificationCode } = await this.MakeUser(email, code);
      const accessToken = await this.Login(registeredEmail, verificationCode, password);
      if (accessToken) {
        const finalToken = await this.FinalToken(accessToken);
        await this.SaveToken(finalToken);
        return finalToken;
      }
    }
    throw new Error('Failed to scrape token');
  }

  async GetToken() {
    let token = await this.ReadToken();
    if (!token) token = await this.ScrapeToken();
    return token;
  }

  async CallMJ(url, body, token) {
    try {
      const response = await axios.post(`${url}?token=${token}`, body);
      return response.data;
    } catch (error) {
      if (error.response && (error.response.status === 403 || error.response.status === 401 || error.response.status === 402)) {
        token = await this.ScrapeToken();
        return await this.CallMJ(url, body, token);
      }
      throw error;
    }
  }

  RandomPass(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    return password;
  }

  async MakeMail() {
    const response = await axios.request({
      method: 'POST',
      url: 'https://api.internal.temp-mail.io/api/v3/email/new',
      data: { min_name_length: 10, max_name_length: 10 }
    });
    return response.data;
  }

  async Verificate(email) {
    try {
      await axios.post('https://auth.zhishuyun.com/api/v1/email-code', { template: "115309", receiver: email });
    } catch (error) {}
  }

  async GetMails(mail) {
    const options = { method: 'GET', url: `https://api.internal.temp-mail.io/api/v3/email/${mail}/messages`, data: null };
    let response = await axios.request(options);
    while (!response.data[0]) response = await axios.request(options);
    const emailText = response.data[0].body_text;
    const codeMatch = emailText.match(/您的邮箱验证码为\s*(\d{6})/);
    return codeMatch ? codeMatch[1] : null;
  }

  async MakeUser(email, code) {
    const password = this.RandomPass();
    const response = await axios.post('https://auth.zhishuyun.com/api/v1/users', { email, email_code: code, password });
    if (response.status === 200) return { email, password, Code: code };
  }

  async Login(email, code, password) {
    const response = await axios.post('https://auth.zhishuyun.com/api/v1/login/', { email, email_code: code, password });
    if (response.status === 200) return response.data.access_token;
  }

  async FinalToken(auth) {
    try {
      const r1 = await axios.post('https://data.zhishuyun.com/api/v1/applications/', { type: 'Api', api_id: '9a628863-8879-462b-bbee-5dc46505b733' }, { headers: { 'Authorization': 'Bearer ' + auth, 'Content-Type': 'application/json' } });
      const r2 = await axios.get('https://data.zhishuyun.com/api/v1/applications/', { params: { limit: '10', offset: '0', user_id: r1.data.user_id, type: 'Api', ordering: '-created_at' }, headers: { 'Authorization': 'Bearer ' + auth } });
      return r2.data.items[0].credential.token;
    } catch (e) {
      return "err";
    }
  }

  async Generate(Prompt) {
    if (!Prompt) return;
    try {
      const Token = await this.GetToken();
      const url = 'https://api.zhishuyun.com/midjourney/imagine';
      const body = { prompt: Prompt, action: 'generate' };
      return await this.CallMJ(url, body, Token);
    } catch (error) {
      return 'Failed to generate image';
    }
  }

  async Action(Options) {
    if (!Options.action) return;
    try {
      const Token = await this.GetToken();
      const url = 'https://api.zhishuyun.com/midjourney/imagine';
      return await this.CallMJ(url, Options, Token);
    } catch (error) {
      return 'Failed to generate image';
    }
  }
}

function generateUID() {
  const randomHex = (length) => [...Array(length)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${randomHex(8)}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}-${randomHex(12)}`;
}

async function nsfw(prompt, model) {
  let AUTH = generateUID();
  let Model = new String();
  if (model) {
    if (!isNaN(model)) {
      if (model == 1) Model = "oneFORALLAnime";
      else if (model == 2) Model = "oneFORALLReality_vPony";
      else throw new Error("model should be 1 or 2");
    } else throw new Error("model should be a number");
  }
  const createRes = await axios.post("https://api.arting.ai/api/cg/text-to-image/create", {
    prompt, model_id: Model, samples: 1, height: 768, width: 512,
    negative_prompt: "painting, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, deformed, ugly, blurry, bad anatomy, bad proportions, extra limbs, cloned face, skinny, glitchy, double torso, extra arms, extra hands, mangled fingers, missing lips, ugly face, distorted face, extra legs, anime",
    seed: -1, lora_ids: "", lora_weight: "1", sampler: "Euler a", steps: 25, guidance: 7, clip_skip: 2, is_nsfw: true,
  }, { headers: { accept: "application/json", "content-type": "application/json", authorization: AUTH } });
  const requestId = createRes.data.data.request_id;
  let imageUrls = [];
  while (imageUrls.length === 0) {
    const getRes = await axios.post("https://api.arting.ai/api/cg/text-to-image/get", { request_id: requestId }, { headers: { accept: "application/json", "content-type": "application/json", authorization: AUTH } });
    imageUrls = getRes.data.data.output;
    if (imageUrls.length === 0) await new Promise((r) => setTimeout(r, 2000));
  }
  return imageUrls;
}

async function stableDiff(prompt, styleNum) {
  if (!prompt || typeof prompt !== 'string') throw new Error('Prompt must be a non-empty string');
  if (styleNum === undefined || isNaN(styleNum)) throw new Error('Style must be a number');
  const styleMap = ['basic', 'anime', 'realistic'];
  if (styleNum < 0 || styleNum > styleMap.length - 1) throw new Error('Style number out of range');
  const style = styleMap[styleNum];
  const url = 'https://port-0-stable-be-m67aevdd5fb4577a.sel4.cloudtype.app/chat/dalle_dreamhourney';
  const fullUrl = `${url}?message=${encodeURIComponent(prompt)}&user_id=0c00eb8d-06c6-42fd-9659-d43367154b6d&style=${style}&app_user_id=%24RCAnonymousID%3A6b22b41ab96d4b0eb2b33dbe21c78502&subscribed=false`;
  const response = await axios.request({ method: 'POST', url: fullUrl, headers: { 'User-Agent': 'okhttp/4.11.0', 'Accept-Encoding': 'gzip', 'content-type': 'application/json' } });
  return response.data;
}

async function promptOptimize(originalPrompt) {
  let data = JSON.stringify({ userType: 1, appVn: "1.2.2-221", dModel: "SM-A546E", dBrand: "Samsung", osVn: "", osType: 1, site: "flux-ai.io", originPrompt: originalPrompt });
  const res = await axios.request({
    method: "POST", url: "https://api2.tap4.ai/image/promptOptimize",
    headers: { "User-Agent": "Dart/3.5 (dart:io)", "Accept-Encoding": "gzip", "Content-Type": "application/json", "credentials": "include", "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOiIwOjE6MTk2MTMyODAyODQ0MzY0MzkwNiIsInJuU3RyIjoiajVuY1BySlVpYlpEb2hIN2lXUGZSbFhYTDFyOXJQQzgiLCJjbGllbnRpZCI6IlVua25vd24iLCJ1c2VySWQiOjE5NjEzMjgwMjg0NDM2NDM5MDZ9.HiKz7yEZSYyKzidJz854khfUnPTaMFY5tGzcDKQuLjk", "content-language": "en" },
    data
  });
  return res.data;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function Email(temp) {
  const r = await axios.post("https://temp.ly/api/emails", { username: temp, domain: "temp.ly" }, { headers: { "Content-Type": "application/json" } });
  return r.data.emails;
}

async function TensTokenk() {
  let r = Math.random().toString(36).slice(2);
  let ema = r + "@temp.ly";
  let data = JSON.stringify({ password: r + r, password_confirm: r + r, email: ema, newsletter_subscription: true });
  let config = {
    method: "POST", url: "https://backend.tensorpix.ai/api/accounts/register/",
    headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36", Accept: "application/json, text/plain, */*", "Content-Type": "application/json", origin: "https://app.tensorpix.ai", referer: "https://app.tensorpix.ai/", "accept-language": "en-US,en;q=0.9,ar-US;q=0.8,ar;q=0.7" },
    data: data,
  };
  let oy = await axios.request(config);
  if (oy.status > 240) throw new Error("Registration failed");
  let y = await Email(r);
  while (!y?.[0]) y = await Email(r);
  let gg = y[0].body.split("(")[1].replace(")", "");
  const m = /[?&]user_id=(?<user_id>\d+)&timestamp=(?<timestamp>\d+)&signature=(?<signature>[^&?#]+)/.exec(gg);
  const { user_id, timestamp, signature } = m.groups;
  let pyl = { user_id, timestamp, signature };
  await axios.request({ method: "POST", url: "https://backend.tensorpix.ai/api/accounts/verify-registration/", headers: { "Content-Type": "application/json", origin: "https://app.tensorpix.ai", referer: "https://app.tensorpix.ai/" }, data: JSON.stringify(pyl) });
  let toke = await axios.request({ method: "POST", url: "https://backend.tensorpix.ai/api/token/", headers: { "Content-Type": "application/json", origin: "https://app.tensorpix.ai", referer: "https://app.tensorpix.ai/" }, data: JSON.stringify({ email: ema, password: r + r }) });
  return toke.data.access;
}

async function generatePresignedUrl(token, url) {
  const des = await axios.head(url);
  const size = des.headers["content-length"];
  const res = await axios.post("https://backend.tensorpix.ai/api/upload/generate-presigned-url/", { filename: "test.mp4", file_type: "video/mp4", file_size: size }, { headers: { accept: "application/json, text/plain, */*", authorization: `Bearer ${token}`, "content-type": "application/json", Referer: "https://app.tensorpix.ai/" } });
  const sign = new URL(res.data[0].presigned_url);
  const pth = sign.pathname + sign.search;
  return { uploadID: res.data[0].media_upload_id, path: pth, size };
}

async function uploadVideoFromUrl(videoUrl, uploadUrl) {
  const videoResponse = await axios.get(videoUrl, { responseType: "arraybuffer" });
  const videoData = Buffer.from(videoResponse.data);
  await axios.put(uploadUrl, videoData, { headers: { accept: "*/*", "content-type": "video/mp4", Referer: "https://app.tensorpix.ai/" } });
}

async function finalizeUpload(uploadID, token, size, duration) {
  const imageUrl = "https://c.top4top.io/p_353715pc31.png";
  const imageResp = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const imageBuffer = Buffer.from(imageResp.data, "binary");
  const imageBase64 = imageBuffer.toString("base64");
  function calcBitrate(sizeBytes, durationSec) { return (sizeBytes * 8) / durationSec; }
  const payload = {
    upload_id: uploadID,
    client_metadata: { width: 544, height: 368, size: imageBuffer.length, framerate: 30, n_frames: Math.floor((duration.ms / 1000) * 30), bit_depth: 8, bitrate: calcBitrate(size, duration.seconds), chroma_subsampling: "4:2:0", codec_id: "avc1", color_space: "YUV" },
    client_thumbnail: `data:image/jpeg;base64,${imageBase64}`,
  };
  const response = await axios.post("https://backend.tensorpix.ai/api/upload/finalize-upload/", payload, { headers: { accept: "application/json, text/plain, */*", authorization: `Bearer ${token}`, "content-type": "application/json", Referer: "https://app.tensorpix.ai/" } });
  return response.data;
}

async function finalData(contentID, token) {
  return (await axios.get(`https://backend.tensorpix.ai/api/videos/${contentID}/`, { headers: { accept: "application/json, text/plain, */*", authorization: `Bearer ${token}`, Referer: "https://app.tensorpix.ai/" } })).data;
}

async function UpscaleVideo(fileID, token, duration) {
  let data = JSON.stringify({ crf: 22, qscale: 11, codec: "libx264", chroma_subsampling: "yuv420p", grain: 0, container: "mp4", prores_profile: 1, output_resolution: 1920, input_video: `${fileID}`, ml_models: [40, 46, 43], stabilization_smoothing: 9, sharpen_strength: 2, start_frame: 0, end_frame: Math.floor((duration.ms / 1000) * 30) });
  let config = { method: "POST", url: "https://backend.tensorpix.ai/api/jobs/", headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36", Accept: "application/json, text/plain, */*", "Content-Type": "application/json", authorization: `Bearer ${token}`, origin: "https://app.tensorpix.ai", referer: "https://app.tensorpix.ai/" }, data };
  let VideoID = (await axios.request(config)).data.id;
  let config2 = { method: "GET", url: "https://backend.tensorpix.ai/api/jobs/", headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36", Accept: "application/json, text/plain, */*", authorization: `Bearer ${token}`, origin: "https://app.tensorpix.ai", referer: "https://app.tensorpix.ai/" } };
  let cute = (await axios.request(config2)).data.count;
  await sleep(18500);
  while (cute == 1) { cute = (await axios.request(config2)).data.count; await sleep(18500); }
  let config3 = { method: "GET", url: `https://backend.tensorpix.ai/api/jobs/${VideoID}/`, headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36", Accept: "application/json, text/plain, */*", authorization: `Bearer ${token}`, origin: "https://app.tensorpix.ai", referer: "https://app.tensorpix.ai/" } };
  return (await axios.request(config3)).data.output_video.file;
}

async function upscaleVid(uploadedVideo) {
  const duration = await videoDuration(uploadedVideo);
  let okl = await TensTokenk();
  const intialData = await generatePresignedUrl(okl, uploadedVideo);
  const presignedUrl = "https://backend.tensorpix.ai/r2-upload/" + intialData.path;
  await uploadVideoFromUrl(uploadedVideo, presignedUrl);
  const contentID = (await finalizeUpload(intialData.uploadID, okl, intialData.size, duration)).content_id;
  let FileId = (await finalData(contentID, okl)).id;
  return await UpscaleVideo(FileId, okl, duration);
}

function randomstr(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

async function getCode(userName) {
  let data = JSON.stringify({ "username": userName, "domain": "temp.ly" });
  let config = { method: 'POST', url: 'http://temp.ly/api/emails', headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json' }, data };
  let mails = (await axios.request(config)).data.emails;
  while (true) {
    if (mails.length == 0) mails = (await axios.request(config)).data.emails;
    else {
      const match = mails[0].body.match(/Your code:\s*(\d{6})/);
      if (match) return match[1];
    }
  }
}

async function getCookies() {
  const response = await fetch("https://chataibot.pro/api/landing/hello", { headers: { "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8", "accept-language": "en-US,en;q=0.9", "upgrade-insecure-requests": "1" }, method: "GET" });
  return response.headers.get('set-cookie');
}

async function regester(email, password, cookies) {
  let data = JSON.stringify({ "email": email, "password": password, "isAdvertisingAccepted": true, "mainSiteUrl": "https://chataibot.pro/api", "utmSource": "", "utmCampaign": "", "connectBusiness": "" });
  let config = { method: 'POST', url: 'https://chataibot.pro/api/register', headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json', 'Cookie': cookies }, data };
  return (await axios.request(config)).data;
}

async function Verify(email, code, cookie) {
  let data = JSON.stringify({ "email": email, "token": code, "connectBusiness": "" });
  let config = { method: 'POST', url: 'https://chataibot.pro/api/register/verify', headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json', 'Cookie': cookie }, data };
  return (await axios.request(config)).data;
}

async function generate(prompt, version = "7", cookie) {
  let data = JSON.stringify({ "text": prompt, "from": 1, "generationType": "MIDJOURNEY", "version": version, "isImprovedPrompt": false, "isInternational": true });
  let config = { method: 'POST', url: 'https://chataibot.pro/api/image/generate', headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json', 'Cookie': cookie }, data };
  return (await axios.request(config)).data;
}

async function fastMj(prompt) {
  const username = randomstr(8).toLowerCase();
  const email = username + "@temp.ly";
  const password = randomstr(10);
  let cookies = await getCookies();
  await regester(email, password, cookies);
  const code = await getCode(username);
  const token = (await Verify(email, code, cookies)).jwtToken;
  cookies += `; token=${token}`;
  return await generate(prompt, "7", cookies);
}

async function gptImg(prompt, imageUrl, cookie) {
  let data = new FormData();
  data.append('mode', 'edit_gpt');
  data.append('chatContextId', '-2');
  data.append('lang', 'en');
  data.append('from', '1');
  data.append('isInternational', 'true');
  data.append('image', (await axios.get(imageUrl, { responseType: "stream" })).data);
  data.append('version', 'gpt-image-1');
  data.append('caption', prompt);
  let config = { method: 'POST', url: 'https://chataibot.pro/api/file/recognize', headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'multipart/form-data', 'Cookie': cookie }, data };
  return (await axios.request(config)).data;
}

async function fluxContext(prompt, imageUrl, cookie) {
  let data = new FormData();
  data.append('mode', 'edit_flux_kontext_max');
  data.append('chatContextId', '-2');
  data.append('lang', 'en');
  data.append('from', '1');
  data.append('isInternational', 'true');
  data.append('image', (await axios.get(imageUrl, { responseType: "stream" })).data);
  data.append('version', 'kontext-max');
  data.append('caption', prompt);
  let config = { method: 'POST', url: 'https://chataibot.pro/api/file/recognize', headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'multipart/form-data', 'Cookie': cookie }, data };
  return (await axios.request(config)).data;
}

async function gptEdit(prompt, imgUrl) {
  const username = randomstr(8).toLowerCase();
  const email = username + "@temp.ly";
  const password = randomstr(10);
  let cookies = await getCookies();
  await regester(email, password, cookies);
  const code = await getCode(username);
  const token = (await Verify(email, code, cookies)).jwtToken;
  cookies += `; token=${token}`;
  return await gptImg(prompt, imgUrl, cookies);
}

async function fluxEdit(prompt, imgUrl) {
  const username = randomstr(8).toLowerCase();
  const email = username + "@temp.ly";
  const password = randomstr(10);
  let cookies = await getCookies();
  await regester(email, password, cookies);
  const code = await getCode(username);
  const token = (await Verify(email, code, cookies)).jwtToken;
  cookies += `; token=${token}`;
  return await fluxContext(prompt, imgUrl, cookies);
}

class MagicAi {
  constructor(d_id, models) {
    this.d_id = d_id || this.GenerateID();
    this.Token = null;
    this.baseUrl = 'https://api.magicaiimage.top';
    this.models = models;
  }

  Seed() { return Math.floor(Math.random() * 1e15); }

  Encrypt(OData) {
    const key = Buffer.from([0, 0, 0, 109, 97, 103, 105, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const iv = Buffer.alloc(16, 0);
    const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
    cipher.setAutoPadding(true);
    return Buffer.concat([cipher.update(JSON.stringify(OData), "utf8"), cipher.final()]).toString("base64");
  }

  Decrypt(Edata) {
    const key = Buffer.from([0, 0, 0, 109, 97, 103, 105, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const iv = Buffer.alloc(16, 0);
    const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
    decipher.setAutoPadding(true);
    const encryptedBuffer = Buffer.from(Edata, "base64");
    return JSON.parse(Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]).toString("utf8"));
  }

  GenerateID() {
    const chars = 'abcdef0123456789';
    let id = '';
    for (let i = 0; i < 16; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  }

  async Requester(endpoint, param, token = this.Token) {
    const headers = { "User-Agent": "okhttp/4.12.0", "Accept-Encoding": "gzip", "Content-Type": "application/json; charset=UTF-8" };
    const data = { data: this.Encrypt({ param, header: { token: token || "", "d-id": this.d_id, version: "3.1.0", "app-code": "magic" } }) };
    const response = await axios.post(`${this.baseUrl}${endpoint}`, data, { headers });
    return this.Decrypt(response.data.data);
  }

  async Login(email = '', password = '') {
    const param = { email, password, platform: 3, d_id: this.d_id, lang: 'en', d_name: 'SM-A546E', sys_version: '12', referrer: '', timezone: 'GMT-5' };
    const result = await this.Requester('/app/login', param, '');
    this.Token = result.data.token;
    return result.data;
  }

  async User() { return this.Requester('/app/user/info', {}); }
  async Daily() { return this.Requester('/app/user/sign/task/get', {}); }

  async Start(Prompt, Model, Ratio, Negative, NUM) {
    const param = { positive_prompt: Prompt, negative_prompt: Negative || '', model_id: parseInt(Model) || 27, styles: [{ name: "None", weight: "1" }], quality_mode: 0, proportion: parseInt(Ratio) || 0, batch_size: 1, public: true, cfg: parseInt(this.models[NUM].default.cfg), steps: parseInt(this.models[NUM].default.steps), random_seed: this.Seed(), sampler_name: this.models[NUM].default.sampler_name, scheduler: this.models[NUM].default.scheduler_name, speed_type: 0 };
    const Data = await this.Requester('/app/task/text_to_image/post', param);
    return Data?.data?.task?.id;
  }

  async Prompt() {
    const P = await this.Requester('/app/task/prompt/random/get', {});
    return P.data;
  }

  async Status(TaskID) { return this.Requester('/app/task/status_v2/get', { task_id: TaskID }); }

  async Waiting() { return this.Requester('/app/task/waiting/list/get', { page: 1, size: 100 }); }

  async Task(TaskID) {
    let result;
    do {
      this.Status(TaskID);
      result = await this.Waiting();
      if (!result.data || !result.data[0] || !result.data[0].progress) break;
      if (result.data[0].progress.overall_percentage === "100.00") break;
      await new Promise(res => setTimeout(res, 2000));
    } while (true);
    return result;
  }

  async Pictures(TaskID) {
    await Sleep(5000);
    const Res = await this.Requester('/app/task/image/list/get', { task_id: TaskID });
    return Res.data[0];
  }

  async Generate(Prompt, Model, Ratio, Negative, NUM) {
    await this.Login();
    await this.User();
    await this.Daily();
    if (!Prompt) Prompt = await this.Prompt();
    const TaskID = await this.Start(Prompt, Model, Ratio, Negative, NUM);
    await this.Task(TaskID);
    return await this.Pictures(TaskID);
  }
}

module.exports = { pinterest, MidJourney, nsfw, stableDiff, promptOptimize, upscaleVid, MagicAi, fastMj, gptEdit, fluxEdit };
