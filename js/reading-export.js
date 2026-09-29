(function () {
  window.attachReadingExport = (getReading, loadImage) => {
    const dialog = document.querySelector('#save-dialog');
    const preview = document.querySelector('#save-preview');
    const status = document.querySelector('#save-status');
    const download = document.querySelector('#download-reading');
    let imageUrl = null;
    let imageAdvice = '';
    let generation = 0;

    function wrapText(ctx, text, width) {
      const lines = [];
      let line = '';
      for (const char of text) {
        if (char === '\n') { lines.push(line); line = ''; continue; }
        if (line && ctx.measureText(line + char).width > width) { lines.push(line); line = char; }
        else line += char;
      }
      if (line) lines.push(line);
      return lines;
    }

    async function createImage(reading) {
      const images = await Promise.all(reading.cards.map(item => loadImage(item.card.image)));
      await document.fonts.load('24px Iansui');
      const columns = Math.min(3, reading.cards.length);
      const padding = 36;
      const gap = 28;
      const cardWidth = 340;
      const width = padding * 2 + columns * cardWidth + (columns - 1) * gap;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = '24px Iansui';
      const questionLines = wrapText(ctx, reading.question ? `問題：${reading.question}` : '', width - padding * 2);
      const headerHeight = 140 + questionLines.length * 34;
      const adviceLines = wrapText(ctx, reading.advice || '', width - padding * 2);
      const adviceHeight = adviceLines.length ? 80 + adviceLines.length * 34 : 0;
      const cards = reading.cards.map((item, index) => ({
        ...item,
        image: images[index],
        imageHeight: cardWidth * images[index].naturalHeight / images[index].naturalWidth,
        meaning: wrapText(ctx, item.orientation === 'reversed' ? item.card.reversed : item.card.upright, cardWidth),
        positionLines: wrapText(ctx, `${index + 1} · ${item.position}`, cardWidth),
        titleLines: wrapText(ctx, `${item.card.name}｜${item.orientation === 'reversed' ? '逆位' : '正位'}`, cardWidth)
      }));
      const rows = [];
      for (let i = 0; i < cards.length; i += columns) {
        const row = cards.slice(i, i + columns);
        rows.push({ cards: row, height: Math.max(...row.map(card => card.imageHeight + 34 * (card.meaning.length + card.positionLines.length + card.titleLines.length) + 64)) });
      }
      canvas.width = width;
      canvas.height = Math.ceil(headerHeight + rows.reduce((sum, row) => sum + row.height + gap, 0) + adviceHeight + padding);
      ctx.fillStyle = '#0b1022';
      ctx.fillRect(0, 0, width, canvas.height);
      ctx.strokeStyle = '#92794a';
      ctx.lineWidth = 2;
      ctx.strokeRect(12, 12, width - 24, canvas.height - 24);
      ctx.fillStyle = '#eed49a';
      ctx.font = '30px Iansui';
      ctx.fillText('BITEtheABYSS TAROT', padding, 54);
      ctx.font = '24px Iansui';
      ctx.fillStyle = '#f7f0dd';
      ctx.fillText(reading.spread, padding, 96);
      questionLines.forEach((line, i) => ctx.fillText(line, padding, 134 + i * 34));
      let top = headerHeight;
      for (const row of rows) {
        row.cards.forEach((card, column) => {
          const left = padding + column * (cardWidth + gap);
          ctx.save();
          ctx.translate(left + cardWidth / 2, top + card.imageHeight / 2);
          if (card.orientation === 'reversed') ctx.rotate(Math.PI);
          ctx.beginPath();
          ctx.roundRect(-cardWidth / 2, -card.imageHeight / 2, cardWidth, card.imageHeight, 12);
          ctx.clip();
          ctx.drawImage(card.image, -cardWidth / 2, -card.imageHeight / 2, cardWidth, card.imageHeight);
          ctx.restore();
          ctx.strokeStyle = '#bca26a';
          ctx.beginPath();
          ctx.roundRect(left, top, cardWidth, card.imageHeight, 12);
          ctx.stroke();
          let textY = top + card.imageHeight + 34;
          ctx.font = '24px Iansui';
          for (const [lines, color] of [[card.positionLines, '#d9b96f'], [card.titleLines, '#f7f0dd'], [card.meaning, '#c8c4bd']]) {
            ctx.fillStyle = color;
            for (const line of lines) { ctx.fillText(line, left, textY); textY += 34; }
            textY += 8;
          }
        });
        top += row.height + gap;
      }
      if (adviceLines.length) {
        ctx.strokeStyle = '#92794a';
        ctx.beginPath();
        ctx.moveTo(padding, top);
        ctx.lineTo(width - padding, top);
        ctx.stroke();
        ctx.font = '24px Iansui';
        ctx.fillStyle = '#eed49a';
        ctx.fillText(`${cards.length + 1}. 建議`, padding, top + 40);
        ctx.fillStyle = '#f7f0dd';
        adviceLines.forEach((line, index) => ctx.fillText(line, padding, top + 80 + index * 34));
      }
      return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('無法產生圖片，請再試一次。')), 'image/png'));
    }

    async function refreshPreview() {
      const reading = { ...getReading(), advice: window.getTarotAdvice?.() || '' };
      if (imageUrl && imageAdvice === reading.advice) return;
      const current = ++generation;
      preview.hidden = true;
      download.disabled = true;
      status.textContent = '正在準備圖片⋯';
      try {
        const blob = await createImage(reading);
        if (current !== generation || !dialog.open) return;
        if (imageUrl) URL.revokeObjectURL(imageUrl);
        imageUrl = URL.createObjectURL(blob);
        imageAdvice = reading.advice;
        preview.src = imageUrl;
        preview.hidden = false;
        download.disabled = false;
        status.textContent = reading.advice
          ? '完整保留本次牌面、正逆位、簡短牌義與綜合建議。'
          : '完整保留本次牌面、正逆位與簡短牌義。';
      } catch (_) {
        if (current === generation) status.textContent = '圖片準備失敗，請取消後再試一次。';
      }
    }
    document.querySelector('#save-reading').addEventListener('click', () => {
      dialog.showModal();
      refreshPreview();
    });
    window.addEventListener('tarot-advice-ready', () => {
      if (dialog.open) refreshPreview();
    });
    document.querySelector('#cancel-save').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { generation += 1; });
    download.addEventListener('click', () => {
      if (!imageUrl) return;
      const anchor = document.createElement('a');
      anchor.href = imageUrl;
      anchor.download = `BITEtheABYSS-TAROT-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    });
    window.addEventListener('pagehide', () => { if (imageUrl) URL.revokeObjectURL(imageUrl); imageUrl = null; });
  };
})();
