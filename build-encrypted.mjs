import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const [sourceArgument, outputArgument = "index.html"] = process.argv.slice(2);
const password = process.env.MAP_PASSWORD;

if (!sourceArgument || !password) {
  console.error(
    "Usage: set MAP_PASSWORD, then run node build-encrypted.mjs <source.html> [output.html]",
  );
  process.exit(1);
}

const sourcePath = path.resolve(sourceArgument);
const outputPath = path.resolve(outputArgument);
let sourceHtml = fs.readFileSync(sourcePath, "utf8");

sourceHtml = sourceHtml
  .replace("</title>", "</title>\n  <link rel=\"icon\" href=\"data:,\">")
  .replace(
    "https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css",
    "./vendor/maplibre-gl.css",
  )
  .replace(
    "https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js",
    "./vendor/maplibre-gl.js",
  )
  .replace(
    "const styleUrls = { light: 'https://tiles.openfreemap.org/styles/liberty', dark: 'https://tiles.openfreemap.org/styles/dark' };",
    `const styleUrls = { light: 'https://tiles.openfreemap.org/styles/liberty', dark: 'https://tiles.openfreemap.org/styles/dark' };
    let fallbackActivated = false;
    function fallbackStyle(mode) {
      return { version:8, sources:{}, layers:[{ id:'offline-background', type:'background', paint:{ 'background-color': mode === 'dark' ? '#17201c' : '#e5ece6' } }] };
    }`,
  )
  .replace(
    "if (!map.getLayer('point-label')) map.addLayer",
    "if (!fallbackActivated && !map.getLayer('point-label')) map.addLayer",
  )
  .replace(
    "map.on('load', function(){\n      mapReady=true; addLayers(); fitAll();",
    "map.on('load', function(){\n      mapReady=true; clearTimeout(mapFallbackTimer); addLayers(); fitAll();",
  )
  .replace(
    "map.on('error', function(e){ if(e && e.error) console.warn('Map resource:', e.error.message); });",
    `const mapFallbackTimer = setTimeout(function(){
      if (!mapReady) {
        fallbackActivated = true;
        map.setStyle(fallbackStyle(theme));
      }
    }, 6500);
    map.on('error', function(e){ if(e && e.error) console.warn('Map resource:', e.error.message); });`,
  )
  .replace(
    "map.setStyle(styleUrls[theme]);",
    "map.setStyle(fallbackActivated ? fallbackStyle(theme) : styleUrls[theme]);",
  )
  .replace("'Noto Sans CJK SC Regular'", "'Noto Sans Regular'")
  .replace("2026 · 8月8日至14日 · 7天6晚", "2026年8月8日至14日 · 7天6晚");

