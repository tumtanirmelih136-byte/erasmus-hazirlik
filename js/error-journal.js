/* === ERROR JOURNAL — Hatali Sorular Defteri === */

const ErrorJournal = {
  // Hatalı soruları listele
  render(containerId = 'journal-area') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const activeErrors = Storage.getActiveErrors();
    const masteredErrors = Storage.getMasteredErrors();

    if (activeErrors.length === 0 && masteredErrors.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <p>Henuz hatali sorun yok. Quiz cozdukce yanlislar burada birikecek.</p>
        </div>
      `;
      return;
    }

    let html = '';

    // Aktif hatalar
    if (activeErrors.length > 0) {
      html += `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="font-size:1rem;color:var(--danger)">Hala Zayif (${activeErrors.length} soru)</h3>
          <button class="btn btn-danger" onclick="ErrorJournal.reviewActive()" style="font-size:0.85rem;padding:8px 16px">
            Tekrar Et
          </button>
        </div>
      `;

      activeErrors.forEach(err => {
        const userOpt = err.options ? err.options.find(o => o.key === err.userAnswer) : null;
        const correctOpt = err.options ? err.options.find(o => o.key === err.answer) : null;
        html += `
          <div class="journal-item fade-in">
            <div class="journal-date">${err.date} | ${AdaptiveEngine.topicDisplayName(err.topic)} | ${err.level}</div>
            <div class="journal-question">${this.truncate(err.stem, 120)}</div>
            <div class="journal-answers">
              <span class="journal-wrong">Senin: ${err.userAnswer}) ${userOpt ? this.truncate(userOpt.text, 30) : ''}</span>
              <span class="journal-correct">Dogru: ${err.answer}) ${correctOpt ? this.truncate(correctOpt.text, 30) : ''}</span>
            </div>
            <div class="journal-streak">Dogru serisi: ${err.streak || 0}/3</div>
          </div>
        `;
      });
    }

    // Ustalasilmis hatalar
    if (masteredErrors.length > 0) {
      html += `
        <div style="margin-top:24px;margin-bottom:12px">
          <h3 style="font-size:1rem;color:var(--success)">Artik Guclu (${masteredErrors.length} soru)</h3>
        </div>
      `;

      masteredErrors.forEach(err => {
        html += `
          <div class="journal-item mastered">
            <div class="journal-date">${err.date} | ${AdaptiveEngine.topicDisplayName(err.topic)}</div>
            <div class="journal-question">${this.truncate(err.stem, 120)}</div>
            <div class="journal-streak" style="color:var(--success)">3/3 dogru — Ustalasildi!</div>
          </div>
        `;
      });
    }

    container.innerHTML = html;
  },

  // Aktif hataları tekrar et
  reviewActive() {
    const errors = Storage.getActiveErrors();
    if (errors.length === 0) {
      alert('Tekrar edilecek soru yok!');
      return;
    }

    // Quiz sayfasında hatalı soruları çöz
    const container = document.getElementById('journal-area');
    if (!container) return;

    container.innerHTML = `<div id="quiz-area"></div>`;

    // Error journal review modunda her doğru cevapta streak artır
    const reviewQuestions = AdaptiveEngine.shuffle(errors);
    QuizEngine.start(reviewQuestions, 'review', 'review', (result) => {
      // Doğru yapılan hataların streak'ini artır
      result.answers.forEach(a => {
        if (a.correct) {
          Storage.markErrorCorrect(a.questionId);
        }
      });
    });
  },

  // Konu bazlı hata sayısı
  getErrorCountByTopic() {
    const errors = Storage.getActiveErrors();
    const counts = {};
    errors.forEach(e => {
      const topic = e.topic || 'diger';
      counts[topic] = (counts[topic] || 0) + 1;
    });
    return counts;
  },

  // Utility
  truncate(text, len) {
    if (!text) return '';
    return text.length > len ? text.substring(0, len) + '...' : text;
  }
};
