document.addEventListener("DOMContentLoaded",()=>{
  const perg=document.getElementById("pergaminho");
  const selo=document.getElementById("seloBtn");
  const carta=document.getElementById("carta");
  const ass=document.getElementById("assinatura");

  const NAME="Arcanista-mor Amaris Solun";
  const RUNES="ᚠᚢᚦᚨᚱᚲᚹᚺᚾᛁᛃ✦✴✶◈◇◆◐◒◓◯";
  let activated=false,breatheTimer=null,runesWrap=null;
  perg.classList.remove("revealed");
  selo.classList.remove("ativado");
  ass.style.opacity="0";

  const pick=s=>s[Math.floor(Math.random()*s.length)];

  function createRunes(){
    if(runesWrap)return;
    runesWrap=document.createElement("span");
    runesWrap.className="runes";
    for(const ch of NAME){
      const sp=document.createElement("span");
      sp.className="rune";
      if(ch===" "){sp.textContent=" ";sp.style.width="0.48em";}
      else{sp.textContent=pick(RUNES);sp.dataset.ghost=pick(RUNES);sp.dataset.real=ch;}
      runesWrap.appendChild(sp);
    }
    ass.appendChild(runesWrap);
  }

  function sparkNear(el){
    const r=el.getBoundingClientRect();
    const s=document.createElement("span");
    s.className="spark";
    s.style.left=(r.left+r.width*0.5)+"px";
    s.style.top=(r.top+window.scrollY+r.height*0.3)+"px";
    document.body.appendChild(s);
    setTimeout(()=>s.remove(),1700);
  }

  function refreshRunes(intensity=1){
    if(!runesWrap)return;
    const cells=[...runesWrap.querySelectorAll(".rune")];
    const maxReal=Math.floor(NAME.replace(/ /g,'').length*0.30);
    let shownReal=0;
    for(const el of cells){
      if(el.textContent===" ")continue;
      const showReal=Math.random()<(0.18*intensity)&&shownReal<maxReal;
      if(showReal){el.textContent=el.dataset.real;el.dataset.ghost=pick(RUNES);shownReal++;}
      else{
        el.style.transform='translateY(-2px) scale(0.97)';el.style.opacity='0.9';
        setTimeout(()=>{el.textContent=pick(RUNES);el.dataset.ghost=pick(RUNES);el.style.transform='translateY(0) scale(1)';el.style.opacity='1';},380);
      }
      if(Math.random()<0.12*intensity)sparkNear(el);
    }
  }
  function startBreath(){if(!breatheTimer)breatheTimer=setInterval(()=>refreshRunes(0.9),1200);}
  function onPulse(){refreshRunes(1.2);}

  selo.addEventListener("click",async()=>{
    if(activated)return;
    activated=true;
    selo.classList.add("ativado");
    selo.style.pointerEvents="none";
    perg.classList.add("revealed");
    setTimeout(()=>{selo.style.opacity="0";selo.style.transform="scale(.9) translateY(-8px)";},600);
    setTimeout(()=>{selo.style.display="none";},1400);
    try{await window.ritualAudio.start();}catch(e){console.warn(e);}
    createRunes();startBreath();
    setTimeout(()=>{ass.style.opacity="1";},1000);
    window.addEventListener("ritual:pulse",onPulse);
  });
});