const mobileEnhancementStyles = String.raw`
    .sheet-toggle { display: none; }

    @media (max-width: 900px) {
      :root {
        --mobile-edge: max(8px, env(safe-area-inset-left));
        --sheet-expanded: calc(100dvh - max(8px, env(safe-area-inset-top)) - 104px);
        --sheet-default: clamp(270px, 42dvh, 360px);
        --sheet-visible: var(--sheet-default);
      }
      body[data-sheet-state="collapsed"] { --sheet-visible: 88px; }
      body[data-sheet-state="expanded"] { --sheet-visible: var(--sheet-expanded); }
      html, body { height: 100dvh; min-height: 100dvh; overscroll-behavior: none; }
      body { position: fixed; inset: 0; width: 100%; touch-action: manipulation; }
      main { position: fixed; inset: 0; width: 100%; height: 100dvh; overflow: clip; }
      #map { height: 100dvh; }
      .masthead {
        top: max(8px, env(safe-area-inset-top)); left: 8px; right: 8px; width: auto;
        padding: 10px 12px 9px; border-radius: 16px;
      }
      .eyebrow { gap: 0; font-size: 10.5px; letter-spacing: .035em; }
      .eyebrow-dot { display: none; }
      .masthead h1 { margin: 5px 0 0; font-size: 16px; line-height: 1.25; letter-spacing: -.015em; }
      .masthead p, .route-alert { display: none; }
      .metric-row { margin-top: 7px; padding-top: 6px; flex-wrap: nowrap; }
      .metric { min-width: 0; margin-right: 10px; padding-right: 10px; }
      .metric strong { font-size: 13px; line-height: 1.2; }
      .metric span { display: none; }

      .panel {
        top: auto; left: 8px; right: 8px; bottom: max(8px, env(safe-area-inset-bottom)); width: auto;
        height: var(--sheet-expanded); border-radius: 16px;
        transform: translateY(calc(var(--sheet-expanded) - var(--sheet-visible)));
        transition: transform .28s cubic-bezier(.22, 1, .36, 1);
        will-change: transform;
      }
      .panel::before {
        content: ''; position: absolute; z-index: 3; top: 6px; left: 50%; width: 32px; height: 4px;
        border-radius: 999px; background: color-mix(in srgb, var(--muted) 42%, transparent);
        transform: translateX(-50%); pointer-events: none;
      }
      .panel-head {
        display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 8px;
        min-height: 76px; align-items: flex-start; padding: 16px 12px 10px;
      }
      .panel-head > div:first-child { min-width: 0; }
      .panel-kicker { font-size: 10px; }
      .panel-title { margin-top: 3px; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .panel-subtitle { margin-top: 3px; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sheet-toggle {
        display: inline-grid; flex: 0 0 auto; min-width: 58px; min-height: 44px; place-items: center;
        border: 1px solid var(--line); border-radius: 12px; padding: 0 10px;
        color: var(--accent); background: var(--accent-soft); font-size: 11px; font-weight: 650; cursor: pointer;
      }
      .icon-button[hidden] { display: none !important; }
      .sheet-toggle:active, .icon-button:active, .map-tool:active, .day-button:active, .tab:active, .action:active { transform: scale(.98); }
      .icon-button { width: 44px; height: 44px; border-radius: 12px; }
      .tabs { margin: 7px 10px 0; padding: 3px; }
      .tab { min-height: 44px; padding: 8px 6px; }
      .panel-body { padding: 10px 12px 22px; }
      .panel-foot { padding: 8px 10px max(8px, env(safe-area-inset-bottom)); }
      .panel-foot .action { min-height: 44px; }
      .foot-note { display: none; }
      body[data-sheet-state="collapsed"] .panel-subtitle,
      body[data-sheet-state="collapsed"] .tabs,
      body[data-sheet-state="collapsed"] .panel-body,
      body[data-sheet-state="collapsed"] .panel-foot { visibility: hidden; opacity: 0; pointer-events: none; }
      body[data-sheet-state="collapsed"] .panel-head { min-height: 88px; align-items: center; border-bottom-color: transparent; }

      .daybar {
        left: 8px; right: 8px; bottom: calc(max(8px, env(safe-area-inset-bottom)) + var(--sheet-visible) + 8px);
        max-width: none; padding: 4px; border-radius: 14px; scroll-snap-type: x proximity;
        overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch;
        transition: bottom .28s cubic-bezier(.22, 1, .36, 1), opacity .18s ease, transform .18s ease;
        mask-image: linear-gradient(90deg, transparent 0, #000 12px, #000 calc(100% - 24px), transparent 100%);
        -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 12px, #000 calc(100% - 24px), transparent 100%);
      }
      .daybar::after { content: ''; flex: 0 0 calc(50% - 42px); height: 1px; }
      .day-button { min-height: 44px; padding: 9px 12px; scroll-snap-align: center; }
      .day-button[aria-pressed="true"] { box-shadow: 0 3px 10px color-mix(in srgb, var(--accent) 24%, transparent); }
      body[data-sheet-state="expanded"] .daybar { opacity: 0; transform: translateY(8px); pointer-events: none; }
      .map-tools { top: calc(max(8px, env(safe-area-inset-top)) + 98px); left: auto; right: 8px; gap: 6px; }
      .map-tool { width: 44px; height: 44px; border-radius: 12px; }
      .map-key, .maplibregl-ctrl-bottom-right { display: none; }
      .overview-item { min-height: 66px; }
      .action { min-height: 44px; }
    }

    @media (max-width: 520px) {
      .metric:nth-child(3) { display: block; }
      .panel-foot .action { padding: 8px 10px; }
      .panel-foot .action span { display: inline; }
      .day-summary { gap: 6px; }
    }

    @media (max-width: 370px) {
      .metric:nth-child(3) { display: none; }
      .metric:nth-child(2) { margin-right: 0; padding-right: 0; border-right: 0; }
      .sheet-toggle { min-width: 52px; padding-inline: 8px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .panel, .daybar { transition: none !important; }
    }
`;

