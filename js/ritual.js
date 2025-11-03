// ELEMENTOS
const seloBtn = document.getElementById('seloBtn');
const pergaminho = document.getElementById('pergaminho');
const carta = document.getElementById('carta');
const assinatura = document.getElementById('assinatura');
const ritualAudio = document.getElementById('ritualAudio');

// CONTROLE
let audioStarted = false;
let particlesActive = false;

// REVELA A CARTA
function revelarCarta(){
  seloBtn.classList.add('hidden');
  pergaminho.classList.add('revealed');
  carta.setAttribute('aria-hidden','false');

  // ativa pulsação da fenda
  pergaminho.classList.add('fenda-pulse');
  assinatura.classList.add('fenda');

  // toca o áudio
  if(!audioStarted){
    ritualAudio.volume = 0.8;
    ritualAudio.play().catch(()=>{});
    audioStarted = true;
  }

  // inicia partículas
  if(!particlesActive){
    particlesActive = true;
    iniciarParticulas();
  }
}

seloBtn.addEventListener('click', revelarCarta);

// ===============================
// PARTÍCULAS / CHISPAS DA FENDA
// ===============================
function criarParticula(){
  const p = document.createElement('div');
  p.className = 'spark';

  const rect = assinatura.getBoundingClientRect();
  p.style.left = rect.left + rect.width * Math.random() + 'px';
  p.style.top  = rect.top  + rect.height + 4 + 'px';

  document.body.appendChild(p);
  setTimeout(()=>p.remove(), 1500);
}

function iniciarParticulas(){
  setInterval(criarParticula, 900);
}

// ===============================
// CANVAS (RESERVADO PARA FUTURO WEBGL/FX)
// ===============================
const canvas = document.getElementById('fxCanvas');
const gl = canvas.getContext('webgl', { preserveDrawingBuffer:true });

function ajustarCanvas(){
  canvas.width  = pergaminho.clientWidth;
  canvas.height = pergaminho.clientHeight;
}
ajustarCanvas();
window.addEventListener('resize', ajustarCanvas);
