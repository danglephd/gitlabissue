import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Circle } from '../models/circle.model';
import { GameState, GameConfig } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private gameState = new BehaviorSubject<GameState>({
    currentNumber: 1,
    score: 0,
    timeLeft: 0,
    isGameOver: false,
    config: {
      radius: 40,
      fontSize: 40,
      totalNumbers: 200,
      timeLimit: 3600
    }
  });

  private numberArray: number[] = [];
  private timerInterval: any = null;
  private gameStartTime = 0;

  gameState$ = this.gameState.asObservable();

  startGame(config: GameConfig): void {
    this.resetGameState(config);
    this.startTimer();
  }

  checkNumber(number: number): boolean {
    const currentState = this.gameState.value;
    if (number === currentState.currentNumber) {
      this.updateGameState({
        currentNumber: currentState.currentNumber + 1,
        score: currentState.score + 1
      });
      return true;
    }
    return false;
  }

  private resetGameState(config: GameConfig): void {
    this.gameStartTime = Date.now();
    this.gameState.next({
      currentNumber: 1,
      score: 0,
      timeLeft: config.timeLimit,
      isGameOver: false,
      config
    });
  }

  private startTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    this.timerInterval = setInterval(() => {
      const currentState = this.gameState.value;
      const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
      const timeLeft = currentState.config.timeLimit - elapsed;

      if (timeLeft <= 0) {
        this.endGame();
      } else {
        this.updateGameState({ timeLeft });
      }
    }, 1000);
  }

  private endGame(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.updateGameState({ isGameOver: true });
  }

  private updateGameState(partialState: Partial<GameState>): void {
    this.gameState.next({
      ...this.gameState.value,
      ...partialState
    });
  }

  generateCircles(canvas: HTMLCanvasElement, settings: any): Array<Circle & { isHidden: boolean }> {
    const { width, height } = canvas;
    const centerx = width / 2;
    const centery = height / 2;
    
    const circles: Array<Circle & { isHidden: boolean }> = [];
    let k = 0;
    
    this.initNumberArray(settings.numbLength);
    
    for (let j = 0; k < this.numberArray.length; j++) {
      const circle = this.createCircle(j, centerx, centery, this.numberArray[k], settings, width, height);
      if (circle) {
        circles.push({ ...circle, isHidden: false });
        k++;
      }
    }
    
    return circles;
  }

  private initNumberArray(length: number) {
    this.numberArray = Array(length).fill(0).map((_, i) => i + 1);
    for (let i = 0; i < length; i++) {
      const j = i + Math.floor(Math.random() * (length - i));
      [this.numberArray[i], this.numberArray[j]] = [this.numberArray[j], this.numberArray[i]];
    }
  }

  private createCircle(index: number, centerx: number, centery: number, value: number, settings: any, width: number, height: number): Circle | null {
    const circle = this.RandCircle(index, centerx, centery, value, settings.zoomBoard, settings.cR, settings.fontSize, width, height);
    if (!circle) return null;

    return {
      ...circle,
      top: (circle.rY + settings.deltaTop) + 'px',
      left: circle.rX + 'px',
      width: circle.R + 'px',
      height: circle.R + 'px',
      lineHeight: circle.R + 'px',
      fontSize: circle.fontSize + 'px'
    };
  }

  private RandCircle(i: number, centerx: number, centery: number, value: number, zoom: number, cR: number, fontSize: number, canvasWidth: number, canvasHeight: number): Circle | null {
    const goldenRatio_phi = 0.618033988749895;
    const r = Math.sqrt(i);
    const theta = i * 2 * Math.PI / (goldenRatio_phi * goldenRatio_phi);

    const x = (Math.cos(theta) * r) * zoom;
    const y = (Math.sin(theta) * r) * zoom;
    const rX = Math.round(centerx + x);
    const rY = Math.round(centery + y);

    // const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
    if (rX - cR < 0 || rY - cR < 0 || rX + cR > canvasWidth || rY + cR > canvasHeight) {
      return null;
    }

    const colors = this.hsvToRgb(Math.random(), 0.5, 0.99);

    return {
      R: cR,
      rX,
      rY,
      value,
      ...colors,
      fontSize: fontSize
    };
  }

  private hsvToRgb(h: number, s: number, v: number) {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }

    return {
      backgroundColor: `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`,
      color: 'rgb(0, 0, 0)'
    };
  }


  private stopGame() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

}