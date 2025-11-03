const seloBtn=document.getElementById('seloBtn');
const pergaminho=document.getElementById('pergaminho');
const carta=document.getElementById('carta');
const assinatura=document.getElementById('assinatura');
const ritualAudio=document.getElementById('ritualAudio');
let audioStarted=false;
function revelarCarta(){seloBtn.classList.add('hidden');pergaminho.classList.add('revealed');carta.setAttribute('aria-hidden','false');if(!audioStarted){ritualAudio.volume=0.8;ritualAudio.play().catch(()=>{});audioStarted=true;}}
seloBtn.addEventListener('click',revelarCarta);