sourceHtml = sourceHtml
  .replace("</style>", `${mobileEnhancementStyles}\n  </style>`)
  .replace(
    '        <button class="icon-button" id="close-detail"',
    '        <button class="sheet-toggle" id="sheet-toggle" type="button" aria-label="展开完整详情" aria-controls="panel-body"><span id="sheet-toggle-label">展开</span></button>\n        <button class="icon-button" id="close-detail"',
  )
  .replace(
    "function fitAll(){ map.fitBounds(allBounds,{ padding:{ top:150,right:430,bottom:80,left:70 }, duration:700, maxZoom:5.4 }); }\n    function fitDay(day){\n      const b=new maplibregl.LngLatBounds(); day.geometry.forEach(function(c){ b.extend(c); });\n      map.fitBounds(b,{ padding:{ top:125,right:430,bottom:80,left:70 }, duration:700, maxZoom:8.3 });\n    }",
    `function mapPadding(){
      if(!window.matchMedia('(max-width: 900px)').matches) return { top:150,right:430,bottom:80,left:70 };
      const state=document.body.dataset.sheetState || 'default';
      const defaultHeight=Math.min(360,Math.max(270,window.innerHeight*.42));
      const visibleHeight=state==='collapsed' ? 88 : state==='expanded' ? window.innerHeight-104 : defaultHeight;
      return { top:112,right:28,bottom:Math.max(128,visibleHeight+64),left:28 };
    }
    function fitAll(){ map.fitBounds(allBounds,{ padding:mapPadding(), duration:700, maxZoom:5.4 }); }
    function fitDay(day){
      const b=new maplibregl.LngLatBounds(); day.geometry.forEach(function(c){ b.extend(c); });
      map.fitBounds(b,{ padding:mapPadding(), duration:700, maxZoom:8.3 });
    }`,
  )
  .replace(
    "selectedDay=id; selectedTab='route';",
    "selectedDay=id; selectedTab='route'; ensureSheetVisible();",
  )
  .replace(
    "      updateOpacity(); renderPanel();\n      if(!skipFit)",
    `      updateOpacity(); renderPanel();
      const activeDayButton=document.querySelector('.day-button[data-day="'+id+'"]');
      if(activeDayButton){
        const target=id==='all' ? 0 : activeDayButton.offsetLeft-(daybar.clientWidth-activeDayButton.offsetWidth)/2;
        daybar.scrollTo({ left:Math.max(0,target), behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth' });
      }
      const pageRoot=document.querySelector('main');
      document.body.scrollTop=0; document.documentElement.scrollTop=0; pageRoot.scrollTop=0;
      window.requestAnimationFrame(function(){ document.body.scrollTop=0; document.documentElement.scrollTop=0; pageRoot.scrollTop=0; });
      if(!skipFit)`,
  )
  .replace(
    "    function renderPrint(){",
    `    const sheetToggle=document.getElementById('sheet-toggle');
    const sheetToggleLabel=document.getElementById('sheet-toggle-label');
    const sheetFlow={ collapsed:{next:'default',label:'详情',aria:'显示行程详情'}, default:{next:'expanded',label:'展开',aria:'展开完整详情'}, expanded:{next:'collapsed',label:'地图',aria:'收起详情只看地图'} };
    function setSheetState(state){
      if(!sheetFlow[state]) state='default';
      document.body.dataset.sheetState=state;
      sheetToggle.dataset.state=state;
      sheetToggleLabel.textContent=sheetFlow[state].label;
      sheetToggle.setAttribute('aria-label',sheetFlow[state].aria);
      sheetToggle.setAttribute('aria-expanded',String(state!=='collapsed'));
      window.setTimeout(function(){ if(mapReady) map.resize(); },300);
    }
    function ensureSheetVisible(){
      if(window.matchMedia('(max-width: 900px)').matches && document.body.dataset.sheetState==='collapsed') setSheetState('default');
    }
    sheetToggle.addEventListener('click',function(){ const current=document.body.dataset.sheetState || 'default'; setSheetState(sheetFlow[current].next); });
    setSheetState('default');

    function renderPrint(){`,
  );

const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(password, salt, 310_000, 32, "sha256");
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const ciphertext = Buffer.concat([
  cipher.update(Buffer.from(sourceHtml, "utf8")),
  cipher.final(),
  cipher.getAuthTag(),
]);

const payload = {
  salt: salt.toString("base64"),
  iv: iv.toString("base64"),
  data: ciphertext.toString("base64"),
};

