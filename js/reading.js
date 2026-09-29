(function () {
  let config;
  try { config = JSON.parse(sessionStorage.getItem('tarotSession')); } catch (_) { config = null; }
  if (!config || !window.SPREADS[config.spread]) {
    window.location.replace('index.html');
    return;
  }

  const spread = window.SPREADS[config.spread];
  config.addMindset = spread.positions.length >= 3;
  const positions = [...spread.positions];
  if (config.addMindset && spread.mindsetPosition) positions.push(spread.mindsetPosition);

  const title = document.querySelector('#ritual-title');
  const kicker = document.querySelector('#ritual-kicker');
  const instruction = document.querySelector('#ritual-instruction');
  const cutControls = document.querySelector('#cut-controls');
  const drawAssist = document.querySelector('#draw-assist');
  const drawStatus = document.querySelector('#draw-status');
  const resultSection = document.querySelector('#result-section');
  const resultCards = document.querySelector('#result-cards');
  const resultQuestion = document.querySelector('#result-question');
  const progressItems = [...document.querySelectorAll('.progress li')];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let chosenCards = [];
  let deck = shuffle(window.TarotDraw.selectDeck(window.TAROT_CARDS, config.majorOnly));
  const deckCount = deck.length;
  let sketchApi = null;
  const imageCache = new Map();
  function loadCardImage(src) {
    if (!imageCache.has(src)) {
      const image = new Image();
      const promise = new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('牌圖載入失敗，請重新整理後再試。'));
      });
      image.src = src;
      imageCache.set(src, { image, promise });
    }
    return imageCache.get(src).promise;
  }
  window.attachReadingExport(() => ({ cards: chosenCards, spread: spread.name, question: config.question || '' }), loadCardImage);

  function randomIndex(count) {
    // Reject the incomplete range so every index is exactly equally likely.
    const limit = 2 ** 32 - (2 ** 32 % count);
    const random = new Uint32Array(1);
    do { crypto.getRandomValues(random); } while (random[0] >= limit);
    return random[0] % count;
  }

  function shuffle(cards) {
    const copy = [...cards];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = randomIndex(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function setProgress(step) {
    const order = ['shuffle', 'cut', 'draw', 'result'];
    const current = order.indexOf(step);
    progressItems.forEach((item) => {
      const index = order.indexOf(item.dataset.step);
      item.classList.toggle('active', index === current);
      item.classList.toggle('done', index < current);
    });
  }

  function setCopy(stage, nextTitle, nextInstruction, nextKicker) {
    setProgress(stage);
    title.textContent = nextTitle;
    instruction.textContent = nextInstruction;
    kicker.textContent = nextKicker;
  }

  function orientation() {
    if (config.orientation !== 'mixed') return 'upright';
    return randomIndex(2) === 0 ? 'upright' : 'reversed';
  }

  function addCard(fanIndex, origin) {
    if (chosenCards.length >= positions.length) return;
    const card = deck.shift();
    loadCardImage(card.image).catch(() => {
      instruction.textContent = '牌圖載入失敗，請重新整理後再試。';
    });
    chosenCards.push({ card, orientation: orientation(), position: positions[chosenCards.length], fanIndex, origin });
    const remaining = positions.length - chosenCards.length;
    drawStatus.textContent = remaining > 0 ? `還需要抽 ${remaining} 張` : '牌已選好，正在展開⋯';
    if (remaining === 0) drawAssist.classList.add('is-hidden');
  }

  function showResults() {
    setCopy('result', '牌已展開', '依照每個位置慢慢閱讀，不必急著得到單一答案。', 'Your reading');
    drawStatus.textContent = '';
    resultCards.innerHTML = '';
    resultQuestion.textContent = config.question ? `「${config.question}」` : `${spread.name}・本次未設定文字問題`;

    chosenCards.forEach(({ card, orientation: cardOrientation, position }, index) => {
      const article = document.createElement('article');
      article.className = `result-card ${cardOrientation === 'reversed' ? 'reversed' : ''}`;
      article.style.animationDelay = `${index * 70}ms`;
      article.innerHTML = `
        <img class="result-card-image" src="${card.image}" alt="${card.name}（${cardOrientation === 'reversed' ? '逆位' : '正位'}）">
        <div>
          <span class="position-label">${String(index + 1).padStart(2, '0')} ・ ${position}</span>
          <h3>${card.name}</h3>
          <span class="orientation-label">${cardOrientation === 'reversed' ? '逆位' : '正位'}</span>
          <p class="keywords">${cardOrientation === 'reversed' ? card.reversed : card.upright}</p>
          ${card.meanings ? `<p class="card-meaning">${card.meanings[cardOrientation]}</p>` : ''}
        </div>`;
      resultCards.appendChild(article);
    });
    resultSection.classList.remove('is-hidden');
    // Start only after the complete original result is visible. Never await AI.
    window.startTarotAdvice?.(config, chosenCards);
    window.setTimeout(() => resultSection.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' }), 300);
  }

  function formatReading() {
    const lines = [`BITEtheABYSS TAROT｜${spread.name}`];
    if (config.question) lines.push(`問題：${config.question}`);
    lines.push('');
    chosenCards.forEach(({ card, orientation: o, position }, index) => {
      lines.push(`${index + 1}. ${position}｜${card.name}（${o === 'reversed' ? '逆位' : '正位'}）`);
      lines.push(o === 'reversed' ? card.reversed : card.upright);
      if (card.meanings) lines.push(card.meanings[o]);
    });
    const advice = window.getTarotAdvice?.();
    if (advice) lines.push('', `${chosenCards.length + 1}. 建議`, advice);
    return lines.join('\n');
  }

  document.querySelector('#exit-reading').addEventListener('click', () => { window.location.href = 'index.html'; });
  document.querySelector('#draw-again').addEventListener('click', () => {
    sessionStorage.setItem('tarotSession', JSON.stringify({ ...config, createdAt: new Date().toISOString() }));
    window.location.reload();
  });
  document.querySelector('#copy-reading').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(formatReading());
      button.textContent = '已複製';
      window.setTimeout(() => { button.textContent = '複製結果'; }, 1600);
    } catch (_) {
      button.textContent = '瀏覽器未允許複製';
    }
  });

  document.querySelectorAll('[data-pile]').forEach((button) => {
    button.addEventListener('click', () => sketchApi?.chooseCut(Number(button.dataset.pile)));
  });
  drawAssist.addEventListener('click', () => sketchApi?.chooseRandom());

  const tarotSketch = (p) => {
    let stage = 'shuffle';
    let stageStarted = 0;
    let chosenPile = -1;
    let selectedFan = new Set();
    let revealCount = 0;
    let lastReveal = 0;
    let resultShown = false;
    let stars = [];
    let canvasWidth = 900;
    let canvasHeight = 520;

    function dimensions() {
      const wrap = document.querySelector('#canvas-wrap');
      canvasWidth = Math.max(300, wrap.clientWidth);
      canvasHeight = window.innerWidth < 620 ? 470 : 520;
    }

    function cardSize(scale = 1) {
      const base = canvasWidth < 620 ? 48 : 64;
      const back = imageCache.get(window.TAROT_BACK).image;
      return { w: base * scale, h: base * back.naturalHeight / back.naturalWidth * scale };
    }

    function roundRectCard(x, y, w, h, rotation = 0, face = false, cardImage = '') {
      p.push();
      p.translate(x, y);
      p.rotate(rotation);
      p.rectMode(p.CENTER);
      p.stroke(face ? p.color(221, 194, 126, 210) : p.color(173, 145, 87, 180));
      p.strokeWeight(1);
      p.fill(face ? p.color(236, 225, 201) : p.color(21, 27, 53));
      p.rect(0, 0, w, h, Math.max(4, w * .08));
      const image = imageCache.get(face ? cardImage : window.TAROT_BACK)?.image;
      if (image?.complete && image.naturalWidth) {
        const ctx = p.drawingContext;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, Math.max(4, w * .08));
        ctx.clip();
        ctx.drawImage(image, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
      p.noFill();
      p.rect(0, 0, w, h, Math.max(4, w * .08));
      p.pop();
    }

    function drawBackground() {
      p.clear();
      const ctx = p.drawingContext;
      const gradient = ctx.createRadialGradient(canvasWidth / 2, canvasHeight * .48, 20, canvasWidth / 2, canvasHeight * .48, canvasWidth * .56);
      gradient.addColorStop(0, 'rgba(37, 47, 88, .60)');
      gradient.addColorStop(1, 'rgba(7, 10, 22, .08)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      p.noStroke();
      stars.forEach((star) => {
        const glow = 100 + 90 * p.sin(p.frameCount * star.speed + star.phase);
        p.fill(221, 194, 126, glow);
        p.circle(star.x * canvasWidth, star.y * canvasHeight, star.size);
      });
      p.noFill();
      p.stroke(217, 185, 111, 22);
      p.circle(canvasWidth / 2, canvasHeight * .47, Math.min(canvasWidth * .62, 380));
      p.circle(canvasWidth / 2, canvasHeight * .47, Math.min(canvasWidth * .36, 220));
      p.line(canvasWidth * .12, canvasHeight * .47, canvasWidth * .88, canvasHeight * .47);
    }

    function drawShuffle() {
      const elapsed = p.millis() - stageStarted;
      const { w, h } = cardSize();
      const cycle = Math.min(1, elapsed / (prefersReducedMotion ? 350 : 2200));
      for (let i = 0; i < 18; i += 1) {
        const local = Math.max(0, Math.min(1, cycle * 2.3 - i * .055));
        const side = i % 2 ? -1 : 1;
        const startX = canvasWidth / 2 + side * Math.min(150, canvasWidth * .22);
        const x = p.lerp(startX, canvasWidth / 2, ease(local));
        const y = canvasHeight * .5 + (i % 4) * 1.8 - Math.sin(local * Math.PI) * (30 + (i % 3) * 8);
        roundRectCard(x, y, w, h, side * (1 - local) * .12);
      }
      if (cycle >= 1) readyToCut();
    }

    function readyToCut() {
      if (stage !== 'shuffle') return;
      stage = 'cut';
      stageStarted = p.millis();
      setCopy('cut', '選擇一疊牌', '點選任一牌堆，或使用下方的左／中／右按鈕。', 'Cut the deck');
      cutControls.classList.remove('is-hidden');
    }

    function drawCut() {
      const { w, h } = cardSize(1.02);
      const gap = Math.min(155, canvasWidth * .25);
      [-1, 0, 1].forEach((offset, pile) => {
        const x = canvasWidth / 2 + offset * gap;
        const lift = chosenPile === pile ? -16 : 0;
        for (let i = 0; i < 7; i += 1) roundRectCard(x + i * .45, canvasHeight * .51 - i * 1.5 + lift, w, h);
      });
    }

    function drawCutMerge() {
      const elapsed = Math.min(1, (p.millis() - stageStarted) / (prefersReducedMotion ? 180 : 850));
      const { w, h } = cardSize(1.02);
      const gap = Math.min(155, canvasWidth * .25);
      [-1, 0, 1].forEach((offset, pile) => {
        const orderOffset = pile === chosenPile ? 8 : 0;
        const x = p.lerp(canvasWidth / 2 + offset * gap, canvasWidth / 2, ease(elapsed));
        for (let i = 0; i < 6; i += 1) roundRectCard(x + i * .45, canvasHeight * .51 - i * 1.5 - orderOffset * (1 - elapsed), w, h);
      });
      if (elapsed >= 1) beginDraw();
    }

    function beginDraw() {
      if (stage === 'draw') return;
      stage = 'draw';
      stageStarted = p.millis();
      setCopy('draw', '請抽出你的牌', `從牌扇中選出 ${positions.length} 張牌。`, 'Draw your cards');
      drawStatus.textContent = `還需要抽 ${positions.length} 張`;
      drawAssist.classList.remove('is-hidden');
    }

    function fanCards() {
      return window.TarotDraw.fanLayout(canvasWidth, canvasHeight, cardSize(.95), deckCount);
    }

    function layoutFor(index, total) {
      const size = cardSize(canvasWidth < 620 ? .72 : .78);
      const usable = canvasWidth * .76;
      const perRow = canvasWidth < 620 ? Math.min(5, total) : Math.min(7, total);
      const row = Math.floor(index / perRow);
      const rows = Math.ceil(total / perRow);
      const rowCount = Math.min(perRow, total - row * perRow);
      const gap = Math.min(size.w * 1.36, usable / Math.max(rowCount, 1));
      const startX = canvasWidth / 2 - ((rowCount - 1) * gap) / 2;
      const centerY = canvasHeight * .37 + (row - (rows - 1) / 2) * (size.h * .78);
      return { x: startX + (index % perRow) * gap, y: centerY, w: size.w, h: size.h };
    }

    function drawSelection() {
      const fan = fanCards();
      fan.forEach((card, index) => {
        if (!selectedFan.has(index)) roundRectCard(card.x, card.y, card.w, card.h, card.angle);
      });
      chosenCards.forEach((selection, index) => {
        const target = layoutFor(index, positions.length);
        const elapsed = Math.min(1, (p.millis() - (selection.origin.time || stageStarted)) / (prefersReducedMotion ? 60 : 520));
        const from = selection.origin;
        const x = p.lerp(from.x, target.x, ease(elapsed));
        const y = p.lerp(from.y, target.y, ease(elapsed));
        const rotation = p.lerp(from.angle || 0, 0, ease(elapsed));
        roundRectCard(x, y, target.w, target.h, rotation);
      });
      if (chosenCards.length === positions.length && chosenCards.every((selection) => p.millis() - selection.origin.time > (prefersReducedMotion ? 80 : 620)
        && imageCache.get(selection.card.image)?.image.naturalWidth > 0)) {
        stage = 'reveal';
        stageStarted = p.millis();
        lastReveal = stageStarted - (prefersReducedMotion ? 100 : 460);
      }
    }

    function drawReveal() {
      const interval = prefersReducedMotion ? 80 : 650;
      if (revealCount < chosenCards.length && p.millis() - lastReveal > interval) {
        revealCount += 1;
        lastReveal = p.millis();
      }
      chosenCards.forEach((selection, index) => {
        const target = layoutFor(index, positions.length);
        const face = index < revealCount;
        const turn = face
          ? (index === revealCount - 1 ? Math.min(1, (p.millis() - lastReveal + interval) / Math.max(interval, 1)) : 1)
          : 0;
        const widthScale = face ? Math.max(.08, Math.abs(Math.cos(turn * Math.PI))) : 1;
        p.push();
        p.translate(target.x, target.y);
        if (selection.orientation === 'reversed') p.rotate(Math.PI);
        roundRectCard(0, 0, target.w * widthScale, target.h, 0, face && turn > .5, selection.card.image);
        p.pop();
      });
      if (!resultShown && revealCount === chosenCards.length && p.millis() - lastReveal > (prefersReducedMotion ? 120 : 900)) {
        resultShown = true;
        stage = 'result';
        showResults();
      }
    }

    function ease(t) { return 1 - Math.pow(1 - t, 3); }

    function chooseCut(pile) {
      if (stage !== 'cut') return;
      chosenPile = pile;
      cutControls.classList.add('is-hidden');
      stage = 'cutting';
      stageStarted = p.millis();
    }

    function chooseAt(x, y) {
      if (stage === 'cut') {
        const { w, h } = cardSize(1.02);
        const gap = Math.min(155, canvasWidth * .25);
        const pile = [0, 1, 2].find((index) => {
          const centerX = canvasWidth / 2 + (index - 1) * gap;
          const centerY = canvasHeight * .51 - 4.5;
          return Math.abs(x - centerX) <= Math.max(40, w / 2 + 12)
            && Math.abs(y - centerY) <= h / 2 + 16;
        });
        if (pile !== undefined) chooseCut(pile);
        return;
      }
      if (stage !== 'draw' || chosenCards.length >= positions.length) return;
      const fan = fanCards();
      const index = window.TarotDraw.hitTest(fan, x, y, selectedFan);
      if (index !== -1) {
        selectedFan.add(index);
        addCard(index, { ...fan[index], time: p.millis() });
      }
    }

    function chooseRandom() {
      if (stage !== 'draw') return;
      const fan = fanCards();
      const available = fan.map((card, index) => ({ card, index })).filter(({ index }) => !selectedFan.has(index));
      if (!available.length) return;
      const selected = available[randomIndex(available.length)];
      selectedFan.add(selected.index);
      addCard(selected.index, { ...selected.card, time: p.millis() });
    }

    p.setup = () => {
      dimensions();
      const canvas = p.createCanvas(canvasWidth, canvasHeight);
      canvas.parent('canvas-wrap');
      canvas.attribute('aria-label', '互動塔羅牌桌。切牌後點選牌扇中的牌來抽牌。');
      canvas.attribute('role', 'application');
      p.textFont('Iansui');
      // A canvas-local click handles mouse, pen and browser-generated touch
      // clicks once. Global p5 touch handlers can cancel native button clicks.
      canvas.elt.addEventListener('click', (event) => {
        const bounds = canvas.elt.getBoundingClientRect();
        chooseAt(
          (event.clientX - bounds.left) * canvasWidth / bounds.width,
          (event.clientY - bounds.top) * canvasHeight / bounds.height
        );
      });
      p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
      stars = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), size: Math.random() * 1.5 + .4, speed: Math.random() * .018 + .005, phase: Math.random() * Math.PI * 2 }));
      stageStarted = p.millis();
      sketchApi = { chooseCut, chooseRandom };
      setCopy('shuffle', '正在洗牌', '慢慢呼吸，把注意力放回你的問題。', 'Preparing your deck');
    };

    p.draw = () => {
      drawBackground();
      if (stage === 'shuffle') drawShuffle();
      if (stage === 'cut') drawCut();
      if (stage === 'cutting') drawCutMerge();
      if (stage === 'draw') drawSelection();
      if (stage === 'reveal' || stage === 'result') drawReveal();
    };

    p.windowResized = () => {
      dimensions();
      p.resizeCanvas(canvasWidth, canvasHeight);
    };
  };

  if (typeof window.p5 === 'function') {
    Promise.all([document.fonts.load('16px Iansui').catch(() => []), loadCardImage(window.TAROT_BACK)])
      .then(() => new window.p5(tarotSketch))
      .catch(() => setCopy('shuffle', '牌圖載入失敗', '請重新整理頁面；你的設定仍保留在這台裝置。', 'Please reload'));
  } else {
    setCopy('shuffle', '牌桌載入失敗', '請重新整理頁面；你的設定仍保留在這台裝置。', 'Connection interrupted');
  }
})();
