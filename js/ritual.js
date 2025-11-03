document.addEventListener("DOMContentLoaded", () => {
  const seloBtn = document.getElementById("seloBtn");
  const perg = document.getElementById("pergaminho");
  const carta = document.getElementById("carta");
  const assinatura = document.getElementById("assinatura");
  const audioEl = document.getElementById("ritualAudio");

  const NAME = "Arcanista-mor Amaris Solun";
  const JUMBLE = "ᚠᚢᚦᚨᚱᚲᚹᚺᚾᛁ✦✶◇◆◈¤*ABCDxyz123";
  const BPM = 66;
  let activated = false;
  let shuffleInterval = null;
  let pulseInterval = null;

  // carregar textura do pergaminho
  const bgSrc = perg.dataset.bg;
  if(bgSrc){
    const img = new Image();
    img.src = bgSrc;
    img.onload = () => { perg.style.backgroundImage = `url(${bgSrc})`; };
  }

  // construir assinatura como runes
  function buildSignature(){
    assinatura.innerHTML = "";
    const wrap = document.createElement("span");
    wrap.className = "runes";
    for (const ch of NAME){
      const s = document.createElement("span");
      s.className = "rune";
      s.dataset.real = ch;
      s.textContent = (ch === " ") ? "\u00A0" : JUMBLE[Math.floor(Math.random()*JUMBLE.length)];
      wrap.appendChild(s);
    }
    assinatura.appendChild(wrap);
  }

  // shuffle até formar o nome real
  function startShuffle(revealTime = 2200){
    const spans = Array.from(assinatura.querySelectorAll(".rune"));
    const total = spans.length;
    let t0 = performance.now();
    const duration = revealTime;
    shuffleInterval = setInterval(() => {
      const now = performance.now();
      const prog = Math.min(1, (now - t0) / duration);
      const revealCount = Math.floor(prog * total);
      for (let i=0;i<total;i++){
        const el = spans[i];
        if (el.dataset.real === " ") { el.textContent = "\u00A0"; continue; }
        if (i < revealCount) {
          el.textContent = el.dataset.real;
          el.style.transform = "translateY(0) scale(1)";
        } else {
          el.textContent = JUMBLE[Math.floor(Math.random()*JUMBLE.length)];
          el.style.transform = "translateY(-6px) scale(.96)";
        }
      }
      if (prog >= 1){
        clearInterval(shuffleInterval); shuffleInterval = null;
        assinatura.classList.add("done");
      }
    }, 80);
  }

  function spark(){
    const rect = assinatura.getBoundingClientRect();
    const s = document.createElement("span");
    s.className = "spark";
    s.style.left = (rect.left + rect.width * (0.2 + Math.random()*0.6)) + "px";
    s.style.top  = (rect.top  + rect.height * (0.2 + Math.random()*0.6)) + "px";
    document.body.appendChild(s);
    setTimeout(()=> s.remove(), 1800);
  }

  function startPulse(){
    const ms = (60 / BPM) * 1000;
    perg.classList.add("pulse");
    pulseInterval = setInterval(()=>{
      perg.animate([{transform:"scale(1)"},{transform:"scale(1.002)"}], {duration:150,fill:"none"});
      if (Math.random() < 0.6) spark();
    }, ms);
  }

  // ativar ritual
  seloBtn.addEventListener("click", async () => {
    if (activated) return;
    activated = true;
    seloBtn.classList.add("hidden");

    perg.classList.add("revealed");
    carta.setAttribute("aria-hidden","false");

    try { await audioEl.play(); }
    catch(e){ console.warn("Autoplay bloqueado:", e); }

    startPulse();
    buildSignature();
    startShuffle(2600);
    assinatura.setAttribute("aria-hidden","false");
    assinatura.style.opacity = "1";
  });
});
