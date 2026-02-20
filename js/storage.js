/* === STORAGE.JS — localStorage Yönetimi === */
/* Tüm kullanıcı verisi burada saklanır ve yönetilir */

const Storage = {
  // === KEYS ===
  KEYS: {
    LEVEL: 'erasmus_level',           // Güncel seviye: A2, B1, B2
    DAILY_SCORES: 'erasmus_daily',     // Günlük test skorları [{date, score, total}]
    TOPIC_STATS: 'erasmus_topics',     // Konu bazlı istatistik {topic: {correct, wrong, level}}
    ERROR_JOURNAL: 'erasmus_errors',   // Hatalı sorular [{...question, userAnswer, date, streak}]
    QUIZ_HISTORY: 'erasmus_history',   // Çözülen soru ID'leri [id1, id2, ...]
    DAILY_DONE: 'erasmus_daily_done',  // Bugün test yapıldı mı? "2026-02-19"
    STUDY_PLAN: 'erasmus_plan',        // Çalışma planı checkbox'ları {day1: true, ...}
    MOCK_RESULTS: 'erasmus_mocks',     // Deneme sınavı sonuçları [{date, score, details}]
    START_DATE: 'erasmus_start',       // Başlangıç tarihi
    SESSION_STATS: 'erasmus_session',  // Bugünkü oturum istatistikleri
  },

  // === GETTERS ===
  get(key, fallback = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch { return fallback; }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  // === LEVEL ===
  getLevel() {
    return this.get(this.KEYS.LEVEL, 'A2');
  },

  setLevel(level) {
    this.set(this.KEYS.LEVEL, level);
  },

  // === DAILY SCORES ===
  getDailyScores() {
    return this.get(this.KEYS.DAILY_SCORES, []);
  },

  addDailyScore(score, total) {
    const scores = this.getDailyScores();
    scores.push({ date: this.today(), score, total });
    this.set(this.KEYS.DAILY_SCORES, scores);
  },

  getTodayScore() {
    const scores = this.getDailyScores();
    return scores.find(s => s.date === this.today());
  },

  isDailyDone() {
    return this.get(this.KEYS.DAILY_DONE) === this.today();
  },

  setDailyDone() {
    this.set(this.KEYS.DAILY_DONE, this.today());
  },

  // === TOPIC STATS ===
  getTopicStats() {
    return this.get(this.KEYS.TOPIC_STATS, {});
  },

  getTopicStat(topic) {
    const stats = this.getTopicStats();
    return stats[topic] || { correct: 0, wrong: 0, level: 'A2', total: 0 };
  },

  updateTopicStat(topic, isCorrect) {
    const stats = this.getTopicStats();
    if (!stats[topic]) {
      stats[topic] = { correct: 0, wrong: 0, level: 'A2', total: 0 };
    }
    stats[topic].total++;
    if (isCorrect) {
      stats[topic].correct++;
    } else {
      stats[topic].wrong++;
    }
    // Adaptif seviye ayarla
    const ratio = stats[topic].correct / stats[topic].total;
    if (stats[topic].total >= 5) {
      if (ratio >= 0.8) {
        stats[topic].level = this.levelUp(stats[topic].level);
      } else if (ratio < 0.5) {
        stats[topic].level = this.levelDown(stats[topic].level);
      }
    }
    this.set(this.KEYS.TOPIC_STATS, stats);
    return stats[topic];
  },

  getTopicAccuracy(topic) {
    const stat = this.getTopicStat(topic);
    if (stat.total === 0) return 0;
    return Math.round((stat.correct / stat.total) * 100);
  },

  // === ERROR JOURNAL ===
  getErrors() {
    return this.get(this.KEYS.ERROR_JOURNAL, []);
  },

  addError(question, userAnswer) {
    const errors = this.getErrors();
    // Aynı soru zaten varsa güncelle
    const existing = errors.findIndex(e => e.id === question.id);
    if (existing >= 0) {
      errors[existing].streak = 0; // Reset streak
      errors[existing].date = this.today();
      errors[existing].userAnswer = userAnswer;
    } else {
      errors.push({
        ...question,
        userAnswer,
        date: this.today(),
        streak: 0, // 3 olunca "mastered"
      });
    }
    this.set(this.KEYS.ERROR_JOURNAL, errors);
  },

  markErrorCorrect(questionId) {
    const errors = this.getErrors();
    const idx = errors.findIndex(e => e.id === questionId);
    if (idx >= 0) {
      errors[idx].streak = (errors[idx].streak || 0) + 1;
      this.set(this.KEYS.ERROR_JOURNAL, errors);
    }
  },

  removeError(questionId) {
    const errors = this.getErrors().filter(e => e.id !== questionId);
    this.set(this.KEYS.ERROR_JOURNAL, errors);
  },

  getActiveErrors() {
    return this.getErrors().filter(e => (e.streak || 0) < 3);
  },

  getMasteredErrors() {
    return this.getErrors().filter(e => (e.streak || 0) >= 3);
  },

  // === QUIZ HISTORY ===
  getQuizHistory() {
    return this.get(this.KEYS.QUIZ_HISTORY, []);
  },

  addToHistory(questionId) {
    const history = this.getQuizHistory();
    if (!history.includes(questionId)) {
      history.push(questionId);
      this.set(this.KEYS.QUIZ_HISTORY, history);
    }
  },

  // === MOCK EXAM RESULTS ===
  getMockResults() {
    return this.get(this.KEYS.MOCK_RESULTS, []);
  },

  addMockResult(result) {
    const results = this.getMockResults();
    results.push({ ...result, date: this.today() });
    this.set(this.KEYS.MOCK_RESULTS, results);
  },

  // === STUDY PLAN ===
  getStudyPlan() {
    return this.get(this.KEYS.STUDY_PLAN, {});
  },

  togglePlanDay(day) {
    const plan = this.getStudyPlan();
    plan[day] = !plan[day];
    this.set(this.KEYS.STUDY_PLAN, plan);
    return plan[day];
  },

  // === SESSION STATS ===
  getSessionStats() {
    const stats = this.get(this.KEYS.SESSION_STATS, { date: this.today(), solved: 0, correct: 0 });
    if (stats.date !== this.today()) {
      return { date: this.today(), solved: 0, correct: 0 };
    }
    return stats;
  },

  updateSessionStats(isCorrect) {
    const stats = this.getSessionStats();
    stats.solved++;
    if (isCorrect) stats.correct++;
    stats.date = this.today();
    this.set(this.KEYS.SESSION_STATS, stats);
    return stats;
  },

  // === START DATE ===
  getStartDate() {
    let start = this.get(this.KEYS.START_DATE);
    if (!start) {
      start = this.today();
      this.set(this.KEYS.START_DATE, start);
    }
    return start;
  },

  getDayNumber() {
    const start = new Date(this.getStartDate());
    const now = new Date(this.today());
    return Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  },

  // === HELPERS ===
  today() {
    return new Date().toISOString().split('T')[0];
  },

  levelUp(level) {
    if (level === 'A2') return 'B1';
    if (level === 'B1') return 'B2';
    return 'B2';
  },

  levelDown(level) {
    if (level === 'B2') return 'B1';
    if (level === 'B1') return 'A2';
    return 'A2';
  },

  // Genel ilerleme yüzdesi
  getOverallProgress() {
    const history = this.getQuizHistory();
    const totalTarget = 1070; // Toplam soru hedefi
    return Math.min(Math.round((history.length / totalTarget) * 100), 100);
  },

  // Tüm veriyi temizle (development)
  clearAll() {
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
  }
};
