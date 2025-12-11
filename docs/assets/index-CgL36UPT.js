(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))o(t);new MutationObserver(t=>{for(const s of t)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&o(a)}).observe(document,{childList:!0,subtree:!0});function r(t){const s={};return t.integrity&&(s.integrity=t.integrity),t.referrerPolicy&&(s.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?s.credentials="include":t.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(t){if(t.ep)return;t.ep=!0;const s=r(t);fetch(t.href,s)}})();const f="https://vebhoeiltxspsurqoxvl.supabase.co",v="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYmhvZWlsdHhzcHN1cnFveHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAyMjI2MTIsImV4cCI6MjA0NTc5ODYxMn0.sV-Xf6wP_m46D_q-XN0oZfK9NogDqD9xV5sS-n6J8c4",k="https://api.dataviz.jp",d="https://auth.dataviz.jp",b="sb-dataviz-auth-token",y=60*60*24*365,h=(()=>{const i=window.location.hostname;return i==="localhost"||i==="127.0.0.1"||i.match(/^(\d{1,3}\.){3}\d{1,3}$/)?null:".dataviz.jp"})(),C={getItem:i=>{const e=document.cookie.split(";").map(t=>t.trim()).reduce((t,s)=>{const[a,...n]=s.split("=");return t[a]=n.join("="),t},{});let r=e[i];if(!r){const t=[];let s=0;for(;e[`${i}.${s}`];)t.push(e[`${i}.${s}`]),s++;t.length>0&&(r=t.join(""))}if(!r)return null;try{return JSON.parse(r)}catch{}const o=decodeURIComponent(r);try{return JSON.parse(o)}catch{}try{let t=o.trim();t.startsWith("base64-")&&(t=t.slice(7));const s=t.replace(/-/g,"+").replace(/_/g,"/"),a=atob(s);return JSON.parse(a)}catch(t){console.error("[AuthDebug] All parse attempts failed for cookie",t)}return null},setItem:(i,e)=>{let r;try{r=btoa(e)}catch{return}let o=`${i}=${r}; Max-Age=${y}; Path=/; SameSite=Lax; Secure`;h&&(o+=`; Domain=${h}`),document.cookie=o},removeItem:i=>{let e=`${i}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;h&&(e+=`; Domain=${h}`),document.cookie=e}},u=window.supabase?window.supabase.createClient(f,v,{auth:{storage:C,storageKey:b,persistSession:!0,autoRefreshToken:!0,detectSessionInUrl:!0}}):null;class w{constructor(){this.host=document.createElement("div"),this.host.id="dataviz-global-header-host",this.shadow=this.host.attachShadow({mode:"open"}),this.state={isLoading:!0,user:null}}mount(){const e=document.getElementById("dataviz-global-header-host");e&&e.remove(),document.body.prepend(this.host),this.render()}update(e){this.state={...this.state,...e},this.render()}getStyles(){return`
      :host {
        all: initial; /* 親スタイルの影響をリセット */
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        z-index: 99999;
        position: relative;
      }
      .dv-header {
        background-color: #111;
        color: #ddd;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        font-size: 14px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      }
      .dv-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .dv-brand {
        font-weight: 700;
        color: #fff;
        text-decoration: none;
        letter-spacing: 0.5px;
      }
      .dv-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .dv-user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #aaa;
      }
      .dv-user-email {
        white-space: nowrap;
        color: inherit;
        text-decoration: none;
        cursor: pointer;
      }
      .dv-user-email:hover {
        color: #fff;
        text-decoration: underline;
      }
      .dv-btn {
        background: transparent;
        border: 1px solid #444;
        color: #eee;
        padding: 4px 10px;
        border-radius: 4px;
        text-decoration: none;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s;
      }
      .dv-btn:hover {
        background: #333;
        border-color: #666;
        color: #fff;
      }
      .dv-btn-primary {
        background: #eee;
        color: #111;
        border-color: #eee;
        font-weight: 600;
      }
      .dv-btn-primary:hover {
        background: #fff;
        color: #000;
      }
      .dv-loading {
        opacity: 0.5;
        font-size: 12px;
      }
      /* Mobile Optimizations */
      @media (max-width: 600px) {
        .dv-user-email { display: none; }
      }
    `}render(){const{isLoading:e,user:r}=this.state,o=`${d}/account`,t=`${d}/auth/sign-up?redirect_to=${encodeURIComponent(window.location.href)}`;let s="";if(e)s='<span class="dv-loading">Loading...</span>';else if(r){const n=r.email||"User";s=`
        <div class="dv-user-info">
          <a href="${o}" class="dv-user-email" title="${n}">${n}</a>
        </div>
        <button class="dv-btn" id="dv-logout-btn">Log out</button>
      `}else s=`
        <span style="font-size:12px; color:#888;">Not logged in</span>
        <a href="${t}" class="dv-btn dv-btn-primary">Log in</a>
      `;this.shadow.innerHTML=`
      <style>${this.getStyles()}</style>
      <div class="dv-header">
        <div class="dv-left">
          <a href="${d}" class="dv-brand">dataviz.jp</a>
        </div>
        <div class="dv-right">
          ${s}
        </div>
      </div>
    `;const a=this.shadow.getElementById("dv-logout-btn");a&&a.addEventListener("click",async()=>{confirm("ログアウトしますか？")&&(await u.auth.signOut(),window.location.reload())})}}function T(){return new URLSearchParams(window.location.search).has("auth_debug")}function p(i,e){if(T()){console.warn(`[dataviz-auth-client] Redirect suppressed. Reason: ${e} -> ${i}`);return}window.location.href=i}async function x(i){if(!i){const e=encodeURIComponent(window.location.href),r=`${d}/auth/sign-up?redirect_to=${e}`;return p(r,"Unauthenticated"),null}try{const e=await fetch(`${k}/api/me`,{method:"GET",headers:{Authorization:`Bearer ${i.access_token}`},credentials:"include"});if(!e.ok)throw new Error(`Status ${e.status}`);const r=await e.json(),o=r.subscription||{},t=o.status||"none",s=o.cancel_at_period_end;return t==="active"||t==="trialing"||s?{...r,email:i.user.email}:(p(d,`Inactive Subscription (${t})`),null)}catch(e){return console.error("[dataviz-auth-client] Profile check failed",e),p(d,"Profile Error"),null}}async function S(){if(!u){console.error("[dataviz-auth-client] Supabase client missing.");return}const i=new w;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>i.mount()):i.mount();let e=!1;const r=async t=>{const s=new URLSearchParams(window.location.hash.substring(1));if((new URLSearchParams(window.location.search).has("code")||s.has("access_token"))&&window.history.replaceState({},document.title,window.location.pathname),!t){i.update({isLoading:!1,user:null}),await x(null);return}const n=await x(t);n&&i.update({isLoading:!1,user:n})};u.auth.onAuthStateChange(async(t,s)=>{if(t==="INITIAL_SESSION"){if(e)return;e=!0,await r(s)}else t==="SIGNED_IN"||t==="TOKEN_REFRESHED"?await r(s):t==="SIGNED_OUT"&&await r(null)});const{data:o}=await u.auth.getSession();e||(e=!0,await r(o.session))}S();window.supabase=u;class ${constructor(){this.currentTexture="lines",this.currentFgColor="#1f2937",this.currentBgColor="#ffffff",this.currentSample="bar-chart",this.textureDensity=1,this.textureThickness=1,this.initElements(),this.attachEventListeners(),this.render()}initElements(){this.elements={textureSelect:document.getElementById("texture-select"),fgColor:document.getElementById("fg-color"),bgColor:document.getElementById("bg-color"),fgColorValue:document.getElementById("fg-color-value"),bgColorValue:document.getElementById("bg-color-value"),textureDensity:document.getElementById("texture-density"),densityValue:document.getElementById("density-value"),textureThickness:document.getElementById("texture-thickness"),thicknessValue:document.getElementById("thickness-value"),svgSelect:document.getElementById("svg-select"),applyBtn:document.getElementById("apply-btn"),svgContainer:document.getElementById("svg-container"),codeDisplay:document.getElementById("code-display"),copyCodeBtn:document.getElementById("copy-code-btn"),copyFeedback:document.getElementById("copy-feedback")}}attachEventListeners(){this.elements.textureSelect.addEventListener("change",e=>{this.currentTexture=e.target.value}),this.elements.fgColor.addEventListener("input",e=>{this.currentFgColor=e.target.value,this.elements.fgColorValue.textContent=e.target.value.toUpperCase()}),this.elements.bgColor.addEventListener("input",e=>{this.currentBgColor=e.target.value,this.elements.bgColorValue.textContent=e.target.value.toUpperCase()}),this.elements.textureDensity.addEventListener("input",e=>{this.textureDensity=parseFloat(e.target.value),this.elements.densityValue.textContent=`(${this.textureDensity.toFixed(1)})`}),this.elements.textureThickness.addEventListener("input",e=>{this.textureThickness=parseFloat(e.target.value),this.elements.thicknessValue.textContent=`(${this.textureThickness.toFixed(1)})`}),this.elements.svgSelect.addEventListener("change",e=>{this.currentSample=e.target.value}),this.elements.applyBtn.addEventListener("click",()=>{this.render(),this.updateCode()}),this.elements.copyCodeBtn.addEventListener("click",()=>{this.copyCodeToClipboard()})}createBarChart(){const e=[{label:"Q1",value:65},{label:"Q2",value:78},{label:"Q3",value:45},{label:"Q4",value:88}],r=d3.select(this.elements.svgContainer).selectAll("svg").data([null]).join("svg").attr("width",600).attr("height",400);r.selectAll("*").remove();const o={top:20,right:20,bottom:30,left:60},t=600-o.left-o.right,s=400-o.top-o.bottom,a=r.append("g").attr("transform",`translate(${o.left},${o.top})`),n=d3.scaleBand().domain(e.map(c=>c.label)).range([0,t]).padding(.1),l=d3.scaleLinear().domain([0,100]).range([s,0]);a.selectAll(".bar").data(e).join("rect").attr("class","bar").attr("x",c=>n(c.label)).attr("y",c=>l(c.value)).attr("width",n.bandwidth()).attr("height",c=>s-l(c.value)).attr("fill",this.currentBgColor).attr("stroke",this.currentFgColor).attr("stroke-width",2),a.append("g").attr("transform",`translate(0,${s})`).call(d3.axisBottom(n)).attr("color",this.currentFgColor),a.append("g").call(d3.axisLeft(l)).attr("color",this.currentFgColor),this.applyTextureToElements(r)}createPieChart(){const e=[{label:"A",value:30},{label:"B",value:25},{label:"C",value:20},{label:"D",value:25}],r=d3.select(this.elements.svgContainer).selectAll("svg").data([null]).join("svg").attr("width",500).attr("height",500);r.selectAll("*").remove();const o=150,t=r.append("g").attr("transform","translate(250,250)"),s=d3.pie().value(n=>n.value),a=d3.arc().innerRadius(0).outerRadius(o);t.selectAll(".arc").data(s(e)).join("g").attr("class","arc").append("path").attr("d",a).attr("fill",this.currentBgColor).attr("stroke",this.currentFgColor).attr("stroke-width",2),this.applyTextureToElements(r)}createNetwork(){const e=[{id:0,label:"Node 1"},{id:1,label:"Node 2"},{id:2,label:"Node 3"},{id:3,label:"Node 4"},{id:4,label:"Node 5"}],r=[{source:0,target:1},{source:0,target:2},{source:1,target:3},{source:2,target:3},{source:3,target:4}],o=d3.select(this.elements.svgContainer).selectAll("svg").data([null]).join("svg").attr("width",600).attr("height",500);o.selectAll("*").remove();const t=d3.forceSimulation(e).force("link",d3.forceLink(r).id(n=>n.id).distance(100)).force("charge",d3.forceManyBody().strength(-300)).force("center",d3.forceCenter(300,250)),s=o.selectAll("line").data(r).join("line").attr("stroke",this.currentFgColor).attr("stroke-width",2),a=o.selectAll("circle").data(e).join("circle").attr("r",20).attr("fill",this.currentBgColor).attr("stroke",this.currentFgColor).attr("stroke-width",2);t.on("tick",()=>{s.attr("x1",n=>n.source.x).attr("y1",n=>n.source.y).attr("x2",n=>n.target.x).attr("y2",n=>n.target.y),a.attr("cx",n=>n.x).attr("cy",n=>n.y)}),this.applyTextureToElements(o)}createGrid(){const e=d3.select(this.elements.svgContainer).selectAll("svg").data([null]).join("svg").attr("width",600).attr("height",400);e.selectAll("*").remove();const r=4,o=5,t=600/o,s=400/r;e.selectAll("rect.grid-cell").data(d3.range(r*o)).join("rect").attr("class","grid-cell").attr("x",a=>a%o*t).attr("y",a=>Math.floor(a/o)*s).attr("width",t).attr("height",s).attr("fill",this.currentBgColor).attr("stroke",this.currentFgColor).attr("stroke-width",2),this.applyTextureToElements(e)}applyTextureToElements(e){if(this.currentTexture==="noop")return;let r;try{switch(this.currentTexture){case"lines":r=textures.lines().stroke(this.currentFgColor).background(this.currentBgColor).size(8*this.textureDensity).strokeWidth(1.5*this.textureThickness);break;case"diagonal-stripe":r=textures.lines().orientation("diagonal").stroke(this.currentFgColor).background(this.currentBgColor).size(8*this.textureDensity).strokeWidth(1.5*this.textureThickness);break;case"horizontal-stripe":r=textures.lines().orientation("horizontal").stroke(this.currentFgColor).background(this.currentBgColor).size(8*this.textureDensity).strokeWidth(1.5*this.textureThickness);break;case"vertical-stripe":r=textures.lines().orientation("vertical").stroke(this.currentFgColor).background(this.currentBgColor).size(8*this.textureDensity).strokeWidth(1.5*this.textureThickness);break;case"circles":r=textures.circles().stroke(this.currentFgColor).background(this.currentBgColor).size(12*this.textureDensity).radius(2*this.textureThickness).strokeWidth(1*this.textureThickness);break;case"dots":r=textures.circles().stroke(this.currentFgColor).background(this.currentBgColor).size(10*this.textureDensity).radius(1.5*this.textureThickness).strokeWidth(.5*this.textureThickness).complement();break;case"cross-hatch":r=textures.paths().d("crosses").stroke(this.currentFgColor).background(this.currentBgColor).size(8*this.textureDensity).strokeWidth(1*this.textureThickness);break;case"squares":r=textures.paths().d("squares").stroke(this.currentFgColor).fill(this.currentBgColor).background(this.currentBgColor).size(10*this.textureDensity).strokeWidth(1*this.textureThickness);break;case"hexagons":r=textures.paths().d("hexagons").stroke(this.currentFgColor).background(this.currentBgColor).size(12*this.textureDensity).strokeWidth(1.5*this.textureThickness);break;case"woven":r=textures.paths().d("woven").stroke(this.currentFgColor).background(this.currentBgColor).size(10*this.textureDensity).strokeWidth(1*this.textureThickness);break;case"waves":r=textures.paths().d("waves").stroke(this.currentFgColor).background(this.currentBgColor).size(12*this.textureDensity).strokeWidth(1.5*this.textureThickness);break;case"caps":r=textures.paths().d("caps").stroke(this.currentFgColor).background(this.currentBgColor).size(10*this.textureDensity).strokeWidth(1*this.textureThickness);break;case"nylon":r=textures.paths().d("nylon").stroke(this.currentFgColor).background(this.currentBgColor).size(12*this.textureDensity).strokeWidth(1.5*this.textureThickness);break;default:return}e.call(r),e.selectAll('rect.bar, rect.grid-cell, circle, path:not([role="link"])').style("fill",r.url())}catch(o){console.warn("Texture application note:",this.currentTexture,o.message)}}adjustColor(e,r){const o=parseInt(e.replace("#",""),16),t=Math.round(2.55*r),s=Math.max(0,Math.min(255,(o>>16)+t)),a=Math.max(0,Math.min(255,(o>>8&255)+t)),n=Math.max(0,Math.min(255,(o&255)+t));return"#"+(16777216+s*65536+a*256+n).toString(16).slice(1)}render(){const e=this.elements.svgContainer;switch(e.innerHTML="",this.currentSample){case"bar-chart":this.createBarChart();break;case"pie-chart":this.createPieChart();break;case"network":this.createNetwork();break;case"grid":this.createGrid();break;default:this.createBarChart()}this.updateCode()}generateCodeSnippet(){const e=this.textureDensity,r=this.textureThickness,o=this.currentFgColor,t=this.currentBgColor;let s="";if(this.currentTexture==="noop")s="// テクスチャなし";else if(["lines","diagonal-stripe","horizontal-stripe","vertical-stripe"].includes(this.currentTexture)){let n="diagonal";this.currentTexture==="horizontal-stripe"&&(n="horizontal"),this.currentTexture==="vertical-stripe"&&(n="vertical"),s=`const tx = textures.lines()
    .stroke('${o}')
    .background('${t}')
    .size(${8*e})
    .strokeWidth(${1.5*r});`,this.currentTexture!=="lines"&&(s=`const tx = textures.lines()
    .orientation('${n}')
    .stroke('${o}')
    .background('${t}')
    .size(${8*e})
    .strokeWidth(${1.5*r});`)}else if(this.currentTexture==="circles")s=`const tx = textures.circles()
    .stroke('${o}')
    .background('${t}')
    .size(${12*e})
    .radius(${2*r})
    .strokeWidth(${1*r});`;else if(this.currentTexture==="dots")s=`const tx = textures.circles()
    .stroke('${o}')
    .background('${t}')
    .size(${10*e})
    .radius(${1.5*r})
    .strokeWidth(${.5*r})
    .complement();`;else if(["cross-hatch","squares","hexagons","woven","waves","caps","nylon"].includes(this.currentTexture)){const l={"cross-hatch":"crosses",squares:"squares",hexagons:"hexagons",woven:"woven",waves:"waves",caps:"caps",nylon:"nylon"}[this.currentTexture],c={"cross-hatch":8,squares:10,hexagons:12,woven:10,waves:12,caps:10,nylon:12}[this.currentTexture],m={"cross-hatch":1,squares:1,hexagons:1.5,woven:1,waves:1.5,caps:1,nylon:1.5}[this.currentTexture];this.currentTexture==="squares"?s=`const tx = textures.paths()
    .d('${l}')
    .stroke('${o}')
    .fill('${t}')
    .background('${t}')
    .size(${c*e})
    .strokeWidth(${m*r});`:s=`const tx = textures.paths()
    .d('${l}')
    .stroke('${o}')
    .background('${t}')
    .size(${c*e})
    .strokeWidth(${m*r});`}return`// SVG Texture Editor で生成されたコード
// Textures.js: https://riccardoscalco.it/textures/

// テクスチャの設定
${s}

// SVGに適用
svg.call(tx);

// 塗りつぶし要素にテクスチャを適用
svg.selectAll('rect, circle, path')
    .style('fill', tx.url());`}updateCode(){const e=this.generateCodeSnippet();this.elements.codeDisplay.textContent=e}copyCodeToClipboard(){const e=this.elements.codeDisplay.textContent;navigator.clipboard.writeText(e).then(()=>{this.elements.copyFeedback.classList.remove("hidden"),setTimeout(()=>{this.elements.copyFeedback.classList.add("hidden")},2e3)}).catch(r=>{console.error("コピーに失敗しました:",r)})}}function g(){if(typeof d3>"u"){console.warn("Waiting for D3.js to load..."),setTimeout(g,100);return}if(typeof textures>"u"){console.warn("Waiting for Textures.js to load..."),setTimeout(g,100);return}new $}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",g):g();
