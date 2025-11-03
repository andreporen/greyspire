// Versão: texto e assinatura corrompidos (matrix-like) + WebGL pulsando atrás da assinatura (60 BPM)
document.addEventListener("DOMContentLoaded", () => {
  const seloBtn = document.getElementById("seloBtn");
  const perg = document.getElementById("pergaminho");
  const carta = document.getElementById("carta");
  const conteudo = document.getElementById("conteudo");
  const assinatura = document.getElementById("assinatura");
  const audioEl = document.getElementById("ritualAudio");
  const fxCanvas = document.getElementById("fxCanvas");

  const BPM = 60; // pedido: 60 BPM
  const JUMBLE = "ᚠᚢᚦᚨᚱᚲᚹᚺᚾᛁ✦✶◇◆◈¤*#@&/%ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let activated = false;

  // ===== textura do pergaminho =====
  const bgSrc = perg.dataset.bg;
  if (bgSrc){
    const img = new Image();
    img.src = bgSrc;
    img.onload = () => { perg.style.backgroundImage = `url(${bgSrc})`; };
  }

  // ======= FUNÇÕES DE CORRUPÇÃO DO TEXTO =======
  // Envolve cada caractere dos nós de texto em <span class="corrupt">
  function wrapTextNodes(el){
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeValue.trim().length > 0) textNodes.push(node);
    }
    textNodes.forEach(node => {
      const frag = document.createDocumentFragment();
      const chars = node.nodeValue.split("");
      chars.forEach(ch => {
        const span = document.createElement("span");
        span.className = "corrupt";
        span.dataset.real = ch;
        span.textContent = (ch === " " ? " " : pick(JUMBLE));
        frag.appendChild(span);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  // Nunca estabiliza (modo D): sempre embaralhado, mas às vezes lampeja a letra real rapidamente
  function startCorruption(el, speed=70){
    const spans = Array.from(el.querySelectorAll(".corrupt"));
    setInterval(() => {
      for (const s of spans){
        const r = Math.random();
        if (s.dataset.real === " ") { s.textContent = " "; continue; }
        if (r < 0.08) {
          // lampejo da letra real por muito pouco tempo
          const real = s.dataset.real;
          s.textContent = real;
          setTimeout(()=>{ s.textContent = pick(JUMBLE); }, 90);
        } else {
          // corrupção constante
          s.textContent = pick(JUMBLE);
        }
      }
    }, speed); // 3 = rápido, então speed baixo (70ms)
  }

  // Assinatura: constrói conteúdo corrompido semelhante ao texto
  function buildSignature(){
    const name = assinatura.getAttribute("data-text") || "Arcanista-mor Amaris Solun";
    assinatura.innerHTML = "";
    for (const ch of name){
      const span = document.createElement("span");
      span.className = "corrupt"; // usa mesmo estilo do texto
      span.dataset.real = ch;
      span.textContent = (ch === " " ? " " : pick(JUMBLE));
      assinatura.appendChild(span);
    }
  }

  // Partículas ocasionais
  function spark(){
    const rect = assinatura.getBoundingClientRect();
    const s = document.createElement("span");
    s.className = "spark";
    s.style.left = (rect.left + rect.width * (0.2 + Math.random()*0.6)) + "px";
    s.style.top  = (rect.top  + rect.height * (0.2 + Math.random()*0.6) + window.scrollY) + "px";
    document.body.appendChild(s);
    setTimeout(()=> s.remove(), 1300);
  }

  const pick = s => s[Math.floor(Math.random()*s.length)];

  // ======= WEBGL: Fenda pulsando atrás da assinatura =======
  const fragShader = `
  precision highp float;
  uniform vec2 u_res;
  uniform float u_time;
  uniform vec2 u_center;   // 0..1 relativo ao canvas
  uniform float u_strength;// 0..1 intensidade
  uniform vec3 u_color;    // roxo
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    float a=hash(i), b=hash(i+vec2(1.0,0.0));
    float c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));
    vec2 u=f*f*(3.0-2.0*f);
    return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
  }
  float fbm(vec2 p){
    float v=0.0, a=0.5;
    for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; }
    return v;
  }
  void main(){
    vec2 uv = gl_FragCoord.xy / u_res.xy;
    vec2 d = uv - u_center;
    float r = length(d);

    float t = u_time*0.35;
    float field = fbm(uv*3.0 + vec2(t*0.6, -t*0.4));
    float angle = atan(d.y, d.x);
    float crack = smoothstep(0.0,0.02, abs(sin(angle*12.0 + t*2.0)) - 0.92);

    float vign = smoothstep(0.38, 0.0, r);           // focado perto da assinatura
    float energy = clamp(field*0.8 + crack*1.5,0.0,1.0)*vign;
    energy *= (0.4 + 0.6*u_strength);               // pulso BPM

    vec3 col = u_color * (0.28 + 0.72*energy);
    float alpha = smoothstep(0.0,0.25, energy) * 0.85;
    gl_FragColor = vec4(col, alpha);
  }`;

  let gl, program, u_res, u_time, u_center, u_strength, u_color;
  function initWebGL(){
    gl = fxCanvas.getContext("webgl", {premultipliedAlpha:false, alpha:true, antialias:true});
    if(!gl){ console.warn("WebGL indisponível."); return; }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const vsSource = `attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos,0.0,1.0);} `;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource); gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragShader); gl.compileShader(fs);

    if(!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(vs));
    if(!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(fs));

    program = gl.createProgram();
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(program));
    gl.useProgram(program);

    const quad = new Float32Array([ -1,-1, 1,-1, -1,1, 1,-1, 1,1, -1,1 ]);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    const a_pos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(a_pos); gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

    u_res = gl.getUniformLocation(program, "u_res");
    u_time = gl.getUniformLocation(program, "u_time");
    u_center = gl.getUniformLocation(program, "u_center");
    u_strength = gl.getUniformLocation(program, "u_strength");
    u_color = gl.getUniformLocation(program, "u_color");

    gl.uniform3f(u_color, 0.76, 0.0, 1.0); // roxo
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // aditivo
  }

  function resizeCanvas(){
    const rect = perg.getBoundingClientRect();
    fxCanvas.width  = Math.floor(rect.width  * devicePixelRatio);
    fxCanvas.height = Math.floor(rect.height * devicePixelRatio);
    fxCanvas.style.width  = rect.width + "px";
    fxCanvas.style.height = rect.height + "px";
    if(gl){
      gl.viewport(0,0,fxCanvas.width, fxCanvas.height);
      gl.useProgram(program);
      gl.uniform2f(u_res, fxCanvas.width, fxCanvas.height);
    }
  }

  function getSignatureCenter(){
    const rectP = perg.getBoundingClientRect();
    const rectA = assinatura.getBoundingClientRect();
    const cx = ((rectA.left + rectA.width/2) - rectP.left) / rectP.width;
    const cy = ((rectA.top + rectA.height/2) - rectP.top) / rectP.height;
    return {x:cx, y:1.0 - cy}; // flip Y para GL
  }

  // força em 60 BPM (1s por batida)
  function pulseStrength(t){
    // 2 picos leves por ciclo para dar sensação “biomecânica”
    const base = 0.5 + 0.5 * Math.sin(t * (2.0*Math.PI)); // 1 Hz
    const overtone = 0.25 * Math.sin(t * (4.0*Math.PI) + 1.2);
    return Math.max(0.0, Math.min(1.0, base + overtone*0.5));
  }

  let t0 = performance.now();
  function render(){
    if(!gl){ requestAnimationFrame(render); return; }
    const t = (performance.now() - t0)/1000;
    gl.useProgram(program);
    gl.uniform1f(u_time, t);
    const c = getSignatureCenter();
    gl.uniform2f(u_center, c.x, c.y);
    gl.uniform1f(u_strength, pulseStrength(t));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }

  // ===== Ativação =====
  perg.classList.remove("revealed");
  carta.setAttribute("aria-hidden","true");
  assinatura.setAttribute("aria-hidden","true");

  initWebGL();
  requestAnimationFrame(render);

  // Clique para abrir
  seloBtn.addEventListener("click", async () => {
    if (activated) return;
    activated = true;

    seloBtn.classList.add("hidden");
    perg.classList.add("revealed");
    carta.setAttribute("aria-hidden","false");

    // áudio
    try { await audioEl.play(); } catch(e){ console.warn("Autoplay bloqueado:", e); }

    // pergaminho respira
    perg.classList.add("pulse");

    // Texto: envolver e corromper (modo D: nunca estabiliza, rápido)
    wrapTextNodes(conteudo);
    startCorruption(conteudo, 70); // rápido (sua opção 3)

    // Assinatura dentro da carta
    buildSignature();
    assinatura.style.opacity = "1";
    assinatura.setAttribute("aria-hidden","false");
    startCorruption(assinatura, 60);

    // Partículas ocasionais
    setInterval(spark, 1100);
  });
});
