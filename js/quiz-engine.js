/* === QUIZ ENGINE — Soru Motoru + Hata Kartı Sistemi === */

const QuizEngine = {
  currentQuestions: [],
  currentIndex: 0,
  correctCount: 0,
  wrongCount: 0,
  answers: [], // [{questionId, userAnswer, correct, timestamp}]
  topic: '',
  mode: 'quiz', // 'quiz', 'daily', 'mock', 'review'
  onComplete: null,
  _answered: false, // Çift tıklama koruması

  // Quiz başlat
  start(questions, topic, mode = 'quiz', onComplete = null) {
    this.currentQuestions = questions;
    this.currentIndex = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.answers = [];
    this.topic = topic;
    this.mode = mode;
    this.onComplete = onComplete;
    this._answered = false;
    this.renderQuestion();
  },

  // Soru render et
  renderQuestion() {
    const container = document.getElementById('quiz-area');
    if (!container) return;

    const q = this.currentQuestions[this.currentIndex];
    if (!q) {
      this.showResults();
      return;
    }

    const total = this.currentQuestions.length;
    const num = this.currentIndex + 1;
    const progressPct = (num / total) * 100;

    let html = `
      <div class="quiz-header">
        <span class="quiz-counter">Soru ${num} / ${total}</span>
        <span class="quiz-counter">${this.correctCount} dogru</span>
      </div>
      <div class="quiz-progress-mini">
        <div class="quiz-progress-mini-fill" style="width:${progressPct}%"></div>
      </div>
    `;

    // Okuma parçası varsa göster
    if (q.passage) {
      html += `<div class="reading-passage">${q.passage}</div>`;
    }

    html += `
      <div class="question-card fade-in">
        <div class="question-meta">
          <span class="badge badge-topic">${AdaptiveEngine.topicDisplayName(q.topic || this.topic)}</span>
          <span class="badge badge-level">${q.level || 'A2'}</span>
          ${q.subtopic ? `<span class="badge badge-topic">${q.subtopic}</span>` : ''}
        </div>
        <div class="question-stem">${q.stem}</div>
        <div class="options-list">
    `;

    q.options.forEach(opt => {
      html += `
        <button class="option-btn" data-key="${opt.key}" onclick="QuizEngine.answer('${opt.key}')">
          <span class="option-key">${opt.key}</span>
          <span class="option-text">${opt.text}</span>
        </button>
      `;
    });

    html += `
        </div>
      </div>
      <div class="warning-banner">Bos birakma! Yanlis cevap puanini DUSURMUYOR.</div>
    `;

    container.innerHTML = html;
  },

  // Cevap ver
  answer(key) {
    // Çift tıklama koruması
    if (this._answered) return;
    this._answered = true;

    const q = this.currentQuestions[this.currentIndex];
    const isCorrect = key === q.answer;

    // Butonları devre dışı bırak ve renklendir
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.classList.add('disabled');
      const btnKey = btn.dataset.key;
      if (btnKey === q.answer) {
        btn.classList.add('correct');
      }
      if (btnKey === key && !isCorrect) {
        btn.classList.add('wrong');
      }
    });

    // İstatistikleri güncelle
    if (isCorrect) {
      this.correctCount++;
    } else {
      this.wrongCount++;
      // Hatalı sorular defterine ekle
      Storage.addError(q, key);
    }

    // Storage güncelle
    Storage.updateTopicStat(q.topic || this.topic, isCorrect);
    Storage.addToHistory(q.id);
    Storage.updateSessionStats(isCorrect);

    this.answers.push({
      questionId: q.id,
      userAnswer: key,
      correct: isCorrect,
      timestamp: Date.now()
    });

    // Doğruysa kısa bekle, yanlışsa hata kartı göster
    if (isCorrect) {
      setTimeout(() => {
        this.currentIndex++;
        this._answered = false;
        this.renderQuestion();
      }, 800);
    } else {
      this.showErrorCard(q, key);
    }
  },

  // Hata kartı göster
  showErrorCard(question, userAnswer) {
    const userOpt = question.options.find(o => o.key === userAnswer);
    const correctOpt = question.options.find(o => o.key === question.answer);

    const errorHtml = `
      <div class="error-card slide-up" style="margin-top:16px">
        <div class="error-card-header">
          <span class="wrong-answer">Senin cevabin: ${userAnswer}) ${userOpt ? userOpt.text : ''}</span>
          <span style="color:var(--gray-400)">|</span>
          <span class="correct-answer">Dogru: ${question.answer}) ${correctOpt ? correctOpt.text : ''}</span>
        </div>
        <div class="error-card-body">
          <div class="error-section">
            <div class="error-section-title">NEDEN?</div>
            <div class="error-section-content">${question.explanation_tr || 'Aciklama yukleniyor...'}</div>
          </div>
          ${question.rule_tr ? `
          <div class="error-section">
            <div class="error-section-title">KURAL</div>
            <div class="rule-box">${question.rule_tr}</div>
          </div>
          ` : ''}
          ${question.extra_example ? `
          <div class="error-section">
            <div class="error-section-title">ORNEK</div>
            <div class="example-box">${question.extra_example}</div>
          </div>
          ` : ''}
          ${question.tip_tr ? `
          <div class="error-section">
            <div class="error-section-title">IPUCU</div>
            <div class="tip-box">${question.tip_tr}</div>
          </div>
          ` : ''}
        </div>
      </div>
      <button class="btn btn-primary btn-block" onclick="QuizEngine.nextAfterError()" style="margin-top:12px">
        Anladim, Sonraki Soru →
      </button>
    `;

    // Soru kartının altına ekle
    const container = document.getElementById('quiz-area');
    container.insertAdjacentHTML('beforeend', errorHtml);

    // Hata kartına scroll
    const errorCard = container.querySelector('.error-card');
    if (errorCard) errorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  // Hata kartından sonra sonraki soru
  nextAfterError() {
    this.currentIndex++;
    this._answered = false;
    this.renderQuestion();
  },

  // Sonuçları göster
  showResults() {
    const container = document.getElementById('quiz-area');
    if (!container) return;

    const total = this.currentQuestions.length;
    const pct = Math.round((this.correctCount / total) * 100);
    const scoreClass = pct >= 80 ? 'high' : pct >= 50 ? 'medium' : 'low';

    // Adaptif seviye güncelleme (daily-check, mock-exam ve review modlarında yapma)
    const skipAdaptive = ['daily-check', 'mock-exam'].includes(this.topic) || this.mode === 'review';
    const levelResult = skipAdaptive
      ? { levelChanged: false, newLevel: Storage.getLevel(), direction: 'same' }
      : AdaptiveEngine.updateAfterQuiz(this.topic, this.correctCount, total);

    let levelMsg = '';
    if (levelResult.levelChanged) {
      if (levelResult.direction === 'up') {
        levelMsg = `<div class="info-banner">Tebrikler! ${this.topic} konusunda seviyen ${levelResult.newLevel} seviyesine yukseldi!</div>`;
      } else {
        levelMsg = `<div class="warning-banner">${this.topic} konusunda seviyen ${levelResult.newLevel} seviyesine dusuruldu. Endise etme, tekrar calisarak yukseleceksin!</div>`;
      }
    }

    // Motivasyon mesajı seç
    const motivation = this.getMotivation(pct);

    let html = `
      <div class="motivation-card">
        <div class="motivation-emoji">${motivation.emoji}</div>
        <div class="motivation-text">${motivation.text}</div>
        <div class="motivation-sub">${motivation.sub}</div>
      </div>
      <div class="result-card fade-in">
        <div class="result-score ${scoreClass}">${pct}%</div>
        <div class="result-label">${this.correctCount} / ${total} dogru</div>
      </div>
      ${levelMsg}
      <div class="result-card">
        <div class="stat-row">
          <span class="stat-label">Dogru</span>
          <span class="stat-value" style="color:var(--success)">${this.correctCount}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Yanlis</span>
          <span class="stat-value" style="color:var(--danger)">${this.wrongCount}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Basari Orani</span>
          <span class="stat-value">%${pct}</span>
        </div>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary btn-block" onclick="QuizEngine.reviewWrong()">Yanlislari Tekrar Et</button>
        <a href="../index.html" class="btn btn-outline btn-block">Ana Sayfaya Don</a>
      </div>
    `;

    // Yüksek skor confetti efekti
    if (pct >= 80) this.showConfetti();

    container.innerHTML = html;

    // Callback varsa çağır
    if (this.onComplete) {
      this.onComplete({
        correct: this.correctCount,
        wrong: this.wrongCount,
        total,
        pct,
        answers: this.answers,
        topic: this.topic
      });
    }
  },

  // Yanlışları tekrar et
  reviewWrong() {
    const wrongAnswers = this.answers.filter(a => !a.correct);
    const wrongQuestions = wrongAnswers.map(a =>
      this.currentQuestions.find(q => q.id === a.questionId)
    ).filter(Boolean);

    if (wrongQuestions.length === 0) {
      alert('Hic yanlis cevabin yok! Harika!');
      return;
    }

    this.start(wrongQuestions, this.topic, 'review');
  },

  // Motivasyon mesajı seç (skora göre)
  getMotivation(pct) {
    const high = [
      { emoji: '🌸💕', text: 'Guzel kizim sen mukemmelsin!', sub: 'Seni cok seviyorum kucuk kurbam, boyle devam et! 💕' },
      { emoji: '🎉🌸', text: 'BRAVOOOO sevgilim!', sub: 'Iyiki hayatimdasin, her gun daha iyi oluyorsun! 🌸' },
      { emoji: '💪🌸', text: 'Kucuk kurbam harika is cikardin!', sub: 'Bu gidisle sinavi rahat gecersin, sana inaniyorum! 💕' },
      { emoji: '⭐🌸', text: 'Yildizim benim, muhtesemsin!', sub: 'Her dogrunda kalbim sana biraz daha atiyor 💕' },
      { emoji: '🏆🌸', text: 'Sampiyonum benim!', sub: 'Seni cok seviyorum, basaracagini biliyorum! 🌸' },
    ];
    const mid = [
      { emoji: '🌸💪', text: 'Guzel gidiyorsun kucuk kurbam!', sub: 'Biraz daha pratik ve mukemmel olacaksin! Seni seviyorum 💕' },
      { emoji: '🌸📚', text: 'Devam et sevgilim, yaklasiyorsun!', sub: 'Her yanlis seni daha guclu yapiyor, pes etme! 🌸' },
      { emoji: '💕🌸', text: 'Kucuk kurbam, gurur duyuyorum senden!', sub: 'Calistigin icin cok mutluyum, seni cok seviyorum! 💕' },
    ];
    const low = [
      { emoji: '🌸💕', text: 'Endise etme kucuk kurbam!', sub: 'Yanlislar ogrenmenin parcasi, seni her zaman destekliyorum! 💕' },
      { emoji: '🌸🤗', text: 'Her sey iyi olacak sevgilim!', sub: 'Bu konuyu birlikte hallederiz, seni cok seviyorum! 🌸' },
      { emoji: '💪🌸', text: 'Pes etme guzelim, sen basarirsin!', sub: 'Senin icin buradayim, tekrar deneyelim! Opuyorum 💕' },
    ];

    const pool = pct >= 80 ? high : pct >= 50 ? mid : low;
    return pool[Math.floor(Math.random() * pool.length)];
  },

  // Confetti efekti (yüksek skor)
  showConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const emojis = ['🌸', '💕', '⭐', '🎉', '💐', '🌺', '✨', '💖'];
    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.animationDelay = Math.random() * 2 + 's';
      confetti.style.fontSize = (1 + Math.random()) + 'rem';
      container.appendChild(confetti);
    }

    setTimeout(() => container.remove(), 4000);
  },

  // Utility: JSON dosyasını yükle
  async loadQuestions(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`Soru yuklenirken hata: ${path}`, err);
      return [];
    }
  }
};
