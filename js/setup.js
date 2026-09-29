(function () {
  const form = document.querySelector('#setup-form');
  const spreadGrid = document.querySelector('.spread-grid');
  const moreButton = document.querySelector('#toggle-more');
  const countPill = document.querySelector('#card-count');
  const spreadDescription = document.querySelector('#spread-description');
  const question = document.querySelector('#question');
  const questionCount = document.querySelector('#question-count');

  const descriptions = {
    single: '用一張牌聚焦當下，適合清楚而單純的提問。',
    three: '沿著過去、現在與未來，看見事件如何流動。',
    relationship: '呈現雙方心態、關係核心與下一步。',
    decision: '比較兩條路徑各自的動力與可能結果。',
    celtic: '十個位置完整梳理現況、阻力、內在心態、外在環境與可能走向。',
    'body-mind-spirit': '從身體、思緒與內在需要，整理此刻的整體狀態。',
    elements: '從行動、情感、思考與現實資源四個方向觀察問題。',
    creative: '整理靈感來源、可用資源、創作阻力與下一個可行步驟。'
  };

  function selectedSpread() {
    return document.querySelector('input[name="spread"]:checked').value;
  }

  function updateSpread() {
    const id = selectedSpread();
    const spread = window.SPREADS[id];
    document.querySelectorAll('.spread-option').forEach((label) => {
      label.classList.toggle('selected', label.querySelector('input').checked);
    });

    if (!['single', 'three'].includes(id)) {
      spreadGrid.classList.add('expanded');
      moreButton.setAttribute('aria-expanded', 'true');
    }

    const extra = spread.positions.length >= 3 ? 1 : 0;
    countPill.textContent = `${spread.positions.length + extra} 張`;
    spreadDescription.textContent = descriptions[id];
  }

  moreButton.addEventListener('click', () => {
    const expanded = spreadGrid.classList.toggle('expanded');
    moreButton.setAttribute('aria-expanded', String(expanded));
  });

  document.querySelectorAll('input[name="spread"]').forEach((radio) => radio.addEventListener('change', updateSpread));

  question.addEventListener('input', () => { questionCount.textContent = `${question.value.length} / 160`; });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const id = selectedSpread();
    const orientation = document.querySelector('#upright-only-toggle').checked ? 'upright' : 'mixed';
    const session = {
      version: 2,
      spread: id,
      question: question.value.trim(),
      orientation,
      majorOnly: document.querySelector('#major-only-toggle').checked,
      addMindset: window.SPREADS[id].positions.length >= 3,
      createdAt: new Date().toISOString()
    };
    sessionStorage.setItem('tarotSession', JSON.stringify(session));
    window.location.href = 'reading.html';
  });

  updateSpread();
})();
