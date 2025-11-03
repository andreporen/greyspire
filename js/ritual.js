const seloBtn = document.getElementById('seloBtn');
const crawl = document.getElementById('crawl');
const crawlContent = document.getElementById('crawlContent');
const ritualAudio = document.getElementById('ritualAudio');

// evita múltiplos starts
let started = false;

function startCrawl() {
  if (started) return;
  started = true;

  // play audio (user interaction)
  ritualAudio.currentTime = 0;
  ritualAudio.play().catch(()=>{});

  // calcular duração baseada no tamanho do conteúdo (em px)
  // mais conteúdo = animação mais longa
  requestAnimationFrame(()=> {
    const contentHeight = crawlContent.scrollHeight;
    // base: 60s para 2000px; ajuste linear
    const duration = Math.max(18, Math.min(140, Math.round((contentHeight / 2000) * 60)));
    crawlContent.style.setProperty('--crawl-duration', duration + 's');

    // iniciar animação
    crawlContent.classList.add('animate');
    crawl.setAttribute('aria-hidden','false');

    // opcional: suavemente diminuir brilho do selo para não distrair
    seloBtn.style.transition = 'opacity 1.2s ease';
    seloBtn.style.opacity = '0.9';
  });
}

seloBtn.addEventListener('click', startCrawl);

// se quiser que o usuário possa reiniciar ao clicar novamente, descomente abaixo:
// seloBtn.addEventListener('dblclick', () => { location.reload(); });
