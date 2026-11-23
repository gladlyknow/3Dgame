export class AudioManager {
  enabled = localStorage.getItem('tire-town-sound') !== 'off';
  private context: AudioContext | null = null;

  unlock(): void {
    if (!this.context) {
      const AudioCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtor) this.context = new AudioCtor();
    }
    void this.context?.resume();
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('tire-town-sound', this.enabled ? 'on' : 'off');
    if (!this.enabled) window.speechSynthesis?.cancel();
    else this.unlock();
    return this.enabled;
  }

  speak(text: string, voice = 'character'): void {
    if (!this.enabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = voice === 'poppy' ? 0.92 : 0.86;
    utterance.pitch = voice === 'poppy' ? 1.18 : 1.02;
    window.speechSynthesis.speak(utterance);
  }

  cue(kind: 'success' | 'notice' | 'honk' | 'whoosh'): void {
    if (!this.enabled) return;
    this.unlock();
    if (!this.context) return;
    const now = this.context.currentTime;
    const notes = {
      success: [523, 659, 784],
      notice: [392, 523],
      honk: [196, 165],
      whoosh: [330, 220],
    }[kind];

    notes.forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      oscillator.type = kind === 'honk' ? 'square' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.09);
      if (kind === 'whoosh') oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.62, now + 0.3);
      gain.gain.setValueAtTime(0.0001, now + index * 0.09);
      gain.gain.exponentialRampToValueAtTime(kind === 'honk' ? 0.075 : 0.045, now + index * 0.09 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.09 + 0.2);
      oscillator.connect(gain).connect(this.context!.destination);
      oscillator.start(now + index * 0.09);
      oscillator.stop(now + index * 0.09 + 0.22);
    });
  }
}
