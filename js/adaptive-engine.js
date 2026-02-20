/* === ADAPTIVE ENGINE — Adaptif Zorluk Motoru === */
/* Kullanıcının performansına göre zorluk seviyesini ayarlar */

const AdaptiveEngine = {
  // Genel seviye belirleme (günlük test sonucuna göre)
  determineLevel(score, total) {
    const ratio = score / total;
    if (ratio >= 0.8) return 'B2';
    if (ratio >= 0.5) return 'B1';
    return 'A2';
  },

  // Konu bazlı seviye al
  getTopicLevel(topic) {
    const stat = Storage.getTopicStat(topic);
    return stat.level || Storage.getLevel();
  },

  // Soruları seviyeye göre filtrele
  filterByLevel(questions, level) {
    const filtered = questions.filter(q => q.level === level);
    // Eğer o seviyede soru yoksa, en yakın seviyeden al
    if (filtered.length === 0) {
      if (level === 'B2') return questions.filter(q => q.level === 'B1');
      if (level === 'A2') return questions.filter(q => q.level === 'B1');
      return questions;
    }
    return filtered;
  },

  // Adaptif soru seçimi: seviyeye göre + çözülmemiş öncelikli
  selectQuestions(questions, topic, count) {
    const level = this.getTopicLevel(topic);
    const history = Storage.getQuizHistory();

    // Seviyeye uygun soruları al
    let pool = this.filterByLevel(questions, level);

    // Çözülmemiş soruları öne al
    const unsolved = pool.filter(q => !history.includes(q.id));
    const solved = pool.filter(q => history.includes(q.id));

    // Önce çözülmemişlerden, yetmezse çözülmüşlerden
    let selected = [...unsolved];
    if (selected.length < count) {
      selected = [...selected, ...this.shuffle(solved).slice(0, count - selected.length)];
    }

    // Karıştır ve istenen sayıda döndür
    return this.shuffle(selected).slice(0, count);
  },

  // Günlük test için karışık soru seçimi (her bölümden)
  selectDailyQuestions(allQuestions, count = 10) {
    const level = Storage.getLevel();
    const history = Storage.getQuizHistory();

    // Her kategoriden 2'şer soru hedefle
    const categories = ['grammar', 'vocabulary', 'reading', 'dialogue', 'situational'];
    let selected = [];

    categories.forEach(cat => {
      const catQuestions = allQuestions.filter(q =>
        (q.category || q.topic || '').includes(cat) ||
        (q.type || '').includes(cat)
      );
      const levelFiltered = this.filterByLevel(catQuestions, level);
      const unsolved = levelFiltered.filter(q => !history.includes(q.id));
      const pool = unsolved.length >= 2 ? unsolved : levelFiltered;
      selected.push(...this.shuffle(pool).slice(0, 2));
    });

    // Eksik kalan varsa rastgele doldur
    if (selected.length < count) {
      const remaining = allQuestions.filter(q => !selected.find(s => s.id === q.id));
      selected.push(...this.shuffle(remaining).slice(0, count - selected.length));
    }

    return this.shuffle(selected).slice(0, count);
  },

  // Performans sonrası seviye güncelleme
  updateAfterQuiz(topic, correct, total) {
    const ratio = correct / total;
    const stat = Storage.getTopicStat(topic);

    if (total >= 5) {
      if (ratio >= 0.8 && stat.level !== 'B2') {
        const newLevel = Storage.levelUp(stat.level);
        const stats = Storage.getTopicStats();
        // Topic stats yoksa oluştur
        if (!stats[topic]) stats[topic] = { correct: 0, wrong: 0, level: 'A2', total: 0 };
        stats[topic].level = newLevel;
        Storage.set(Storage.KEYS.TOPIC_STATS, stats);
        return { levelChanged: true, newLevel, direction: 'up' };
      } else if (ratio < 0.5 && stat.level !== 'A2') {
        const newLevel = Storage.levelDown(stat.level);
        const stats = Storage.getTopicStats();
        if (!stats[topic]) stats[topic] = { correct: 0, wrong: 0, level: 'A2', total: 0 };
        stats[topic].level = newLevel;
        Storage.set(Storage.KEYS.TOPIC_STATS, stats);
        return { levelChanged: true, newLevel, direction: 'down' };
      }
    }
    return { levelChanged: false, newLevel: stat.level, direction: 'same' };
  },

  // Zayıf konuları bul (accuracy < %60)
  getWeakTopics() {
    const stats = Storage.getTopicStats();
    const weak = [];
    for (const [topic, stat] of Object.entries(stats)) {
      if (stat.total >= 3) {
        const accuracy = Math.round((stat.correct / stat.total) * 100);
        if (accuracy < 60) {
          weak.push({ topic, accuracy, ...stat });
        }
      }
    }
    return weak.sort((a, b) => a.accuracy - b.accuracy);
  },

  // Güçlü konuları bul (accuracy >= %80)
  getStrongTopics() {
    const stats = Storage.getTopicStats();
    const strong = [];
    for (const [topic, stat] of Object.entries(stats)) {
      if (stat.total >= 3) {
        const accuracy = Math.round((stat.correct / stat.total) * 100);
        if (accuracy >= 80) {
          strong.push({ topic, accuracy, ...stat });
        }
      }
    }
    return strong.sort((a, b) => b.accuracy - a.accuracy);
  },

  // Yarınki çalışma önerisi
  getStudySuggestion() {
    const weak = this.getWeakTopics();
    if (weak.length > 0) {
      return `${this.topicDisplayName(weak[0].topic)} konu tekrari + 20 soru pratik`;
    }
    return 'Karisik tekrar + deneme sinavi';
  },

  // Konu display adı (Türkçe)
  topicDisplayName(topic) {
    const names = {
      'tenses': 'Zamanlar (Tenses)',
      'conditionals': 'Kosul Cumleleri (Conditionals)',
      'passive': 'Edilgen Yapi (Passive Voice)',
      'modals': 'Kiplik Fiiller (Modals)',
      'relative-clauses': 'Ilgi Cumleleri (Relative Clauses)',
      'reported-speech': 'Dolayli Anlatim (Reported Speech)',
      'connectors': 'Baglaclar (Connectors)',
      'gerunds-infinitives': 'Gerunds & Infinitives',
      'articles': 'Artikeller (Articles)',
      'prepositions': 'Edatlar (Prepositions)',
      'phrasal-verbs': 'Deyimsel Fiiller (Phrasal Verbs)',
      'comparatives': 'Karsilastirma (Comparatives)',
      'quantifiers': 'Nicelik Belirtecleri (Quantifiers)',
      'word-formation': 'Kelime Turetme (Word Formation)',
      'question-tags': 'Soru Kuyrukları (Question Tags)',
      'causatives': 'Ettirgen Yapi (Causatives)',
      'vocabulary': 'Kelime Bilgisi',
      'reading': 'Okuma Anlama',
      'dialogue': 'Diyalog Tamamlama',
      'situational': 'Durumlara Uygun Ifadeler',
      'irrelevant': 'Anlama Uygun Olmayan Cumle',
      'vocab-health-medicine': 'Saglik & Tip',
      'vocab-education-academic': 'Egitim & Akademik',
      'vocab-daily-life': 'Gunluk Yasam',
      'vocab-environment': 'Cevre',
      'vocab-technology': 'Teknoloji',
      'vocab-travel-tourism': 'Seyahat & Turizm',
      'vocab-work-career': 'Is & Kariyer',
      'vocab-common-words': 'Sik Kullanilan Kelimeler',
    };
    return names[topic] || topic;
  },

  // Fisher-Yates shuffle
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
};
