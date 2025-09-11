import { Component, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-dog-whistle',
  templateUrl: './dog-whistle.component.html',
  styleUrls: ['./dog-whistle.component.css']
})
export class DogWhistleComponent implements OnDestroy {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  isPlaying = false;
  frequency = 20000; // Mặc định 20kHz
  audioBuffer?: AudioBuffer;
  musicSource?: AudioBufferSourceNode;
  musicPlaying = false;
  playbackRate = 2; // tốc độ phát nhạc

  private initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playSound(): void {
    this.initAudio();
    this.stopSound(); // Dừng trước khi phát mới

    this.oscillator = this.audioCtx!.createOscillator();
    this.oscillator.type = "sine";
    this.oscillator.frequency.value = this.frequency;
    this.oscillator.connect(this.audioCtx!.destination);
    this.oscillator.start();
    this.isPlaying = true;
    console.log(`Playing ${this.frequency} Hz`);
  }

  stopSound(): void {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
      this.isPlaying = false;
      console.log("Stopped.");
    }
  }

  updateFrequency() {
    if (this.isPlaying && this.oscillator) {
      this.oscillator.frequency.value = this.frequency;
    }
  }

  testSound() {
    this.playSound();
    setTimeout(() => this.stopSound(), 2000); // Tự dừng sau 2 giây
  }


  // === Load nhạc ===
  async loadMusic() {
    this.initAudio();
    if (!this.audioBuffer) {
      const response = await fetch('assets/audio/see-you-later.m4a');
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioCtx!.decodeAudioData(arrayBuffer);
    }
  }

  // === Phát nhạc intro 5 giây ===
  async playIntro() {
    await this.loadMusic();
    this.stopMusic();

    this.musicSource = this.audioCtx!.createBufferSource();
    this.musicSource.buffer = this.audioBuffer!;
    this.musicSource.playbackRate.value = this.playbackRate;
    this.musicSource.connect(this.audioCtx!.destination);

    // start(when, offset, duration)
    this.musicSource.start(0, 0, 5); // phát từ giây 0, chỉ phát 5 giây
    this.musicPlaying = true;

    // Tự dừng flag sau 5 giây
    setTimeout(() => (this.musicPlaying = false), 5000 / this.playbackRate);
  }

  stopMusic() {
    if (this.musicSource) {
      this.musicSource.stop();
      this.musicSource.disconnect();
      this.musicSource = undefined;
    }
    this.musicPlaying = false;
  }

  ngOnDestroy() {
    this.stopSound();
    this.stopMusic();
    this.audioCtx?.close();
  }
}
