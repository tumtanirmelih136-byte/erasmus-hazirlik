/* === TEACH ENGINE — Konu Ogretme Sistemi (3 Asamali) === */
/* Asama 1: Kural Anlatimi, Asama 2: Orneklerle Pekistirme, Asama 3: Pratik Quiz */

const TeachEngine = {
  currentTeaching: null,
  currentPhase: 1, // 1=kural, 2=ornekler, 3=quiz

  // Ogretim verisi yukle ve baslat
  async startTeaching(topic, containerId = 'teach-area') {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const res = await fetch(`../data/teachings/${topic}-teach.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.currentTeaching = await res.json();
      this.currentPhase = 1;
      this.renderPhase1(container);
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div><p>Ogretim icerigi yukleniyor...</p></div>`;
      console.error('Teaching load error:', err);
    }
  },

  // Asama 1: Kural Anlatimi
  renderPhase1(container) {
    const t = this.currentTeaching;
    if (!t) return;

    let html = `
      <div class="teach-card slide-up">
        <div class="teach-title">${t.title}</div>
        <div class="teach-subtitle">Asama 1/3 — Kural Anlatimi</div>

        <div class="error-section">
          <div class="error-section-title">NE?</div>
          <div class="error-section-content">${t.description_tr}</div>
        </div>

        <div class="teach-formula">${t.formula}</div>
    `;

    if (t.signals && t.signals.length > 0) {
      html += `
        <div class="error-section">
          <div class="error-section-title">SINYAL KELIMELER</div>
          <div class="teach-signals">
            ${t.signals.map(s => `<span class="signal-tag">${s}</span>`).join('')}
          </div>
        </div>
      `;
    }

    if (t.key_rules) {
      html += `<div class="error-section">
        <div class="error-section-title">TEMEL KURALLAR</div>`;
      t.key_rules.forEach(rule => {
        html += `<div class="rule-box" style="margin-bottom:8px">${rule}</div>`;
      });
      html += `</div>`;
    }

    if (t.turkish_logic) {
      html += `
        <div class="error-section">
          <div class="error-section-title">TURKCE MANTIK</div>
          <div class="tip-box">${t.turkish_logic}</div>
        </div>
      `;
    }

    html += `
      </div>
      <button class="btn btn-primary btn-block btn-lg" onclick="TeachEngine.goPhase2()">
        Anladim, Orneklere Gec →
      </button>
    `;

    container.innerHTML = html;
  },

  // Asama 2: Orneklerle Pekistirme
  goPhase2() {
    this.currentPhase = 2;
    const container = document.getElementById('teach-area');
    if (!container) return;
    this.renderPhase2(container);
  },

  renderPhase2(container) {
    const t = this.currentTeaching;
    if (!t || !t.examples) return;

    let html = `
      <div class="teach-card slide-up">
        <div class="teach-title">${t.title}</div>
        <div class="teach-subtitle">Asama 2/3 — Orneklerle Pekistirme</div>
    `;

    t.examples.forEach((ex, i) => {
      html += `
        <div class="teach-example">
          <div class="en">${i + 1}. ${ex.en}</div>
          <div class="tr">${ex.tr}</div>
          ${ex.why ? `<div class="why">${ex.why}</div>` : ''}
        </div>
      `;
    });

    html += `</div>`;

    // Ipuclari varsa
    if (t.tips && t.tips.length > 0) {
      html += `<div class="teach-card slide-up">
        <div class="error-section-title">IPUCLARI</div>`;
      t.tips.forEach(tip => {
        html += `<div class="tip-box" style="margin-bottom:8px">${tip}</div>`;
      });
      html += `</div>`;
    }

    html += `
      <button class="btn btn-success btn-block btn-lg" onclick="TeachEngine.goPhase3()">
        Hazırim, Quiz'e Basla →
      </button>
    `;

    container.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // Asama 3: Quiz (QuizEngine'e devret)
  async goPhase3() {
    this.currentPhase = 3;
    const container = document.getElementById('teach-area');
    if (!container) return;

    const t = this.currentTeaching;
    if (!t || !t.topic) return;

    // Ilgili soruları yükle
    try {
      const res = await fetch(`../data/grammar/${t.topic}.json`);
      const allQuestions = await res.json();
      const level = AdaptiveEngine.getTopicLevel(t.topic);
      const questions = AdaptiveEngine.selectQuestions(allQuestions, t.topic, 10);

      container.innerHTML = `
        <div style="margin-bottom:12px">
          <span class="badge badge-topic">${t.title}</span>
          <span class="badge badge-level">${level}</span>
          <span style="font-size:0.85rem;color:var(--gray-500);margin-left:8px">Asama 3/3 — Pratik Quiz</span>
        </div>
        <div id="quiz-area"></div>
      `;

      QuizEngine.start(questions, t.topic, 'quiz');
    } catch (err) {
      container.innerHTML = `<div class="warning-banner">Sorular yuklenirken hata olustu.</div>`;
      console.error(err);
    }
  },

  // Ögretim kartını mini formatta göster (hata kartı içinde kullanım için)
  renderMiniTeach(topic) {
    // teaching verisini senkron olarak kullanmak yerine basit bir link döner
    return `<a href="grammar.html?topic=${topic}&teach=1" class="btn btn-outline" style="margin-top:8px;font-size:0.85rem">Bu Konuyu Ogren →</a>`;
  }
};