const page = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#e8eee9">
  <title>青甘大环线 2026 · 访问验证</title>
  <link rel="icon" href="data:,">
  <style>
    :root{color-scheme:light;--ink:#17231d;--muted:#68736c;--green:#1f6a52;--line:rgba(23,35,29,.13)}
    *{box-sizing:border-box}html,body{min-height:100%;margin:0}body{font-family:"Microsoft YaHei UI","PingFang SC",system-ui,sans-serif;color:var(--ink);background:#e8eee9}
    main{position:relative;display:grid;min-height:100vh;min-height:100dvh;place-items:center;overflow:hidden;padding:20px;background:radial-gradient(circle at 12% 16%,rgba(48,132,94,.18),transparent 31%),radial-gradient(circle at 88% 82%,rgba(202,124,46,.14),transparent 29%),linear-gradient(150deg,#eef4ef,#e5ece7 52%,#f1ece4)}
    main:before,main:after{content:"";position:absolute;width:72vw;height:210px;border:2px solid rgba(31,106,82,.14);border-radius:50%;transform:rotate(-12deg)}main:before{left:-22vw;top:18%}main:after{right:-25vw;bottom:10%;transform:rotate(14deg)}
    .card{position:relative;z-index:1;width:min(430px,100%);padding:30px;border:1px solid var(--line);border-radius:24px;background:rgba(251,253,250,.94);box-shadow:0 24px 72px rgba(25,47,36,.18);backdrop-filter:blur(20px)}
    .pin{position:absolute;right:27px;top:26px;width:38px;height:38px;border:1px solid rgba(31,106,82,.18);border-radius:50% 50% 50% 12px;background:#dcebe4;transform:rotate(45deg)}.pin:after{content:"";position:absolute;inset:11px;border:3px solid var(--green);border-radius:50%}
    .eyebrow{display:flex;align-items:center;gap:9px;margin:0;color:var(--green);font-size:12px;font-weight:700;letter-spacing:.08em}.eyebrow:before{content:"";width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 0 5px rgba(31,106,82,.12)}
    h1{margin:19px 0 9px;font-size:clamp(25px,7vw,33px);line-height:1.24;letter-spacing:-.035em}p{margin:0;color:var(--muted);font-size:14px;line-height:1.7}
    .facts{display:flex;flex-wrap:wrap;gap:8px 14px;margin:20px 0;padding:15px 0;border-block:1px solid var(--line);color:var(--muted);font-size:12px}
    label{display:block;margin-bottom:8px;color:var(--muted);font-size:12px}.row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px}
    input{width:100%;min-width:0;border:1px solid var(--line);border-radius:12px;padding:13px 14px;color:var(--ink);background:white;letter-spacing:.28em;outline:none}input:focus{border-color:var(--green);box-shadow:0 0 0 3px rgba(31,106,82,.14)}
    button{border:0;border-radius:12px;padding:13px 18px;color:#f7fffb;background:var(--green);font-weight:650;cursor:pointer}button:disabled{opacity:.65;cursor:wait}
    .status{min-height:20px;margin-top:9px;color:#9b4d32;font-size:12px}.note{margin-top:9px;font-size:12px}
    @media(max-width:470px){.card{padding:25px 20px;border-radius:19px}.row{grid-template-columns:1fr}.row button{width:100%}}
    @media(max-width:350px){h1{font-size:23px}}
  </style>
</head>
<body>
  <main>
    <section class="card">
      <span class="pin" aria-hidden="true"></span>
      <p class="eyebrow">2026 · 8月8日至14日</p>
      <h1>青甘大环线七日路线图</h1>
      <p>路线、景区停留、住宿、加油和返程安排。</p>
      <div class="facts"><span>7天6晚</span><span>约3067公里</span><span>加密静态备份</span></div>
      <form id="unlock-form">
        <label for="password">访问密码</label>
        <div class="row">
          <input id="password" type="password" inputmode="numeric" autocomplete="current-password" maxlength="4" placeholder="请输入4位密码" autofocus>
          <button id="unlock" type="submit">进入地图</button>
        </div>
        <div class="status" id="status" role="status"></div>
        <p class="note">地图内容会在本机浏览器中解密，不会上传密码。</p>
      </form>
    </section>
  </main>
  <script>
    const payload=${JSON.stringify(payload)};
    const fromBase64=value=>Uint8Array.from(atob(value),character=>character.charCodeAt(0));
    document.getElementById('password').addEventListener('input',event=>{event.target.value=event.target.value.replace(/\\D/g,'').slice(0,4);document.getElementById('status').textContent='';});
    document.getElementById('unlock-form').addEventListener('submit',async event=>{
      event.preventDefault();
      const password=document.getElementById('password').value;
      const button=document.getElementById('unlock');
      const status=document.getElementById('status');
      if(password.length!==4){status.textContent='请输入4位密码';return;}
      button.disabled=true;button.textContent='解密中';status.textContent='';
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

fs.writeFileSync(outputPath, page, "utf8");
console.log(`Encrypted page written to ${outputPath}`);
