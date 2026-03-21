const axios = require("axios");
const FormData = require('form-data');
const fs = require('fs');
const glam = require("./utils/glam.js");
const suno = require("./utils/sono.js");


const prem = require("./utils/prem.js");
const crypto = require("crypto");
const { videoDuration } = require('@numairawan/video-duration');
function Sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function pinterest(search) {
const url = 'https://api.pinterest.com/v3/search/pins/';
  const params = {
  query: search,
  etslf: 25901,
  fields: 'explorearticle.cover_images[474x,236x,280x280],pin.images[736x,236x],board.images[150x150],user.explicitly_followed_by_me,pin.story_pin_data_id,pin.story_pin_data(),explorearticle.dominant_colors,board.id,pin.domain,user.last_name,pincarouseldata.id,user.is_partner,pin.is_eligible_for_brand_catalog,pin.tracking_params,pin.promoter(),pin.aggregated_pin_data(),video.duration,user.partner(),pincarouselslot.details,pin.source_interest(),pin.promoted_android_deep_link,pin.ad_match_reason,explorearticle.type,pincarouseldata.carousel_slots,pin.is_repin,pin.is_video,board.collaborator_invites_enabled,pin.is_native,pincarouselslot.rich_metadata,board.category,user.show_creator_profile,pin.category,user.id,pin.link,pin.requires_advertiser_attribution,pin.is_cpc_ad,pin.pinner(),aggregatedpindata.is_shop_the_look,pin.grid_title,aggregatedpindata.aggregated_stats,board.privacy,pin.id,pin.comment_count,pin.is_full_width,pin.promoted_is_removable,pin.native_creator(),pin.type,pin.dark_profile_link,pin.done_by_me,aggregatedpindata.comment_count,board.archived_by_me_at,user.custom_gender,explorearticle.subtitle,aggregatedpindata.did_it_data,board.name,pin.promoted_is_max_video,pin.via_pinner,explorearticle.show_cover,pin.image_crop,pincarouseldata.index,pin.dominant_color,pincarouselslot.images[345x,750x],aggregatedpindata.pin_tags,pin.is_eligible_for_web_closeup,pincarouselslot.title,pin.ad_destination_url,board.created_at,pin.image_signature,explorearticle.curator(),explorearticle.title,board.followed_by_me,user.full_name,pin.videos(),aggregatedpindata.pin_tags_chips,pin.closeup_description,board.owner(),user.is_default_image,pincarouselslot.id,user.first_name,explorearticle.video_cover_pin(),storypindata.page_count,pincarouselslot.domain,pin.created_at,pincarouselslot.link,user.type,board.type,aggregatedpindata.id,board.url,pin.description,pin.board(),pin.is_promoted,pin.cacheable_id,pin.carousel_data(),board.should_show_board_activity,explorearticle.content_type,user.verified_identity,explorearticle.story_category,board.image_cover_url,pin.shopping_flags,pin.embed(),pin.is_downstream_promotion,board.section_count,user.gender,pin.recommendation_reason,aggregatedpindata.is_stela,video.video_list[V_HLSV4],user.image_medium_url,user.username,pincarouselslot.ad_destination_url,explorearticle.id,video.id,board.pin_count,pin.rich_summary()',
  eq: 'gojo',
  dynamic_grid_stories: 6,
  page_size: 200,
  asterix: true,
  commerce_only: false,
  filters: '',
  rs: 'autocomplete',
  'term_meta[0]': 'gojo satoru|autocomplete|0'
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
        'authorization': 'Bearer MTQzMTYwMjoxMDc1NTE2MDkyMTcwMTQxNDQwOjkyMjMzNzIwMzY4NTQ3NzU4MDc6MXwxNzUxOTI5MjQzOjE1NTUyMDAwLS03MjU2ZjkyNjk2OGI3ZDZkNTUwYjdhNmZlOWE4ZWVjZg==', // Replace with a valid token if needed
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
  .map((item, index) => {
    let imageUrls = [];

    if (item.carousel_data && item.carousel_data.carousel_slots) {
      imageUrls = item.carousel_data.carousel_slots
        .map(slot => slot.images?.['736x']?.url)
        .filter(url => url); 
    } else {

      const singleImageUrl = item.images?.['736x']?.url || item.link || '';
      if (singleImageUrl) {
        imageUrls.push(singleImageUrl);
      }
    }

    return {
      id: item.id,
      title: item.grid_title || item.title || '',
      image_urls: imageUrls
    };
  })
  .filter(item => item.image_urls.length > 0);
  
      const imgs = Data.flatMap(pin => pin.image_urls);

    return {
      count: imgs.length,
      data: imgs
    };

};
class MidJourney {

constructor() {

	this.path = './SHELLY/COMMANDS/cache/Midjourney.json';

}

async ReadToken() {

		try {

				const data = await fs.readFile(this.path, 'utf-8');

				const token = JSON.parse(data).token;

				return token;

		} catch (error) {

				return null;

		}

}

async SaveToken(token) {

		try {

				await fs.writeFile(this.path, JSON.stringify({ token }));

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

		if (!token) {

				token = await this.ScrapeToken();

		}

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

				const randomIndex = Math.floor(Math.random() * charset.length);

				password += charset[randomIndex];

		}

		return password;

}

async MakeMail() {

		const options = {

				method: 'POST',

				url: 'https://api.internal.temp-mail.io/api/v3/email/new',

				data: {

						min_name_length: 10,

						max_name_length: 10

				}

		};

		try {

				const response = await axios.request(options);

				return response.data;

		} catch (error) {



		}

}

async Verificate(email) {

		try {

				await axios.post('https://auth.zhishuyun.com/api/v1/email-code', {

						template: "115309",

						receiver: email

				});

		} catch (error) {



		}

}

async GetMails(mail) {

		const options = {

				method: 'GET',

				url: `https://api.internal.temp-mail.io/api/v3/email/${mail}/messages`,

				data: null

		};

		try {

				let response = await axios.request(options);

				while (!response.data[0]) {

						response = await axios.request(options);

				}

				let emailText = response.data[0].body_text;

				const codeMatch = emailText.match(/您的邮箱验证码为\s*(\d{6})/);

				const code = codeMatch ? codeMatch[1] : null;

				if (code) {

						return code;

				} else {



						return null;

				}

		} catch (error) {



		}

}

async MakeUser(email, code) {

		const password = this.RandomPass();

		try {

				const response = await axios.post('https://auth.zhishuyun.com/api/v1/users', {

						email: email,

						email_code: code,

						password: password

				});

				if (response.status === 200) {

						return { email, password, Code: code };

				} else {



				}

		} catch (error) {



		}

}

async Login(email, code, password) {

		try {

				const response = await axios.post('https://auth.zhishuyun.com/api/v1/login/', {

						email: email,

						email_code: code,

						password: password

				});

				if (response.status === 200) {

						const { access_token } = response.data;

						return access_token;

				}

		} catch (error) {



		}

}

async FinalToken(auth) {

		try {

				const response = await axios.post(

					'https://data.zhishuyun.com/api/v1/applications/',

					{

						'type': 'Api',

						'api_id': '9a628863-8879-462b-bbee-5dc46505b733'

					},

					{

						headers: {

							'Accept': 'application/json',

							'Accept-Language': 'en-US,en;q=0.9,ar-US;q=0.8,ar;q=0.7',

							'Authorization': 'Bearer ' + auth,

							'Connection': 'keep-alive',

							'Content-Type': 'application/json',

							'Cookie': 'INVITER_ID=undefined',

							'Origin': 'https://data.zhishuyun.com',

							'Referer': 'https://data.zhishuyun.com/services/d87e5e99-b797-4ade-9e73-b896896b0461',

							'Sec-Fetch-Dest': 'empty',

							'Sec-Fetch-Mode': 'cors',

							'Sec-Fetch-Site': 'same-origin',

							'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',

							'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',

							'sec-ch-ua-mobile': '?0',

							'sec-ch-ua-platform': '"Linux"'

						}

					}

				);





				const response1 = await axios.get('https://data.zhishuyun.com/api/v1/applications/', {

					params: {

						'limit': '10',

						'offset': '0',

						'user_id': response.data.user_id,

						'type': 'Api',

						'ordering': '-created_at'

					},

					headers: {

						'Accept': 'application/json',

						'Accept-Language': 'en-US,en;q=0.9,ar-US;q=0.8,ar;q=0.7',

						'Authorization': 'Bearer ' + auth,

						'Connection': 'keep-alive',

						'Cookie': 'INVITER_ID=undefined',

						'Referer': 'https://data.zhishuyun.com/console/applications',

						'Sec-Fetch-Dest': 'empty',

						'Sec-Fetch-Mode': 'cors',

						'Sec-Fetch-Site': 'same-origin',

						'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',

						'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',

						'sec-ch-ua-mobile': '?0',

						'sec-ch-ua-platform': '"Linux"'

					}

				});



				return response1.data.items[0].credential.token;

				} catch (e) {



				return "err";

				}

}

async Generate(Prompt) {

		if (!Prompt) return;

		try {

				 const Token = await this.GetToken(); 

				 const url = 'https://api.zhishuyun.com/midjourney/imagine';

				 const body = {

						 prompt: Prompt,

						 action: 'generate',

				 };

				return  await this.CallMJ(url, body, Token);

		} catch (error) {

			if(error.response.data.detail === "internal server error, please contact admin" || error.response.data.detail.includes("Invalid parameter")) return 'Failed to generate image';

				return 'Failed to generate image';

		}

}

async Action(Options) {

		if (!Options.action) return;

		try {

				 const Token = await this.GetToken(); 

				 const url = 'https://api.zhishuyun.com/midjourney/imagine';

				return  await this.CallMJ(url, Options, Token);

		} catch (error) {



				return 'Failed to generate image';

		}

}



}
function generateUID() {

  const randomHex = (length) =>

    [...Array(length)]

      .map(() => Math.floor(Math.random() * 16).toString(16))

      .join('');

  return `${randomHex(8)}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}-${randomHex(12)}`;

}
async function nsfw(prompt, model) {

    let AUTH = generateUID();

    let Model = new String();

    if (model) {

        if(!isNaN(model)) {

            if(model == 1) {

                Model = "oneFORALLAnime"

            } else if (model == 2) {

                Model = "oneFORALLReality_vPony"

            } else {

                throw new Error("model should be 1 or 2")

            }

        } else throw new Error("model should be a number")

    }

  try {

    const createRes = await axios.post(

      "https://api.arting.ai/api/cg/text-to-image/create",

      {

        prompt: prompt,

        model_id: Model,

        samples: 1,

        height: 768,

        width: 512,

        negative_prompt:

          "painting, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, deformed, ugly, blurry, bad anatomy, bad proportions, extra limbs, cloned face, skinny, glitchy, double torso, extra arms, extra hands, mangled fingers, missing lips, ugly face, distorted face, extra legs, anime",

        seed: -1,

        lora_ids: "",

        lora_weight: "1",

        sampler: "Euler a",

        steps: 25,

        guidance: 7,

        clip_skip: 2,

        is_nsfw: true,

      },

      {

        headers: {

          accept: "application/json",

          "content-type": "application/json",

          authorization: AUTH,

        },

      }

    );

    const requestId = createRes.data.data.request_id;

    let imageUrls = [];

    while (imageUrls.length === 0) {

      const getRes = await axios.post(

        "https://api.arting.ai/api/cg/text-to-image/get",

        { request_id: requestId },

        {

          headers: {

            accept: "application/json",

            "content-type": "application/json",

            authorization: AUTH,

          },

        }

      );

      imageUrls = getRes.data.data.output;

      if (imageUrls.length === 0){

           await new Promise((r) => setTimeout(r, 2000)); 

          }

    }

    

    return imageUrls;

  } catch (err) {

    throw new Error(err.response ? err.response.data : err.message);

  }

}
async function stableDiff(prompt, styleNum) {

  if (!prompt || typeof prompt !== 'string') throw new Error('Prompt must be a non-empty string');

  if (styleNum === undefined || isNaN(styleNum)) throw new Error('Style must be a number');

  const styleMap = ['basic', 'anime', 'realistic'];

  if (styleNum < 0 || styleNum > styleMap.length - 1) throw new Error('Style number out of range');

  const style = styleMap[styleNum];

  const url = 'https://port-0-stable-be-m67aevdd5fb4577a.sel4.cloudtype.app/chat/dalle_dreamhourney';

  const fullUrl = `${url}?message=${encodeURIComponent(prompt)}&user_id=0c00eb8d-06c6-42fd-9659-d43367154b6d&style=${style}&app_user_id=%24RCAnonymousID%3A6b22b41ab96d4b0eb2b33dbe21c78502&subscribed=false`;

  const config = {

    method: 'POST',

    url: fullUrl,

    headers: {

      'User-Agent': 'okhttp/4.11.0',

      'Accept-Encoding': 'gzip',

      'content-type': 'application/json'

    }

  };

  try {

    const response = await axios.request(config);

    return response.data;

  } catch (error) {

    throw new Error('Failed to generate image: ' + error.message);

  }

}
async function prompt(originalPrompt) {
  let data = JSON.stringify({
    userType: 1,
    appVn: "1.2.2-221",
    dModel: "SM-A546E",
    dBrand: "Samsung",
    osVn: "",
    osType: 1,
    site: "flux-ai.io",
    originPrompt: originalPrompt
  });

  let config = {
    method: "POST",
    url: "https://api2.tap4.ai/image/promptOptimize",
    headers: {
      "User-Agent": "Dart/3.5 (dart:io)",
      "Accept-Encoding": "gzip",
      "Content-Type": "application/json",
      "credentials": "include",
      "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOiIwOjE6MTk2MTMyODAyODQ0MzY0MzkwNiIsInJuU3RyIjoiajVuY1BySlVpYlpEb2hIN2lXUGZSbFhYTDFyOXJQQzgiLCJjbGllbnRpZCI6IlVua25vd24iLCJ1c2VySWQiOjE5NjEzMjgwMjg0NDM2NDM5MDZ9.HiKz7yEZSYyKzidJz854khfUnPTaMFY5tGzcDKQuLjk",
      "content-language": "en"
    },
    data
  };

  try {
    const res = await axios.request(config);
    return res.data;
  } catch (e) {
    throw e;
  }
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function Email(temp) {
  const r = await axios.post(
    "https://temp.ly/api/emails",
    {
      username: temp,
      domain: "temp.ly",
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  return r.data.emails;
}
async function TensTokenk() {
  let r = Math.random().toString(36).slice(2);
  let ema = r + "@temp.ly";

  let data = JSON.stringify({
    password: r + r,
    password_confirm: r + r,
    email: ema,
    newsletter_subscription: true,
  });

  let config = {
    method: "POST",
    url: "https://backend.tensorpix.ai/api/accounts/register/",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "sec-ch-ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      origin: "https://app.tensorpix.ai",
      "sec-fetch-site": "same-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      referer: "https://app.tensorpix.ai/",
      "accept-language": "en-US,en;q=0.9,ar-US;q=0.8,ar;q=0.7",
    },
    data: data,
  };

  let oy = await axios.request(config);

  if (oy.status > 240) return console.log("err");

  let y = await Email(r);
  while (!y?.[0]) {
    y = await Email(r);
  }

  let gg = y[0].body.split("(")[1].replace(")", "");

  const m =
    /[?&]user_id=(?<user_id>\d+)&timestamp=(?<timestamp>\d+)&signature=(?<signature>[^&?#]+)/.exec(
      gg,
    );
  const { user_id, timestamp, signature } = m.groups;
  let pyl = { user_id, timestamp, signature };

  let data1 = JSON.stringify(pyl);

  let config1 = {
    method: "POST",
    url: "https://backend.tensorpix.ai/api/accounts/verify-registration/",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "sec-ch-ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      origin: "https://app.tensorpix.ai",
      "sec-fetch-site": "same-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      referer: "https://app.tensorpix.ai/",
      "accept-language": "en-US,en;q=0.9,ar-US;q=0.8,ar;q=0.7",
    },
    data: data1,
  };

  let res1 = await axios.request(config1);

  let data2 = JSON.stringify({
    email: ema,
    password: r + r,
  });

  let config2 = {
    method: "POST",
    url: "https://backend.tensorpix.ai/api/token/",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "sec-ch-ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      origin: "https://app.tensorpix.ai",
      "sec-fetch-site": "same-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      referer: "https://app.tensorpix.ai/",
      "accept-language": "en-US,en;q=0.9,ar-US;q=0.8,ar;q=0.7",
    },
    data: data2,
  };

  let toke = await axios.request(config2);

  let tok = toke.data.access;
  return tok;
}
async function generatePresignedUrl(token, url) {
  try {
    const des = await axios.head(url);
    const size = des.headers["content-length"];
    const res = await axios.post(
      "https://backend.tensorpix.ai/api/upload/generate-presigned-url/",
      {
        filename: "test.mp4",
        file_type: "video/mp4",
        file_size: size,
      },
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en;q=0.7",
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          priority: "u=1, i",
          "sec-ch-ua": `"Chromium";v="140", "Not=A?Brand";v="24", "Brave";v="140"`,
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": `"Windows"`,
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "sec-gpc": "1",
          Referer: "https://app.tensorpix.ai/",
        },
      },
    );
    const sign = new URL(res.data[0].presigned_url);
    const path = sign.pathname + sign.search;
    return {
      uploadID: res.data[0].media_upload_id,
      path,
      size
    };
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
async function uploadVideoFromUrl(videoUrl, uploadUrl, token) {
  try {
    const videoResponse = await axios.get(videoUrl, {
      responseType: "arraybuffer",
    });
    const videoData = Buffer.from(videoResponse.data);
    const response = await axios.put(uploadUrl, videoData, {
      headers: {
        accept: "*/*",
        "accept-language": "en;q=0.7",
        "content-type": "video/mp4",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="140", "Not=A?Brand";v="24", "Brave";v="140"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "sec-gpc": "1",
        Referer: "https://app.tensorpix.ai/",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Upload failed:",
      error.response?.status,
      error.response?.data || error.message,
    );
    throw error;
  }
}
async function finalizeUpload(uploadID, token, size, duration) {
  try {
    const imageUrl = "https://c.top4top.io/p_353715pc31.png";
    const imageResp = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    const imageBuffer = Buffer.from(imageResp.data, "binary");
    const imageBase64 = imageBuffer.toString("base64");
    
    function calcBitrate(sizeBytes, durationSec) {
  const bits = sizeBytes * 8;
  return bits / durationSec;
}

    const payload = {
      upload_id: uploadID,
      client_metadata: {
        width: 544,
        height: 368,
        size: imageBuffer.length,
        framerate: 30,
        n_frames: Math.floor((duration.ms / 1000) * 30),
        bit_depth: 8,
        bitrate: calcBitrate(size, duration.seconds),
        chroma_subsampling: "4:2:0",
        codec_id: "avc1",
        color_space: "YUV",
      },
      client_thumbnail: `data:image/jpeg;base64,${imageBase64}`,
    };
    const response = await axios.post(
      "https://backend.tensorpix.ai/api/upload/finalize-upload/",
      payload,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en;q=0.7",
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Chromium";v="140", "Not=A?Brand";v="24", "Brave";v="140"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "sec-gpc": "1",
          Referer: "https://app.tensorpix.ai/",
        },
      },
    );

    return response.data;
  } catch (err) {
    console.error(err);
  }
}
async function finalData(contentID, token) {
  return (
    await axios.get(`https://backend.tensorpix.ai/api/videos/${contentID}/`, {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en;q=0.7",
        authorization: `Bearer ${token}`,
        priority: "u=1, i",
        "sec-ch-ua":
          '"Chromium";v="140", "Not=A?Brand";v="24", "Brave";v="140"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "sec-gpc": "1",
        Referer: "https://app.tensorpix.ai/",
      },
    })
  ).data;
}
async function UpscaleVideo(fileID, token, duration) {
  let data = JSON.stringify({
    crf: 22,
    qscale: 11,
    codec: "libx264",
    chroma_subsampling: "yuv420p",
    grain: 0,
    container: "mp4",
    prores_profile: 1,
    output_resolution: 1920,
    input_video: `${fileID}`,
    ml_models: [40, 46, 43],
    stabilization_smoothing: 9,
    sharpen_strength: 2,
    start_frame: 0,
    end_frame: Math.floor((duration.ms / 1000) * 30),
  });

  let config = {
    method: "POST",
    url: "https://backend.tensorpix.ai/api/jobs/",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "sec-ch-ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
      "sec-ch-ua-mobile": "?1",
      authorization: `Bearer ${token}`,
      "sec-ch-ua-platform": '"Android"',
      origin: "https://app.tensorpix.ai",
      "sec-fetch-site": "same-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      referer: "https://app.tensorpix.ai/",
      "accept-language": "en-US,en;q=0.9,ar-US;q=0.8,ar;q=0.7",
    },
    data: data,
  };

  let VideoID = (await axios.request(config)).data.id;

  let config2 = {
    method: "GET",
    url: "https://backend.tensorpix.ai/api/jobs/",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "sec-ch-ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
      "sec-ch-ua-mobile": "?1",
      authorization: `Bearer ${token}`,
      "sec-ch-ua-platform": '"Android"',
      origin: "https://app.tensorpix.ai",
      "sec-fetch-site": "same-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      referer: "https://app.tensorpix.ai/",
      "accept-language": "en-US,en;q=0.9,ar-US;q=0.8,ar;q=0.7",
    },
  };

  let cute = (await axios.request(config2)).data.count;

  await sleep(18500);
  while (cute == 1) {
    cute = (await axios.request(config2)).data.count;
    await sleep(18500);
  }

  let config3 = {
    method: "GET",
    url: `https://backend.tensorpix.ai/api/jobs/${VideoID}/`,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "sec-ch-ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
      "sec-ch-ua-mobile": "?1",
      authorization: `Bearer ${token}`,
      "sec-ch-ua-platform": '"Android"',
      origin: "https://app.tensorpix.ai",
      "sec-fetch-site": "same-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      referer: "https://app.tensorpix.ai/",
      "accept-language": "en-US,en;q=0.9,ar-US;q=0.8,ar;q=0.7",
    },
  };

  let finUrl = (await axios.request(config3)).data.output_video.file;

  return finUrl;
}
async function upscaleVid(uploadedVideo) {
const duration = await videoDuration(uploadedVideo);
let okl = await TensTokenk();
const intialData = await generatePresignedUrl(okl, uploadedVideo);
const presignedUrl =
  "https://backend.tensorpix.ai/r2-upload/" + intialData.path;
await uploadVideoFromUrl(uploadedVideo, presignedUrl, okl);
const contentID = (await finalizeUpload(intialData.uploadID, okl, intialData.size, duration)).content_id;
let FileId = (await finalData(contentID, okl)).id;
let Upscale = await UpscaleVideo(FileId, okl, duration);
return Upscale;
}
class MagicAi {
    constructor(d_id, models) {
        this.d_id = d_id || this.GenerateID();
        this.Token = null;
        this.baseUrl = 'https://api.magicaiimage.top';
        this.models = models;
    }
     Seed() {  
       return Math.floor(Math.random() * 1e15);
     }
     Encrypt(OData) {
    const key = Buffer.from([0,0,0,109,97,103,105,0,0,0,0,0,0,0,0,0]); 
    const iv = Buffer.alloc(16, 0);
    const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
    cipher.setAutoPadding(true);
    const encryptedBuffer = Buffer.concat([cipher.update(JSON.stringify(OData), "utf8"), cipher.final()]);
    return encryptedBuffer.toString("base64");
     }

