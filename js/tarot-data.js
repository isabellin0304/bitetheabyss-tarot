(function () {
  const major = [
    ['愚者', 'The Fool', '新的開始・信任・自由', '衝動・逃避・準備不足', '✦'],
    ['魔術師', 'The Magician', '行動力・資源・創造', '分心・操控・才能未用', 'Ⅰ'],
    ['女祭司', 'The High Priestess', '直覺・沉靜・內在知識', '忽略直覺・封閉・隱情', '☾'],
    ['皇后', 'The Empress', '滋養・豐盛・感受力', '過度付出・停滯・自我忽略', '♀'],
    ['皇帝', 'The Emperor', '秩序・界線・承擔', '僵化・控制・權威衝突', '♜'],
    ['教皇', 'The Hierophant', '傳承・學習・共同信念', '挑戰慣例・個人道路・教條', '♝'],
    ['戀人', 'The Lovers', '連結・選擇・價值一致', '失衡・猶疑・價值衝突', 'Ⅵ'],
    ['戰車', 'The Chariot', '意志・推進・掌握方向', '失控・阻力・目標分裂', '♞'],
    ['力量', 'Strength', '溫柔的勇氣・耐心・自持', '自我懷疑・壓抑・耗竭', '∞'],
    ['隱者', 'The Hermit', '獨處・尋索・內在指引', '孤立・迴避・拒絕求助', '☼'],
    ['命運之輪', 'Wheel of Fortune', '轉機・循環・時機', '延宕・抗拒變化・重複模式', '◎'],
    ['正義', 'Justice', '衡量・責任・清楚決定', '偏見・失衡・逃避後果', '⚖'],
    ['吊人', 'The Hanged Man', '暫停・換位思考・放下', '徒勞等待・拖延・執著', '▽'],
    ['死神', 'Death', '結束・轉化・釋放', '抗拒結束・停滯・留戀', '✧'],
    ['節制', 'Temperance', '調和・節奏・整合', '失調・過度・急於求成', '⚗'],
    ['惡魔', 'The Devil', '慾望・束縛・看見陰影', '鬆綁・覺察・重拾選擇', '♄'],
    ['高塔', 'The Tower', '真相揭露・劇變・重建', '延遲改變・內在動盪・恐懼', 'ϟ'],
    ['星星', 'The Star', '希望・療癒・清明', '失去信心・疏離・需要休息', '✶'],
    ['月亮', 'The Moon', '夢境・不確定・深層感受', '迷霧漸散・焦慮・自我欺瞞', '☽'],
    ['太陽', 'The Sun', '喜悅・生命力・坦率', '短暫陰霾・過度樂觀・延遲', '☀'],
    ['審判', 'Judgement', '召喚・覺醒・回顧整合', '自我否定・拒絕回應・反覆', '✺'],
    ['世界', 'The World', '完成・整合・新的層次', '尚未收尾・停在門檻・延遲', '◉']
  ].map((card, index) => ({
    id: `major-${String(index).padStart(2, '0')}`,
    number: index,
    suit: 'major',
    name: card[0],
    english: card[1],
    upright: card[2],
    reversed: card[3],
    symbol: card[4],
    image: `assets/cards/major-${String(index).padStart(2, '0')}.svg`
  }));

  const suits = {
    wands: { zh: '權杖', en: 'Wands', domain: '行動・熱情・意志', shadow: '耗竭・躁進・行動受阻', symbol: '♢' },
    cups: { zh: '聖杯', en: 'Cups', domain: '情感・關係・直覺', shadow: '情緒失衡・逃避・關係受阻', symbol: '▽' },
    swords: { zh: '寶劍', en: 'Swords', domain: '思考・溝通・抉擇', shadow: '焦慮・衝突・思緒受困', symbol: '†' },
    pentacles: { zh: '錢幣', en: 'Pentacles', domain: '現實・資源・身體', shadow: '匱乏感・停滯・資源失衡', symbol: '⬡' }
  };
  const ranks = [
    { id: 'ace', zh: '王牌', en: 'Ace', light: '種子・機會・純粹潛能', shade: '機會延遲・能量尚未成形' },
    { id: 'two', zh: '二', en: 'Two', light: '平衡・選擇・兩端協調', shade: '猶疑・失衡・資訊不足' },
    { id: 'three', zh: '三', en: 'Three', light: '發展・合作・初步成果', shade: '協作困難・方向分散' },
    { id: 'four', zh: '四', en: 'Four', light: '穩定・休整・建立基礎', shade: '僵持・封閉・需要流動' },
    { id: 'five', zh: '五', en: 'Five', light: '摩擦・考驗・重新定位', shade: '衝突延續・避免面對' },
    { id: 'six', zh: '六', en: 'Six', light: '調整・過渡・互相支持', shade: '困在過去・給受失衡' },
    { id: 'seven', zh: '七', en: 'Seven', light: '評估・策略・守住立場', shade: '自我欺瞞・策略失準' },
    { id: 'eight', zh: '八', en: 'Eight', light: '推進・專注・熟練累積', shade: '停滯・重複勞動・失焦' },
    { id: 'nine', zh: '九', en: 'Nine', light: '接近完成・韌性・個人成熟', shade: '疲憊・過度防備・難以滿足' },
    { id: 'ten', zh: '十', en: 'Ten', light: '完成・承擔・週期成果', shade: '負荷過重・結束延遲' },
    { id: 'page', zh: '侍者', en: 'Page', light: '好奇・訊息・學習起點', shade: '不成熟・消息延誤・欠缺準備' },
    { id: 'knight', zh: '騎士', en: 'Knight', light: '追求・移動・投入', shade: '躁進・方向偏離・反覆' },
    { id: 'queen', zh: '皇后', en: 'Queen', light: '內在掌握・成熟感受・滋養', shade: '內耗・界線模糊・過度承擔' },
    { id: 'king', zh: '國王', en: 'King', light: '外在掌握・責任・穩定領導', shade: '控制・固執・權力失衡' }
  ];

  const minor = Object.entries(suits).flatMap(([suitId, suit]) => ranks.map((rank, index) => ({
    id: `${suitId}-${rank.id}`,
    number: index + 1,
    suit: suitId,
    name: `${suit.zh}${rank.zh}`,
    english: `${rank.en} of ${suit.en}`,
    upright: `${rank.light}・${suit.domain}`,
    reversed: `${rank.shade}・${suit.shadow}`,
    symbol: suit.symbol,
    image: `assets/cards/${suitId}-${rank.id}.svg`
  })));

  // Extra physical cards have distinct IDs even when their titles match.
  const extras = [
    {
      id: 'extra-tower-revival', number: 16, suit: 'major',
      name: '塔（復甦）', english: 'The Tower (Reborn)', symbol: 'ϟ',
      upright: '崩解後重生・真相揭露・重建基礎',
      reversed: '抗拒轉變・重建受阻・舊模式回返',
      meanings: {
        upright: '承接高塔的劇變與真相揭露：原有結構崩解，讓失去根基的信念與模式被看見。復甦的重點在於毀滅之後，承認改變、清理殘局，從更真實的基礎重新建立生活與秩序。',
        reversed: '崩解帶來的改變仍待消化，可能因留戀舊結構、害怕再次失去，讓重建停滯或重複原有模式。復甦需要時間，也需要正視已經揭露的問題，逐步建立能承受改變的新基礎。'
      },
      image: 'assets/cards/extra-tower-revival.svg'
    },
    { ...major[17], id: 'extra-star', image: 'assets/cards/extra-star.svg' }
  ];
  window.TAROT_CARDS = [...major, ...minor, ...extras];
  window.TAROT_CARDS.forEach(card => { card.image = window.TAROT_ART[card.id]; });
  window.TAROT_BACK = window.TAROT_ART.back;
  window.SPREADS = {
    single: { name: '單張指引', positions: ['此刻的指引'] },
    three: { name: '三張時間流', positions: ['過去', '現在', '未來'], mindsetPosition: '此刻的內在心態' },
    relationship: { name: '關係牌陣', positions: ['你的心態', '對方心態', '關係核心', '目前阻力', '下一步走向'] },
    decision: { name: '選擇牌陣', positions: ['現況核心', '路徑 A 的動力', '路徑 A 的可能結果', '路徑 B 的動力', '路徑 B 的可能結果'], mindsetPosition: '你真正重視的事' },
    celtic: { name: '塞爾特十字', positions: ['現況核心', '交叉阻力', '意識目標', '內在根源', '近期過去', '近期未來', '你的心態', '外在環境', '希望與擔憂', '可能走向'] },
    'body-mind-spirit': { name: '身心靈', positions: ['身體狀態', '思緒焦點', '內在需要'] },
    elements: { name: '四元素', positions: ['火・行動與動力', '水・情感與連結', '風・思考與溝通', '土・資源與落實'] },
    creative: { name: '創作指引', positions: ['創作核心', '靈感來源', '可用資源', '目前阻力', '下一步行動'] }
  };
  Object.values(window.SPREADS).forEach(spread => {
    if (spread.positions.length >= 3 && !spread.mindsetPosition) spread.mindsetPosition = '此刻的內在心態';
  });
})();
