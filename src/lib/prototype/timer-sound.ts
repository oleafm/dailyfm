/** Audio is unlocked by a user gesture. No sound files or external requests. */
export class TimerChime {
  private context: AudioContext | null = null;
  async arm(): Promise<boolean> {
    try {
      this.context ??= new AudioContext();
      if (this.context.state !== "running") await this.context.resume();
      return this.context.state === "running";
    } catch { return false; }
  }
  play(): boolean {
    const context = this.context;
    if (!context || context.state !== "running") return false;
    try {
      [660, 830, 990].forEach((frequency, index) => {
        const oscillator = context.createOscillator(), gain = context.createGain();
        const start = context.currentTime + index * 0.3;
        oscillator.type = "sine"; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.14, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.65);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(start); oscillator.stop(start + 0.7);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
      return true;
    } catch { return false; }
  }
  close() { void this.context?.close().catch(() => {}); this.context = null; }
}