     Decrypt(Edata) {
    const key = Buffer.from([0,0,0,109,97,103,105,0,0,0,0,0,0,0,0,0]); 
    const iv = Buffer.alloc(16, 0);
    const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
    decipher.setAutoPadding(true);
    const encryptedBuffer = Buffer.from(Edata, "base64");
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8"));
     }

    GenerateID() {
        const chars = 'abcdef0123456789';
        let id = '';
        for (let i = 0; i < 16; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    }

    async Requester(endpoint, param, token = this.Token) {
    const headers = {
        "User-Agent": "okhttp/4.12.0",
        "Accept-Encoding": "gzip",
        "Content-Type": "application/json; charset=UTF-8"
    };

    const data = {
        data: this.Encrypt({
            param: param,
            header: {
                token: token || "",
                "d-id": this.d_id,
                version: "3.1.0",
                "app-code": "magic"
            }
        })
    };

    try {
        const response = await axios.post(
            `${this.baseUrl}${endpoint}`,
            data,
            { headers }
        );

        return this.Decrypt(response.data.data);
    } catch (error) {
        if (error.response) {
            console.error(
                `Request to ${endpoint} failed with status ${error.response.status}:`,
                error.response.data
            );
        } else {
            console.error(`Request to ${endpoint} failed:`, error.message);
        }
        throw error;
    }
    }

    async Login(email = '', password = '') {
        const param = {
            email: email,
            password: password,
            platform: 3,
            d_id: this.d_id,
            lang: 'en',
            d_name: 'SM-A546E',
            sys_version: '12',
            referrer: '',
            timezone: 'GMT-5'
        };
        const result = await this.Requester('/app/login', param, '');
        this.Token = result.data.token;
        return result.data;
    }

    async User() {
        return this.Requester('/app/user/info', {});
    }

    async Daily() {
        return this.Requester('/app/user/sign/task/get', {});
    }

     async Start(Prompt, Model, Ratio, Negative, NUM) {
        const param = {
            positive_prompt: Prompt,
            negative_prompt: Negative || '',
            model_id: parseInt(Model) || 27,
            styles: [
            {
            name: "None",
            weight: "1",
             }
                    ],
             quality_mode: 0,
             proportion: parseInt(Ratio) || 0,
             batch_size: 1,
             public: true,
             cfg: parseInt(this.models[NUM].default.cfg),
             steps: parseInt(this.models[NUM].default.steps),
             random_seed: this.Seed(),
             sampler_name: this.models[NUM].default.sampler_name,
             scheduler: this.models[NUM].default.scheduler_name,
             speed_type: 0,
        };
        const Data = await this.Requester('/app/task/text_to_image/post', param);
        return Data?.data?.task?.id;
    }
    async Prompt() {
        const Prompt = await this.Requester('/app/task/prompt/random/get', {});
        return Prompt.data
    }

    async Pricing() {
        return this.Requester('/app/task/price/quick/get', {});
    }

    async Status(TaskID) {
        const param = { task_id: TaskID };
        return this.Requester('/app/task/status_v2/get', param);
    }

    async Task(TaskID) {
        let result;
        do {
            this.Status(TaskID)
            result = await this.Waiting();
          if (!result.data || !result.data[0] || !result.data[0].progress) break;
         if (result.data[0].progress.overall_percentage === "100.00") break;
            await new Promise(res => setTimeout(res, 2000));
        } while (true);
        return result;
    }

    async Waiting() {
        const param = { page: 1, size: 100 };
        return this.Requester('/app/task/waiting/list/get', param);
    }

    async Pictures(TaskID) {
        const param = { task_id: TaskID };
        await Sleep(5000)
        const Res = await this.Requester('/app/task/image/list/get', param);
        return Res.data[0]
    }

    async Generate(Prompt, Model, Ratio, Negative, NUM) {
       await this.Login()
       await this.User()
       await this.Daily()
        if(!Prompt) {
           Prompt = await this.Prompt()
        }
        const TaskID = await this.Start(Prompt, Model, Ratio, Negative, NUM)
        await this.Pricing()
        await this.Task(TaskID)
        return await this.Pictures(TaskID)
    }
}
async function getCode(userName) {
  
let data = JSON.stringify({
  "username": userName,
  "domain": "temp.ly"
});

let config = {
  method: 'POST',
  url: 'http://temp.ly/api/emails',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
    'Sec-GPC': '1',
    'Accept-Language': 'en;q=0.8',
    'Origin': 'http://temp.ly',
    'Referer': 'http://temp.ly/m@temp.ly'
  },
  data: data
};

let mails = (await axios.request(config)).data.emails

while(true) {
    if (mails.length == 0) {
        mails = (await axios.request(config)).data.emails;
    } else {
        const match = mails[0].body.match(/Your code:\s*(\d{6})/);
        if (match) {
        return match[1];
        } else {
        console.log("No code found");
        }
    }
}


}
async function getCookies() {
const response = await fetch("https://chataibot.pro/api/landing/hello", {
    headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ar;q=0.6",
        "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1"
    },
    method: "GET"
});
const cookies = response.headers.get('set-cookie');
return cookies;
}
async function regester(email, password, cookies) {
let data = JSON.stringify({
  "email": email,
  "password": password,
  "isAdvertisingAccepted": true,
  "mainSiteUrl": "https://chataibot.pro/api",
  "utmSource": "",
  "utmCampaign": "",
  "connectBusiness": ""
});
let config = {
  method: 'POST',
  url: 'https://chataibot.pro/api/register',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Content-Type': 'application/json',
    'sec-ch-ua-platform': '"Windows"',
    'Accept-Language': 'en',
    'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Brave";v="140"',
    'sec-ch-ua-mobile': '?0',
    'Sec-GPC': '1',
    'Origin': 'https://chataibot.pro',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'https://chataibot.pro/app/auth/sign-up',
    'Cookie': cookies
  },
  data: data
};
return (await axios.request(config)).data;
}
function randomstr(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
async function Verify(email, code, cookie) {

let data = JSON.stringify({
  "email": email,
  "token": code,
  "connectBusiness": ""
});

let config = {
  method: 'POST',
  url: 'https://chataibot.pro/api/register/verify',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Content-Type': 'application/json',
    'sec-ch-ua-platform': '"Windows"',
    'Accept-Language': 'en',
    'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Brave";v="140"',
    'sec-ch-ua-mobile': '?0',
    'Sec-GPC': '1',
    'Origin': 'https://chataibot.pro',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'https://chataibot.pro/app/auth/sign-up',
    'Cookie': cookie
  },
  data: data
};

return (await axios.request(config)).data;

}
async function generate(prompt, version = "7", cookie) {
let data = JSON.stringify({
  "text": prompt,
  "from": 1,
  "generationType": "MIDJOURNEY",
  "version": version,
  "isImprovedPrompt": false,
  "isInternational": true
});

let config = {
  method: 'POST',
  url: 'https://chataibot.pro/api/image/generate',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Content-Type': 'application/json',
    'sec-ch-ua-platform': '"Windows"',
    'Accept-Language': 'en',
    'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Brave";v="140"',
    'sec-ch-ua-mobile': '?0',
    'Sec-GPC': '1',
    'Origin': 'https://chataibot.pro',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'https://chataibot.pro/app/chat?chat_id=-2',
    'Cookie': cookie
  },
  data: data
};
    
    async function gptImg(prompt, imageUrl, cookie) {


let data = new FormData();
data.append('mode', 'edit_gpt');
data.append('chatContextId', '-2');
data.append('lang', 'en');
data.append('from', '1');
data.append('isInternational', 'true');
data.append('image', (await axios.get(imageUrl, {responseType: "stream"})).data);
data.append('version', 'gpt-image-1');
data.append('caption', prompt);

let config = {
  method: 'POST',
  url: 'https://chataibot.pro/api/file/recognize',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'sec-ch-ua-platform': '"Windows"',
    'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Brave";v="140"',
    'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary8126bS63AySkWHlB',
    'sec-ch-ua-mobile': '?0',
    'Sec-GPC': '1',
    'Accept-Language': 'en;q=0.8',
    'Origin': 'https://chataibot.pro',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'https://chataibot.pro/app/chat?chat_id=-2',
    'Cookie': cookie
  },
  data: data
};

