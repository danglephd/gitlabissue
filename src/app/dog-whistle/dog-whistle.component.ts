import { Component, OnDestroy } from '@angular/core';

type MorseUnit = '.' | '-' | ' ';

@Component({
  selector: 'app-dog-whistle',
  templateUrl: './dog-whistle.component.html',
  styleUrls: ['./dog-whistle.component.css', './morse-player.component.css']
})
export class DogWhistleComponent implements OnDestroy {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private masterGain?: GainNode;
  isPlaying = false;
  playing = false;
  frequency = 20000; // Hz
  gainLevel = 0.5;   // 0..1
  wpm = 20;          // Morse speed
  inputText = 'SOS';
  log: Array<{ time: string, evt: string }> = [];
  maxDurationSec = 30; // safety auto-stop

  // Morse code mapping
  private MORSE: Record<string, string> = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
    'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
    'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
    'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
    'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
    'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
    '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...',
    ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
    '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-',
    '@': '.--.-.', ' ': ' '
  };

  // --- Simple continuous tone ---
  playSound(): void {
    this.stopSound();
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.oscillator = this.audioCtx.createOscillator();
    this.oscillator.type = "sine";
    this.oscillator.frequency.value = this.frequency;
    this.oscillator.connect(this.audioCtx.destination);
    this.oscillator.start();
    this.isPlaying = true;
  }

  stopSound(): void {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => { });
      this.audioCtx = null;
    }
    this.isPlaying = false;
  }

  updateFrequency() {
    if (this.isPlaying && this.oscillator) {
      this.oscillator.frequency.value = this.frequency;
    }
  }

  testSound(): void {
    this.playSound();
    setTimeout(() => this.stopSound(), 2000);
  }

  // --- Morse code tone ---
  dotDurationSec(): number {
    return 1.2 / this.wpm;
  }

  private ensureAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = this.gainLevel;
      this.masterGain.connect(this.audioCtx.destination);
    }
  }

  textToMorseUnits(text: string): MorseUnit[] {
    const out: MorseUnit[] = [];
    const up = (text || '').toUpperCase();
    for (let i = 0; i < up.length; i++) {
      const ch = up[i];
      const code = this.MORSE[ch] ?? '';
      if (code === '') continue;
      if (code === ' ') {
        out.push(' ');
        continue;
      }
      for (let j = 0; j < code.length; j++) {
        out.push(code[j] as MorseUnit);
        if (j !== code.length - 1) out.push(' ');
      }
      out.push(' ');
    }
    return out;
  }

  async playMorse() {
    if (this.playing) return;
    this.ensureAudio();

    const units = this.textToMorseUnits(this.inputText);
    const dot = this.dotDurationSec();

    interface Step { on: boolean; duration: number; symbol?: string; }
    const steps: Step[] = [];
    let i = 0;
    while (i < units.length) {
      const u = units[i];
      if (u === '.') {
        steps.push({ on: true, duration: dot, symbol: '.' });
        steps.push({ on: false, duration: dot });
        i++;
      } else if (u === '-') {
        steps.push({ on: true, duration: dot * 3, symbol: '-' });
        steps.push({ on: false, duration: dot });
        i++;
      } else if (u === ' ') {
        let cnt = 0;
        while (i < units.length && units[i] === ' ') { cnt++; i++; }
        if (cnt >= 2) {
          steps.push({ on: false, duration: dot * 7 });
        } else {
          steps.push({ on: false, duration: dot * 3 });
        }
      } else {
        i++;
      }
    }

    // Merge consecutive steps
    const merged: Step[] = [];
    for (const s of steps) {
      if (merged.length === 0) merged.push({ ...s });
      else {
        const last = merged[merged.length - 1];
        if (last.on === s.on) last.duration += s.duration;
        else merged.push({ ...s });
      }
    }

    const totalSec = merged.reduce((acc, s) => acc + s.duration, 0);
    if (totalSec > this.maxDurationSec) {
      alert(`Requested sequence is ${totalSec.toFixed(1)}s long; exceeds safety limit (${this.maxDurationSec}s).`);
      return;
    }

    const now = this.audioCtx!.currentTime + 0.05;
    let cursor = now;
    this.log = [];
    this.playing = true;

    for (const s of merged) {
      if (!this.playing) break;
      if (s.on) {
        const osc = this.audioCtx!.createOscillator();
        const g = this.audioCtx!.createGain();
        osc.type = 'sine';
        osc.frequency.value = this.frequency;
        const attack = Math.min(0.01, s.duration / 10);
        const release = attack;
        g.gain.setValueAtTime(0, cursor);
        g.gain.linearRampToValueAtTime(this.gainLevel, cursor + attack);
        g.gain.setValueAtTime(this.gainLevel, cursor + s.duration - release);
        g.gain.linearRampToValueAtTime(0, cursor + s.duration);
        osc.connect(g);
        g.connect(this.masterGain!);

        osc.start(cursor);
        osc.stop(cursor + s.duration + 0.02);
        console.log(`${s.symbol}`);

        this.log.push({ time: new Date().toISOString(), evt: `ON ${s.duration.toFixed(3)}s @ ${this.frequency}Hz` });
      } else {
        this.log.push({ time: new Date().toISOString(), evt: `OFF ${s.duration.toFixed(3)}s` });
      }
      cursor += s.duration;
    }

    setTimeout(() => {
      this.playing = false;
      this.log.push({ time: new Date().toISOString(), evt: 'END' });
    }, (cursor - now) * 1000 + 100);
  }

  stopMorse() {
    if (!this.audioCtx) return;
    try {
      this.audioCtx.suspend();
    } catch (e) { }
    this.playing = false;
    this.log.push({ time: new Date().toISOString(), evt: 'STOPPED' });
    this.audioCtx.close().catch(() => { }).finally(() => {
      this.audioCtx = null;
      this.masterGain = undefined;
    });
  }

  testPulse() {
    const saveText = this.inputText;
    this.inputText = 'TEST';
    this.playMorse();
    setTimeout(() => { this.stopMorse(); this.inputText = saveText; }, 2000);
  }

  exportLogCsv() {
    if (!this.log.length) { alert('No log'); return; }
    const rows = this.log.map(r => `${r.time},${r.evt}`);
    const csv = 'timestamp,event\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'morse_log.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  ngOnDestroy() {
    this.stopSound();
    this.stopMorse();
  }
}
