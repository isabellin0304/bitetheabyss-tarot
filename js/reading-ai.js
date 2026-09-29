(function () {
  let started = false;
  let interpretation = '';
  window.getTarotAdvice = () => interpretation;
  window.startTarotAdvice = async (config, selections) => {
    const question = typeof config.question === 'string' ? config.question.trim() : '';
    if (!question || started) return;
    started = true;
    const panel = document.querySelector('#ai-advice');
    const text = document.querySelector('#ai-advice-text');
    document.querySelector('#ai-advice-title').textContent = `${selections.length + 1}. 建議`;
    panel.classList.remove('is-hidden');
    panel.setAttribute('aria-busy', 'true');
    text.textContent = '正在分析⋯';
    let timer;
    const controller = new AbortController();
    try {
      const endpoint = window.TAROT_AI_ENDPOINT;
      if (!endpoint || new URL(endpoint).protocol !== 'https:') throw new Error('unavailable');
      const payload = {
        requestId: crypto.randomUUID(), question, spread: config.spread,
        addMindset: config.addMindset === true,
        cards: selections.map(({ card, orientation }) => ({ id: card.id, orientation }))
      };
      timer = setTimeout(() => controller.abort(), 18000);
      const response = await fetch(endpoint, {
        method: 'POST', mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: controller.signal
      });
      if (!response.ok) throw new Error('unavailable');
      const data = await response.json();
      if (Object.keys(data).length !== 1 || typeof data.interpretation !== 'string') throw new Error('invalid');
      const result = data.interpretation.trim();
      if (!result || [...result].length > 200) throw new Error('invalid');
      interpretation = result;
      text.textContent = result;
      window.dispatchEvent(new Event('tarot-advice-ready'));
    } catch (_) {
      text.textContent = '綜合建議暫時無法提供，仍可參考原有牌義。';
    } finally {
      clearTimeout(timer);
      panel.setAttribute('aria-busy', 'false');
    }
  };
})();
