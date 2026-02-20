/* === DAILY REPORT — Gunluk Rapor Karti === */

const DailyReport = {
  // Günlük rapor oluştur ve göster
  render(containerId = 'report-area') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const session = Storage.getSessionStats();
    const todayScore = Storage.getTodayScore();
    const dailyScores = Storage.getDailyScores();
    const dayNum = Storage.getDayNumber();
    const progress = Storage.getOverallProgress();
    const weak = AdaptiveEngine.getWeakTopics();
    const strong = AdaptiveEngine.getStrongTopics();
    const suggestion = AdaptiveEngine.getStudySuggestion();

    // Dünkü skor
    const yesterday = dailyScores.length >= 2 ? dailyScores[dailyScores.length - 2] : null;

    const sessionPct = session.solved > 0 ? Math.round((session.correct / session.solved) * 100) : 0;

    let html = `
      <div class="result-card fade-in">
        <div style="font-size:0.85rem;color:var(--gray-500);margin-bottom:8px">GUNLUK RAPOR — ${this.formatDate(Storage.today())}</div>
    `;

    // Günlük test skoru
    if (todayScore) {
      const trend = yesterday ? (todayScore.score > yesterday.score ? '↑' : todayScore.score < yesterday.score ? '↓' : '→') : '';
      html += `
        <div class="stat-row">
          <span class="stat-label">Seviye Testi</span>
          <span class="stat-value">${todayScore.score}/${todayScore.total} ${trend}</span>
        </div>
      `;
      if (yesterday) {
        html += `
          <div class="stat-row">
            <span class="stat-label">Dunku Skor</span>
            <span class="stat-value" style="color:var(--gray-400)">${yesterday.score}/${yesterday.total}</span>
          </div>
        `;
      }
    }

    html += `
        <div class="stat-row">
          <span class="stat-label">Cozulen Soru</span>
          <span class="stat-value">${session.solved}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Dogru Orani</span>
          <span class="stat-value">%${sessionPct}</span>
        </div>
      </div>
    `;

    // Güçlü/Zayıf alanlar
    if (strong.length > 0 || weak.length > 0) {
      html += `<div class="result-card">`;
      if (strong.length > 0) {
        html += `<div class="error-section-title" style="color:var(--success)">GUCLU ALANLAR</div>`;
        strong.slice(0, 3).forEach(s => {
          html += `<div class="stat-row">
            <span class="stat-label">${AdaptiveEngine.topicDisplayName(s.topic)}</span>
            <span class="stat-value" style="color:var(--success)">%${s.accuracy}</span>
          </div>`;
        });
      }
      if (weak.length > 0) {
        html += `<div class="error-section-title" style="color:var(--danger);margin-top:12px">ZAYIF ALANLAR</div>`;
        weak.slice(0, 3).forEach(w => {
          html += `<div class="stat-row">
            <span class="stat-label">${AdaptiveEngine.topicDisplayName(w.topic)}</span>
            <span class="stat-value" style="color:var(--danger)">%${w.accuracy}</span>
          </div>`;
        });
      }
      html += `</div>`;
    }

    // Yarınki öneri
    html += `
      <div class="result-card">
        <div class="error-section-title">YARINKI ONERI</div>
        <div class="error-section-content">${suggestion}</div>
      </div>
    `;

    // Genel ilerleme
    html += `
      <div class="progress-section">
        <div class="progress-header">
          <span>Genel Ilerleme</span>
          <span>%${progress} (Gun ${dayNum}/30)</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${progress}%"></div>
        </div>
      </div>
    `;

    // Günlük skor trendi (son 7 gün)
    if (dailyScores.length >= 2) {
      html += `
        <div class="result-card">
          <div class="error-section-title">SON GUNLER TRENDI</div>
          <div style="display:flex;align-items:flex-end;gap:8px;height:80px;margin-top:12px">
      `;
      const last7 = dailyScores.slice(-7);
      const maxScore = Math.max(...last7.map(s => s.score));
      last7.forEach(s => {
        const height = maxScore > 0 ? (s.score / maxScore) * 60 + 20 : 20;
        const color = s.score >= 8 ? 'var(--success)' : s.score >= 5 ? 'var(--warning)' : 'var(--danger)';
        html += `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center">
            <div style="font-size:0.7rem;font-weight:700;margin-bottom:4px">${s.score}</div>
            <div style="width:100%;height:${height}px;background:${color};border-radius:4px 4px 0 0"></div>
            <div style="font-size:0.6rem;color:var(--gray-400);margin-top:4px">${s.date.slice(5)}</div>
          </div>
        `;
      });
      html += `</div></div>`;
    }

    container.innerHTML = html;
  },

  // Tarih formatla
  formatDate(dateStr) {
    const months = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
      'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
    const d = new Date(dateStr);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
};