return (await axios.request(config)).data

}

return (await axios.request(config)).data

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
};
async function gptImg(prompt, imageUrl, cookie) {


let data = new FormData();
data.append('mode', 'edit_gpt');
data.append('chatContextId', '-2');
data.append('lang', 'en');
data.append('from', '1');
data.append('isInternational', 'true');
data.append('image', (await axios.get(imageUrl, {responseType: "stream"})).data);
data.append('version', 'gpt-image-1');
data.append('caption', prompt);

let config = {
  method: 'POST',
  url: 'https://chataibot.pro/api/file/recognize',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'sec-ch-ua-platform': '"Windows"',
    'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Brave";v="140"',
    'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary8126bS63AySkWHlB',
    'sec-ch-ua-mobile': '?0',
    'Sec-GPC': '1',
    'Accept-Language': 'en;q=0.8',
    'Origin': 'https://chataibot.pro',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'https://chataibot.pro/app/chat?chat_id=-2',
    'Cookie': cookie
  },
  data: data
};

return (await axios.request(config)).data

};
async function fluxContext(prompt, imageUrl, cookie) {
let data = new FormData();
data.append('mode', 'edit_flux_kontext_max');
data.append('chatContextId', '-2');
data.append('lang', 'en');
data.append('from', '1');
data.append('isInternational', 'true');
data.append('image', (await axios.get(imageUrl, {responseType: "stream"})).data);
data.append('version', 'kontext-max');
data.append('caption', prompt);

let config = {
  method: 'POST',
  url: 'https://chataibot.pro/api/file/recognize',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'sec-ch-ua-platform': '"Windows"',
    'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Brave";v="140"',
    'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary8126bS63AySkWHlB',
    'sec-ch-ua-mobile': '?0',
    'Sec-GPC': '1',
    'Accept-Language': 'en;q=0.8',
    'Origin': 'https://chataibot.pro',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'https://chataibot.pro/app/chat?chat_id=-2',
    'Cookie': cookie
  },
  data: data
};

return (await axios.request(config)).data

};
async function gptEdit(prompt, imgUrl) {
  
    const username = randomstr(8).toLowerCase();
    const email = username + "@temp.ly";
    const password = randomstr(10);
    let cookies = await getCookies();
    await regester(email, password, cookies);
    const code = await getCode(username);
    const token = (await Verify(email, code, cookies)).jwtToken;
    cookies += `; token=${token}`;
    return await gptImg(prompt,imgUrl , cookies);
};
async function fluxEdit(prompt, imgUrl) {
  
    const username = randomstr(8).toLowerCase();
    const email = username + "@temp.ly";
    const password = randomstr(10);
    let cookies = await getCookies();
    await regester(email, password, cookies);
    const code = await getCode(username);
    const token = (await Verify(email, code, cookies)).jwtToken;
    cookies += `; token=${token}`;
    return await fluxContext(prompt,imgUrl , cookies);
}
module.exports = {
    upscaleVid,
    glam,
    prem,
    pinterest,
    MidJourney,
    nsfw,
    stableDiff,
    prompt,
    MagicAi, 
    fastMj,
    gptEdit,
    fluxEdit,
    suno
};
