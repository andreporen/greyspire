// ritual.js
// Comportamento: esperar clique no selo -> reproduzir áudio (com fallback) -> animações
// Assumimos que o usuário já forneceu img/selo.png e audio/ritual.mp3

(() => {
  const sealBtn = document.getElementById('seal');
  const sealImg = document.getElementById('seal-img');
  const letterWrapper = document.getElementById('letter-wrapper');
  const letter = document.getElementById('letter');
  const audio = document.getElementById('ritual-audio');
  const signatureEl = document.getElementById('signature-letters');

  const SIGNATURE_TEXT = 'Arcanista-mor Amaris Solun';

  // Ensure audio is available and low volume by default
  audio.volume = 0.12; // baixo por padrão
  audio.preload = 'auto';
  // Expose controls via JS (invisible). For debug you can call window.ritualControls.play()
  window.ritualControls = {
    play: () => audio.play().catch(()=>{}),
    pause: () => audio.pause(),
    mute: (m=true) => { audio.muted = m; },
    setVolume: (v) => { audio.volume = Math.max(0, Math.min(1, v)); },
    element: audio
  };

  // Utility: attempt to play, but handle browser autoplay policy
  async function tryPlayAudio() {
    try {
      await audio.play();
      return true;
    } catch (err) {
      // Autoplay blocked: we'll rely on the click (which is a user gesture) to allow playback.
      // But since this function is called within the click handler, it should succeed.
      // Still, keep silent and return false.
      return false;
    }
  }

  // Add ripple/pulse on touchstart for tactile feedback (no visible UI beyond seal)
  sealBtn.addEventListener('pointerdown', (e) => {
    sealBtn.style.transform = 'scale(0.98)';
  });
  sealBtn.addEventListener('pointerup', () => {
    sealBtn.style.transform = '';
  });
  sealBtn.addEventListener('pointercancel', () => {
    sealBtn.style.transform = '';
  });

  // Main ritual trigger
  sealBtn.addEventListener('click', async function onClick(e){
    // Prevent double-clicks
    sealBtn.removeEventListener('click', onClick);

    // Play audio (the click is a user gesture -> should allow autoplay)
    await tryPlayAudio();

    // Animate seal disappearing
    sealBtn.classList.add('seal-burn');

    // Small purple flare on the parchment around where the seal was
    const flare = document.createElement('div');
    Object.assign(flare.style,{
      position:'absolute',
      width:'60vmin',
      height:'60vmin',
      left:'50%',
      top:'50%',
      transform:'translate(-50%,-50%)',
      pointerEvents:'none',
      borderRadius:'50%',
      mixBlendMode:'screen',
      background: 'radial-gradient(circle at 30% 35%, rgba(180,120,220,0.12), rgba(120,50,180,0.06) 10%, transparent 40%)'
    });
    document.getElementById('parchment').appendChild(flare);

    // After a beat, hide the seal and reveal the letter with tear animation
    setTimeout(() => {
      // remove seal from DOM (or hide) so it's gone
      sealBtn.style.display = 'none';
      // show letter wrapper
      letterWrapper.classList.remove('hidden');
      // start reveal animation
      letter.classList.add('tear-anim');

      // After letter reveal, show signature animation
      setTimeout(() => {
        startSignatureShuffle(SIGNATURE_TEXT, signatureEl, {
          duration: 2800,
          stepInterval: 40
        });
      }, 1100); // time aligned to tear animation
    }, 600);
  });

  // Signature shuffle effect
  // Inspired by: letter-shuffle where random chars cycle into real ones
  function startSignatureShuffle(target, container, opts = {}) {
    const duration = opts.duration || 2500;
    const stepInterval = opts.stepInterval || 50;
    const chars = '!@#$%&*abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789—≈<>/\\';
    container.textContent = ''; // clear
    const len = target.length;
    const start = performance.now();
    // We'll keep an array of current displayed characters
    const display = Array.from({length: len}, () => ' ');
    // For indices that are spaces, keep as space
    const nonLetters = [];
    for (let i = 0; i < len; i++) {
      if (target[i] === ' ') {
        display[i] = ' ';
        nonLetters.push(i);
      }
    }

    // Render initial
    container.textContent = display.join('');

    // We'll randomly stabilize letters over time
    let rafId = null;
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);

      // Decide how many letters should be locked in
      const lockedCount = Math.floor(progress * (len - nonLetters.length));
      // Choose which positions to lock: from left to right with some randomness
      // We'll compute an easing index order
      const indices = [];
      for (let i = 0; i < len; i++) {
        if (!nonLetters.includes(i)) indices.push(i);
      }
      // Shuffle a deterministic-ish order seeded by start for variety
      indices.sort((a,b)=> (a - b) * Math.sin(start/1000 + a) );

      const lockedSet = new Set(indices.slice(0, lockedCount));

      for (let i = 0; i < len; i++) {
        if (container.textContent[i] === target[i]) continue;
        if (nonLetters.includes(i)) continue;
        if (lockedSet.has(i)) {
          display[i] = target[i];
        } else {
          // random glyph with a chance to mimic diacritics subtle color: use real char occasionally
          if (Math.random() < 0.03 + progress*0.15) {
            // pick a character closer to target (same case)
            const t = target[i];
            display[i] = (Math.random() < 0.33) ? t.toUpperCase() : t.toLowerCase();
          } else {
            display[i] = chars[Math.floor(Math.random()*chars.length)];
          }
        }
      }

      container.textContent = display.join('');

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        // finalize
        container.textContent = target;
        container.classList.add('signed');
        cancelAnimationFrame(rafId);
      }
    }

    rafId = requestAnimationFrame(step);
  }

  // Accessibility: allow space/enter on seal for keyboard users
  sealBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      sealBtn.click();
    }
  });

})();
