import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Circle } from '../models/circle.model';

@Component({
  selector: 'app-game-tim-so',
  templateUrl: './game-tim-so.component.html',
  styleUrls: ['./game-tim-so.component.css']
})
export class GameTimSoComponent implements AfterViewInit {
  @ViewChild('myCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('mySidenav') sidenavRef!: ElementRef;
  // UI state
  isShowSidenav = false;
  showGameOver = false;

  // Game state
  private timerInterval: any = null;
  private gameStartTime = 0;
  numberArray: number[] = [];
  timerDisplay = '00:00:00';
  currentNumber = '1';
  gameZoneItems: Array<Circle & { isHidden: boolean }> = [];
  finalTimer = '00:00:00';

  settingsForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.settingsForm = this.fb.group({
      zoomBoard: [40],
      numbLength: [200],
      cR: [40],
      fontSize: [40],
      deltaTop: [40]
    });
  }

  ngAfterViewInit() {
    this.initBoard();
  }

  toggleNav() {
    this.isShowSidenav = !this.isShowSidenav;
    this.sidenavRef.nativeElement.style.width = this.isShowSidenav ? "350px" : "0";
    this.sidenavRef.nativeElement.classList.toggle('open');
  }

  closeNav() {
    this.isShowSidenav = false;
    this.sidenavRef.nativeElement.style.width = "0";
  }

  closeFinish() {
    this.showGameOver = false;
  }

  initBoard() {
    const settings = ['zoomBoard', 'numbLength', 'cR', 'fontSize', 'deltaTop'];
    settings.forEach(setting => {
      const value = localStorage.getItem(setting);
      if (value) {
        this.settingsForm.get(setting)?.setValue(+value);
      }
    });
  }

  startGame = () => {
    this.resetGameState();
    this.saveSettings();
    this.initGameBoard();
    this.startTimer();
    this.closeNav();
  }

  private initGameBoard() {
    const formValues = this.settingsForm.value;
    const canvas = this.canvasRef.nativeElement;
    const { width, height } = this.setupCanvas(canvas);

    const centerx = width / 2;
    const centery = height / 2;

    const finalNumber = this.calculateFinalNumber(formValues.numbLength, width, height, centerx, centery);
    this.settingsForm.patchValue({ numbLength: finalNumber });
    localStorage.setItem('numbLength', finalNumber.toString());
    this.initNumberArray(finalNumber);

    this.gameZoneItems = [];
    let k = 0;
    for (let j = 0; k < this.numberArray.length; j++) {
      const circle = this.createCircle(j, centerx, centery, this.numberArray[k], formValues, width, height);
      if (circle) {
        this.gameZoneItems.push({ ...circle, isHidden: false });
        k++;
      }
    }
  }

  onNumberClick(item: Circle & { isHidden: boolean }) {
    const lookNumber = parseInt(this.currentNumber);
    if (item.value === lookNumber) {
      item.isHidden = true;
      this.currentNumber = (lookNumber + 1).toString();

      if (lookNumber >= this.numberArray.length) {
        this.stopGame();
        this.currentNumber = ' - ';
        this.showGameOver = true;
        this.finalTimer = this.timerDisplay;
      }
    }
  }

  private calculateFinalNumber(numbLength: number, width: number, height: number, centerx: number, centery: number): number {
    let numberMax = 0;
    for (let j = 0;  j < numbLength || numberMax < numbLength; j++) {
      const circle = this.RandCircle(j, centerx, centery, 0, this.settingsForm.value.zoomBoard, this.settingsForm.value.cR, width, height);
      if (circle) numberMax++;
      if (j > numbLength * 1.5) {
        return numberMax;
      }
    }
    return numberMax;
  }

  private initNumberArray(length: number) {
    this.numberArray = Array(length).fill(0).map((_, i) => i + 1);
    for (let i = 0; i < length; i++) {
      const j = i + Math.floor(Math.random() * (length - i));
      [this.numberArray[i], this.numberArray[j]] = [this.numberArray[j], this.numberArray[i]];
    }
  }

  private RandCircle(i: number, centerx: number, centery: number, value: number, zoom: number, cR: number, canvasWidth: number, canvasHeight: number): Circle | null {
    // const goldenRatio_phi = 0.618033988749895;
    // const goldenRatio_phi_2 = 0.382;
    i = i + 1;
    const r = Math.sqrt(i);
    const p_div_gol_phi_2 = 8.224;

    const theta = i * 2 * p_div_gol_phi_2;

    const x = (Math.cos(theta) * r) * zoom;
    const y = (Math.sin(theta) * r) * zoom;
    const rX = Math.round(centerx + x);
    const rY = Math.round(centery + y);

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
      fontSize: this.settingsForm.value.fontSize
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

  onRadiusChange(event: Event) {
    const radius = +(event.target as HTMLInputElement).value;
    this.settingsForm.patchValue({
      fontSize: Math.max(radius - 10, 1)
    });
  }

  private resetGameState() {
    this.timerDisplay = '00:00:00';
    this.currentNumber = '1';
    this.gameStartTime = Date.now();
    this.gameZoneItems = [];
    this.showGameOver = false;
  }

  private saveSettings() {
    Object.entries(this.settingsForm.value).forEach(([key, value]) => {
      localStorage.setItem(key, String(value));
    });
  }

  private updateTimer = () => {
    const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    if (hours >= 1) {
      this.stopGame();
      return;
    }

    this.timerDisplay = [hours, minutes, seconds]
      .map(v => v < 10 ? `0${v}` : v)
      .join(':');
  }

  private setupCanvas(canvas: HTMLCanvasElement) {
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 200;
    return { width: canvas.width, height: canvas.height };
  }

  private createCircle(index: number, centerx: number, centery: number, value: number, settings: any, canvasWidth: number, canvasHeight: number): Circle | null {
    const circle = this.RandCircle(index, centerx, centery, value, settings.zoomBoard, settings.cR, canvasWidth, canvasHeight);
    if (!circle) return null;

    return {
      ...circle,
      top: (circle.rY + settings.deltaTop) + 'px',
      left: circle.rX + 'px',
      width: circle.R + 'px',
      height: circle.R + 'px',
      lineHeight: circle.R + 'px',
      fontSize: settings.fontSize + 'px'
    };
  }

  private startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(this.updateTimer, 1000);
  }

  private stopGame() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
