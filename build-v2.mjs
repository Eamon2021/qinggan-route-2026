import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const [sourceArgument = "six-day-source.html", outputArgument = "v2/index.html"] = process.argv.slice(2);
const password = process.env.MAP_PASSWORD;

if (!password) {
  console.error("请先设置 MAP_PASSWORD，再运行构建脚本。");
  process.exit(1);
}

const sourcePath = path.resolve(sourceArgument);
const outputPath = path.resolve(outputArgument);
const sourceHtml = fs.readFileSync(sourcePath, "utf8");
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(password, salt, 310_000, 32, "sha256");
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const encrypted = Buffer.concat([
  cipher.update(Buffer.from(sourceHtml, "utf8")),
  cipher.final(),
  cipher.getAuthTag(),
]);

const payload = {
  salt: salt.toString("base64"),
  iv: iv.toString("base64"),
  data: encrypted.toString("base64"),
};

const page = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#e8eee9">
  <meta name="description" content="2026年8月8日至13日青甘六日自驾互动地图，包含道路路线、停留时间、加油和行车提醒。">
  <title>青甘六日自驾 · 访问验证</title>
  <link rel="icon" href="data:,">
  <style>
    :root{color-scheme:light;--ink:#17221c;--muted:#65716a;--green:#1d6b50;--line:rgba(23,34,28,.13);--paper:#fbfcf9}
    *{box-sizing:border-box}html,body{min-height:100%;margin:0;-webkit-text-size-adjust:100%;text-size-adjust:100%}
    body{font-family:"Microsoft YaHei UI","PingFang SC",system-ui,sans-serif;color:var(--ink);background:#e8eee9}
    main{display:grid;min-height:100vh;min-height:100dvh;place-items:center;padding:20px;background:linear-gradient(145deg,#edf2ee,#e5ece7)}
    .card{width:min(420px,100%);padding:30px 28px 27px;border:1px solid var(--line);border-top:3px solid var(--green);border-radius:19px;background:var(--paper);box-shadow:0 22px 58px rgba(24,42,33,.16)}
    .eyebrow{margin:0;color:var(--green);font-size:12px;font-weight:720;letter-spacing:.06em}
    h1{margin:8px 0 8px;font-size:clamp(25px,7vw,32px);line-height:1.24;letter-spacing:-.03em}
    p{margin:0;color:var(--muted);font-size:13px;line-height:1.7}
    .facts{display:grid;grid-template-columns:repeat(3,1fr);margin:20px 0;padding:12px 0;border-block:1px solid var(--line);font-size:12px;color:var(--muted)}
    .facts span{text-align:center}.facts span+span{border-left:1px solid var(--line)}
    label{display:block;margin-bottom:7px;color:var(--muted);font-size:12px}.row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}
    input{width:100%;min-width:0;border:1px solid var(--line);border-radius:12px;padding:13px 14px;color:var(--ink);background:white;font-size:16px;letter-spacing:.26em;outline:none}
    input:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(29,107,80,.14)}
    button{min-height:48px;border:0;border-radius:12px;padding:12px 18px;color:white;background:var(--green);font-size:13px;font-weight:680;cursor:pointer}button:disabled{opacity:.65;cursor:wait}
    .status{min-height:20px;margin-top:8px;color:#a44637;font-size:12px}.note{font-size:12px}
    @media(max-width:450px){main{padding:16px}.card{padding:26px 19px 23px;border-radius:17px}.row{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <main>
    <section class="card">
      <p class="eyebrow">2026年8月8日至13日</p>
      <h1>青甘六日自驾地图</h1>
      <p>包含道路路线、停留时间、加油和行车提醒。</p>
      <div class="facts"><span>2,589公里</span><span>6天行程</span><span>西宁站取还</span></div>
      <form id="unlock-form">
        <label for="password">访问密码</label>
        <div class="row">
          <input id="password" type="password" inputmode="numeric" autocomplete="current-password" maxlength="4" placeholder="输入4位密码" autofocus>
          <button id="unlock" type="submit">进入地图</button>
        </div>
        <div class="status" id="status" role="status"></div>
        <p class="note">密码只在本机浏览器中用于解密，不会上传。</p>
      </form>
    </section>
  </main>
  <script>
    const payload=${JSON.stringify(payload)};
    const fromBase64=value=>Uint8Array.from(atob(value),character=>character.charCodeAt(0));
    const input=document.getElementById('password');
    input.addEventListener('input',event=>{event.target.value=event.target.value.replace(/\\D/g,'').slice(0,4);document.getElementById('status').textContent='';});
    document.getElementById('unlock-form').addEventListener('submit',async event=>{
      event.preventDefault();
      const password=input.value;
      const button=document.getElementById('unlock');
      const status=document.getElementById('status');
      if(password.length!==4){status.textContent='请输入4位密码';return;}
      button.disabled=true;button.textContent='正在解密';status.textContent='';
      try{
        const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
        const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:fromBase64(payload.salt),iterations:310000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
        const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromBase64(payload.iv)},key,fromBase64(payload.data));
        const html=new TextDecoder().decode(clear);
        document.open();document.write(html);document.close();
      }catch(error){status.textContent='密码不正确，请重试';button.disabled=false;button.textContent='进入地图';}
    });
  </script>
</body>
</html>`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, page, "utf8");
console.log(`已生成 ${outputPath}`);
