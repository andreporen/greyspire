import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';

// ---------- DOM ----------
const canvas = document.getElementById('stage');
const seloBtn = document.getElementById('seloBtn');
const assinatura = document.getElementById('assinatura');
const ritualAudioEl = document.getElementById('ritualAudio');

// ---------- ÁUDIO (Howler opcional) ----------
let howl;
try {
  howl = new Howl({
    src: ['audio/ritual.mp3'],
    loop: true,
    volume: 0.8,
    html5: true
  });
} catch(e){ /* fallback: usar <audio> se Howler indisponível */ }

// ---------- TEXTO DA CARTA ----------
const cartaParagrafos = [
  "Cidade de Greyspire, remanescentes do Velho Império, 537 D.R",
  "Vocês deviam ter percebido, mas a percepção é coisa perigosa por aqui, então talvez não notem até que já seja tarde; o mundo não se quebrou num só instante, ele vai quebrando aos poucos, como vidro que racha sem barulho, e essa lentidão é o que permite que todos finjam normalidade, que chamem de rotina aquilo que só parece rotina para quem esqueceu como é estar inteiro. O Império venceu, eles repetem isso com calma, como se a repetição tornasse a mentira menos afiada; a Federação Arcana não foi simplesmente derrotada, foi riscada da fala comum, apagada como se alguém tivesse passado a mão numa página cheia de nomes que nunca mereceram existir, e a Fenda fez exatamente o que prometeram que faria, o que prova que não foi erro técnico o que aconteceu ali, foi escolha com consequências que ninguém calculou direito, achando que se podia encerrar o que foi aberto, e desde então o mundo não acabou, apenas deixou de saber fechar suas próprias feridas.",
  "Greyspire sustenta-se enquanto sabe esconder o que a sustenta, e por isso não a chamem de cidade que vive; é uma cidade que é mantida, conserva-se por medida, por prática institucionalizada, cada pessoa que nasce recebe uma runa que pouco diz sobre destino e muito diz sobre controle, marca que serve para identificação e para decidir quem fica, quem se move, quem é observado, e os sermões da Liturgia falam em ordem espiritual com uma voz que soa oficial e seca, enquanto em salas que não aparecem nos mapas oficiais acontecem coisas que não são ditas em voz alta: eu vi corredores com portas que ninguém registra, vi salas onde se repetem rituais sem comunicado público, vi corpos voltando diferentes de como saíram; eu digo isto porque sei o suficiente para ter medo, e porque sei que a drenagem, se é preciso dar nome ao que vi, não é coisa de praça nem de boato, é segredo de casta, é prática que se faz atrás de cortinas grossas e que só se pronuncia com cuidado, como quem revela um pecado que corrói a garganta.",
  "A magia existe, claro que existe, mas não como no livro didático; cada conjuro custa algo que não volta, às vezes sono, às vezes um sentimento, às vezes um nome que se apaga, e já vi mestres que falam como se as palavras fossem serras dentro da boca, e a Engrenagem Perpétua gira lá embaixo não como motor que move rodas, mas como dispositivo que compensa vazios, que adia o colapso por turnos e listas, e por isso chamam aquilo de manutenção, como se fosse possível domesticar um mal com papel e carimbo; só que agora algo mudou e não é sutileza de estatística, é sensação, e eu sinto: ela gira mais rápido, o número dos que deixam de ser contados aumentou, runas mudam sem dedo que escreva, bairros inteiros parecem sonhar acordados e sair pela manhã para andar em ruas que já não são exatamente ruas, pessoas voltam de lugares proibidos com palavras gravadas na pele, crianças nascem com marcas que não constam em nenhum livro, arquivos reescrevem-se sozinhos quando a cidade fecha os olhos.",
  "Vocês foram riscados das listas, mas não da memória que importa, e lembram de mim quando ninguém mais lembra, e isso é o erro que a cidade vai corrigir se vocês demorarem. Por isso venham. Não perguntem, não procurem provas, não tentem achar meu nome em arquivo algum porque já o arrancaram de todo lugar que pudesse apontá-lo; simplesmente apareçam no Ferrugem & Ossos, no bairro Velha Chama, atrás do moinho cujas janelas foram muradas, antes da ponte que surge apenas quando chove, e venham enquanto ainda conseguem lembrar quem eram antes de serem anotados. Se chegarem cedo, talvez eu ainda esteja à mesa tentando juntar palavras que não se deixam prender. Se chegarem tarde, talvez eu ainda respire. Se chegarem muito tarde, talvez não reste nada em que vocês se reconheçam quando olharem para trás. Não peço confiança. Quero que saibam que já fazem parte da revolução."
];

