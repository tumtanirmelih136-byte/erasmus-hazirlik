/* === APP.JS — Ana Uygulama + Router === */

const App = {
  // Sayfa başlatma
  init() {
    // Start date kaydet
    Storage.getStartDate();

    // Dashboard'daysa dashboard'u render et
    if (this.isPage('index.html') || window.location.pathname.endsWith('/erasmus/') || window.location.pathname === '/') {
      this.renderDashboard();
    }
  },

  // Hangi sayfadayız?
  isPage(name) {
    return window.location.pathname.includes(name);
  },

  // Dashboard render
  renderDashboard() {
    const level = Storage.getLevel();
    const dayNum = Storage.getDayNumber();
    const progress = Storage.getOverallProgress();
    const isDailyDone = Storage.isDailyDone();
    const session = Storage.getSessionStats();
    const history = Storage.getQuizHistory();
    const activeErrors = Storage.getActiveErrors();

    // Level banner
    const levelBanner = document.getElementById('level-banner');
    if (levelBanner) {
      levelBanner.innerHTML = `
        <div class="level-label">Guncel Seviyen</div>
        <div class="level-value">${level}</div>
        <div class="level-desc">Gun ${dayNum} / 30 | ${history.length} soru cozuldu</div>
      `;
    }

    // Daily test CTA
    const dailyCta = document.getElementById('daily-cta');
    if (dailyCta) {
      if (isDailyDone) {
        const todayScore = Storage.getTodayScore();
        dailyCta.className = 'daily-test-cta daily-test-done';
        dailyCta.innerHTML = `
          <h3>Bugunun Testi Tamamlandi!</h3>
          <p>Skor: ${todayScore ? todayScore.score + '/' + todayScore.total : '-'}</p>
        `;
        dailyCta.onclick = null;
      } else {
        dailyCta.className = 'daily-test-cta';
        dailyCta.innerHTML = `
          <h3>Gunluk Seviye Testi</h3>
          <p>10 soru ile bugunun seviyeni belirle</p>
        `;
        dailyCta.onclick = () => { window.location.href = 'pages/daily-check.html'; };
      }
    }

    // Section cards progress
    this.updateSectionProgress('grammar', 480);
    this.updateSectionProgress('vocabulary', 200);
    this.updateSectionProgress('reading', 80);
    this.updateSectionProgress('dialogue', 50);
    this.updateSectionProgress('situational', 50);

    // Overall progress
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    if (progressFill) progressFill.style.width = progress + '%';
    if (progressText) progressText.textContent = `%${progress}`;

    // Session stats
    const sessionEl = document.getElementById('session-stats');
    if (sessionEl) {
      sessionEl.innerHTML = `
        Bugun: ${session.solved} soru cozuldu | %${session.solved > 0 ? Math.round((session.correct / session.solved) * 100) : 0} dogru
      `;
    }

    // Error count badge
    const errorBadge = document.getElementById('error-count');
    if (errorBadge) {
      errorBadge.textContent = activeErrors.length > 0 ? activeErrors.length : '';
    }
  },

  // Grammar konu prefix'leri (soru ID'leri bu prefix'lerle başlar)
  GRAMMAR_PREFIXES: ['tenses-','conditionals-','passive-','modals-','relative-clauses-','reported-speech-','connectors-','gerunds-infinitives-','articles-','prepositions-','phrasal-verbs-','comparatives-','quantifiers-','word-formation-','question-tags-','causatives-'],

  // Section progress güncelle
  updateSectionProgress(section, totalQuestions) {
    const history = Storage.getQuizHistory();
    const sectionQuestions = history.filter(id => {
      if (section === 'grammar') return this.GRAMMAR_PREFIXES.some(p => id.startsWith(p));
      if (section === 'vocabulary') return id.startsWith('vocab-');
      if (section === 'situational') return id.startsWith('sit-');
      if (section === 'reading') return id.startsWith('reading-') || id.startsWith('irr-');
      if (section === 'dialogue') return id.startsWith('dialogue-');
      return false;
    });
    const pct = Math.min(Math.round((sectionQuestions.length / totalQuestions) * 100), 100);
    const el = document.getElementById(`progress-${section}`);
    if (el) el.style.width = pct + '%';
  },

  // URL parametresi al
  getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }
};

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => App.init());
