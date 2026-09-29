(function () {
  function selectDeck(cards, majorOnly) {
    return majorOnly === true ? cards.filter(card => card.suit === 'major') : [...cards];
  }

  function fanLayout(width, height, size, deckCount) {
    const count = Math.min(deckCount, width < 620 ? 39 : 57);
    const rowCount = 3;
    const cards = [];
    const halfSpan = (width - Math.hypot(size.w, size.h) - 24) / 2;
    const rise = Math.min(34, width * .075);
    const rowGap = size.h * .64;
    const baseY = height - 24 - Math.hypot(size.w, size.h) / 2 - rise - (rowCount - 1) * rowGap;
    for (let row = 0; row < rowCount; row += 1) {
      const perRow = Math.floor(count / rowCount) + (row < count % rowCount ? 1 : 0);
      for (let column = 0; column < perRow; column += 1) {
        const t = perRow === 1 ? 0 : column / (perRow - 1) * 2 - 1;
        cards.push({
          x: width / 2 + halfSpan * t,
          y: baseY + row * rowGap + rise * t * t,
          angle: Math.atan(2 * rise * t / halfSpan),
          w: size.w, h: size.h
        });
      }
    }
    return cards;
  }

  function hitTest(cards, x, y, selected) {
    // Last drawn is on top: select the visible card, never a covered card below it.
    for (let index = cards.length - 1; index >= 0; index -= 1) {
      if (selected.has(index)) continue;
      const card = cards[index];
      const dx = x - card.x, dy = y - card.y;
      const localX = dx * Math.cos(card.angle) + dy * Math.sin(card.angle);
      const localY = -dx * Math.sin(card.angle) + dy * Math.cos(card.angle);
      if (Math.abs(localX) <= card.w / 2 && Math.abs(localY) <= card.h / 2) return index;
    }
    return -1;
  }

  window.TarotDraw = { selectDeck, fanLayout, hitTest };
})();