// ---------- RENDER TEXTO EM CANVAS 2D (vira textura para um plano em 3D) ----------
function makeCrawlTexture({ widthPx, marginPx, textPx, lineHeight, glow }) {
  // calcula altura necessária
  const ctxMeasure = document.createElement('canvas').getContext('2d');
  ctxMeasure.font = `${textPx}px "Uncial Antiqua", serif`;

  const lines = [];
  const maxWidth = widthPx - marginPx*2;

  // quebra palavras por parágrafo
  cartaParagrafos.forEach(p => {
    const words = p.split(' ');
    let line = '';
    for (let w of words) {
      const test = line ? line + ' ' + w : w;
      const testWidth = ctxMeasure.measureText(test).width;
      if (testWidth > maxWidth) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    // espaço entre parágrafos
    lines.push('');
  });

  const heightPx = marginPx*2 + Math.ceil(lines.length * lineHeight);

  // pinta em um canvas grande
  const can = document.createElement('canvas');
  can.width = widthPx;
  can.height = heightPx;
  const ctx = can.getContext('2d');

  // fundo transparente (será sobre o preto do WebGL)
  ctx.clearRect(0,0,can.width,can.height);
  ctx.font = `${textPx}px "Uncial Antiqua", serif`;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'top';

  // glow roxo suave
  ctx.shadowColor = glow;
  ctx.shadowBlur = 12;

  let y = marginPx;
  lines.forEach(line => {
    ctx.fillText(line, marginPx, y);
    y += line ? lineHeight : (lineHeight * 0.6); // parágrafo vazio = espaçamento maior
  });

  // título opcional (já temos o texto completo — mantive simples)
  return { canvas: can, aspect: can.width / can.height, heightPx };
}

// ---------- THREE.JS SETUP ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha:false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 200);
camera.position.set(0, 0, 6);

// uma luz sutil (não afeta MeshBasic, mas se mudar material fica ok)
const amb = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(amb);

// fundo preto
renderer.setClearColor(0x000000, 1);

// parâmetros do texto/texture
const TEXT_WIDTH_PX = 1600;
const MARGIN_PX = 80;
const TEXT_PX = 34;              // base desktop (mobile ajusta)
const LINE_H = Math.round(TEXT_PX * 1.6);
const GLOW = 'rgba(178,76,255,0.35)';

let crawlMesh, crawStartTime = 0, crawlDone = false, durationSec = 60;

// cria/atualiza o mesh do crawl
function buildCrawlMesh() {
  if (crawlMesh) {
    scene.remove(crawlMesh);
    crawlMesh.geometry.dispose();
    crawlMesh.material.map.dispose();
    crawlMesh.material.dispose();
  }

  // menor fonte em telas pequenas
  const mobile = window.innerWidth < 720;
  const tpx = mobile ? Math.max(22, TEXT_PX - 8) : TEXT_PX;
  const lh = mobile ? Math.round(tpx*1.55) : LINE_H;

  const tex = makeCrawlTexture({
    widthPx: TEXT_WIDTH_PX,
    marginPx: MARGIN_PX,
    textPx: tpx,
    lineHeight: lh,
    glow: GLOW
  });

  const texture = new THREE.CanvasTexture(tex.canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  // define tamanho do plano em unidades "mundo"
  const planeWidth = 8; // mais largo = texto maior
  const planeHeight = planeWidth / tex.aspect;

  const geo = new THREE.PlaneGeometry(planeWidth, planeHeight, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  crawlMesh = new THREE.Mesh(geo, mat);
  scene.add(crawlMesh);

  // posição inicial (fora da vista, embaixo e mais perto)
  crawlMesh.rotation.x = -0.36;      // ~20.6 graus
  crawlMesh.position.set(0, -4.0, -1.5);

  // calcula duração com base na altura do canvas (quanto maior, mais demorado)
  const basePerPx = 0.03; // segundos por 100px do canvas ≈ ajusta velocidade
  durationSec = THREE.MathUtils.clamp((tex.heightPx / 100) * basePerPx, 28, 120);

  crawStartTime = performance.now();
  crawlDone = false;
}
buildCrawlMesh();

// animação
function animate(now) {
  requestAnimationFrame(animate);

  if (!crawlDone && started) {
    const t = (now - crawStartTime) / 1000; // segundos
    const k = THREE.MathUtils.clamp(t / durationSec, 0, 1);

    // curva de subida: começa lento, acelera, desacelera no final
    const ease = k<0.5 ? 2*k*k : -1+(4-2*k)*k;

    // anima posição: sobe e vai "para longe"
    crawlMesh.position.y = THREE.MathUtils.lerp(-4.0, 3.8, ease);
    crawlMesh.position.z = THREE.MathUtils.lerp(-1.5, -14.0, ease);

    // quando termina, fixa resultado e mostra assinatura
    if (k >= 1) {
      crawlDone = true;
      assinatura.classList.add('show');
    }
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

// resize
function onResize(){
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  buildCrawlMesh(); // re-renderiza textura com fonte proporcional
}
window.addEventListener('resize', onResize);

// ---------- START ----------
let started = false;
function iniciar(){
  if (started) return;
  started = true;

  // áudio
  if (howl) {
    howl.seek(0);
    howl.play();
  } else {
    try { ritualAudioEl.currentTime = 0; ritualAudioEl.play(); } catch(e){}
  }

  // anima o selo para discreto, mas não some
  seloBtn.classList.add('dim');

  // reinicia o crawl timing
  crawStartTime = performance.now();
  crawlDone = false;
}
seloBtn.addEventListener('click', iniciar);
