/* === TIMER — Mock Exam Geri Sayim === */

const Timer = {
  totalSeconds: 0,
  remainingSeconds: 0,
  interval: null,
  displayElement: null,
  onTimeUp: null,

  // Timer başlat (dakika cinsinden)
  start(minutes, displayId, onTimeUp = null) {
    this.totalSeconds = minutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.displayElement = document.getElementById(displayId);
    this.onTimeUp = onTimeUp;

    this.update();

    this.interval = setInterval(() => {
      this.remainingSeconds--;
      this.update();

      if (this.remainingSeconds <= 0) {
        this.stop();
        if (this.onTimeUp) this.onTimeUp();
      }
    }, 1000);
  },

  // Timer durdur
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  },

  // Ekranı güncelle
  update() {
    if (!this.displayElement) return;

    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    this.displayElement.textContent = display;

    // Son 5 dakika uyarısı
    if (this.remainingSeconds <= 300) {
      this.displayElement.classList.add('warning');
    } else {
      this.displayElement.classList.remove('warning');
    }
  },

  // Geçen süre (saniye)
  getElapsed() {
    return this.totalSeconds - this.remainingSeconds;
  },

  // Geçen süreyi formatla
  getElapsedFormatted() {
    const elapsed = this.getElapsed();
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins} dakika ${secs} saniye`;
  },

  // Kalan süreyi formatla
  getRemainingFormatted() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    return `${mins} dakika ${secs} saniye`;
  },

  // Timer aktif mi?
  isRunning() {
    return this.interval !== null;
  }
};
