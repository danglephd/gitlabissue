import { Component, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Circle } from '../models/circle.model';

@Component({
  selector: 'app-game-tim-so',
  templateUrl: './game-tim-so.component.html',
  styleUrls: ['./game-tim-so.component.css']
})
export class GameTimSoComponent implements AfterViewInit {
  zoomBoard = 40;
  numbLength = 200;
  cR = 40;
  font_size = 40;
  delta_top = 40;
  isShowSidenav = false;
  numberArray: number[] = [];
  x: any = null;
  start = new Date().getTime();

  // Add new properties
  timerDisplay = '00:00:00';
  currentNumber = '1';
  gameZoneItems: Array<Circle & { isHidden: boolean }> = [];
  showGameOver = false;
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

  openNav() {
    this.isShowSidenav = true;
    (document.getElementById("mySidenav") as HTMLElement).style.width = "250px";
  }

  changeNav() {
    this.isShowSidenav = !this.isShowSidenav;
    const sidenav = document.getElementById("mySidenav") as HTMLElement;
    if (this.isShowSidenav) {
      sidenav.classList.add('open');
      sidenav.style.width = "350px";
    } else {
      sidenav.classList.remove('open');
      sidenav.style.width = "0";
    }
  }

  closeNav() {
    this.isShowSidenav = false;
    (document.getElementById("mySidenav") as HTMLElement).style.width = "0";
  }

  closeFinish() {
    this.showGameOver = false;
  }

  initBoard() {
    if (localStorage.getItem("zoomBoard")) {
      this.zoomBoard = +localStorage.getItem("zoomBoard")!;
      this.settingsForm.get('zoomBoard')?.setValue(this.zoomBoard);
    }
    if (localStorage.getItem("numbLength")) {
      this.numbLength = +localStorage.getItem("numbLength")!;
      this.settingsForm.get('numbLength')?.setValue(this.numbLength);
    }
    if (localStorage.getItem("cR")) {
      this.cR = +localStorage.getItem("cR")!;
      this.settingsForm.get('cR')?.setValue(this.cR);
    }
    if (localStorage.getItem("font-size")) {
      this.font_size = +localStorage.getItem("font-size")!;
      this.settingsForm.get('fontSize')?.setValue(this.font_size);
    }
    if (localStorage.getItem("delta_top")) {
      this.delta_top = +localStorage.getItem("delta_top")!;
      this.settingsForm.get('deltaTop')?.setValue(this.delta_top);
    }
  }

  gameTimer = () => {
    let now = new Date().getTime();
    let addTime = 0;
    let distance = addTime + ((Date.now() - this.start) / 1000) | 0;
    let hours: any = (distance / 3600) | 0;
    let minutes: any = ((distance / 60) | 0) - (hours * 60);
    let seconds: any = (distance % 60) | 0;
    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    this.timerDisplay = `${hours}:${minutes}:${seconds}`;
    if (+hours >= 1) {
      clearInterval(this.x);
    }
  }

  startCounting = () => {
    this.timerDisplay = '00:00:00';
    this.currentNumber = '1';
    this.start = new Date().getTime();

    // Lưu settings từ form
    const formValues = this.settingsForm.value;
    localStorage.setItem("zoomBoard", formValues.zoomBoard);
    localStorage.setItem("numbLength", formValues.numbLength);
    localStorage.setItem("cR", formValues.cR);
    localStorage.setItem("font-size", formValues.fontSize);
    localStorage.setItem("delta_top", formValues.deltaTop);

    this.Init();
    this.closeNav();
    this.closeFinish();

    if (this.x) {
      clearInterval(this.x);
    }
    this.x = setInterval(this.gameTimer, 1000);
    return false;
  }

  stopCounting() {
    this.timerDisplay = '00:00:00';
    this.gameZoneItems = [];
    this.currentNumber = '';
    clearInterval(this.x);
  }

  Init() {
    const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
    canvas.width = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) - 20;
    canvas.height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) - 200;
    const ctx = canvas.getContext("2d")!;

    const formValues = this.settingsForm.value;
    this.cR = formValues.cR;
    this.zoomBoard = formValues.zoomBoard;
    this.numbLength = formValues.numbLength;
    this.delta_top = formValues.deltaTop;
    this.font_size = formValues.fontSize;

    ctx.beginPath();

    let centerx = canvas.width / 2;
    let centery = canvas.height / 2;
    let j = 0, i = 0, k = 0;

    let finalNumber = this.calculateFinalNumber(this.numbLength, canvas.width, canvas.height, centerx, centery);
    this.numbLength = finalNumber;
    this.InitNumberArray();
    this.gameZoneItems = [];
    this.currentNumber = '1';

    for (j = 0, i = j + 1; j < this.numbLength || k < this.numbLength; j++, i = j + 1) {
      let c = this.RandCircle(i, centerx, centery, this.numberArray[k], this.zoomBoard, this.cR);

      if (c != null) {
        this.gameZoneItems.push({
          ...c,
          // value: c.value,
          // backgroundColor: c.backgroundColor,
          // color: c.color,
          top: (c.rY + parseInt(this.delta_top as any)) + 'px',
          left: c.rX + 'px',
          width: c.R + 'px',
          height: c.R + 'px',
          lineHeight: c.R + 'px',
          fontSize: this.font_size + "px",
          isHidden: false
        });
        k++;
      }
    }
  }

  onNumberClick(item: Circle & { isHidden: boolean }) {
    const lookNumber = parseInt(this.currentNumber);
    if (item.value === lookNumber) {
      item.isHidden = true;
      this.currentNumber = (lookNumber + 1).toString();

      if (lookNumber >= this.numbLength) {
        clearInterval(this.x);
        this.currentNumber = ' - ';
        this.showGameOver = true;
        this.finalTimer = this.timerDisplay;
      }
    }
  }

  calculateFinalNumber(numbLength: number, width: number, height: number, centerx: number, centery: number): number {
    let numberMax = 0;
    for (let j = 0, i = j + 1; j < numbLength || numberMax < numbLength; j++, i = j + 1) {
      let c = this.RandCircle(i, centerx, centery, 0, this.zoomBoard, this.cR);
      if (c != null) {
        numberMax++;
      }
      if (j > numbLength * 1.5) {
        return numberMax;
      }
    }
    return numbLength;
  }

  resizeCanvas() {
    const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
    canvas.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    canvas.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    // clearScreen(); // Nếu bạn có hàm này
  }

  InitNumberArray() {
    let j = 0, i = 0, temp;
    for (i = 0; i < this.numbLength; i++) {
      this.numberArray[i] = i + 1;
    }
    for (i = 0; i < this.numbLength; i++) {
      j = i + Math.floor(Math.random() * this.numbLength - i);
      temp = this.numberArray[i];
      this.numberArray[i] = this.numberArray[j];
      this.numberArray[j] = temp;
    }
  }

  RandCircle(i: number, centerx: number, centery: number, value: number, zoom: number, cR: number) {
    let goldenRatio_phi = 0.618033988749895;
    let s = 0.5;
    let v = 0.99;
    let h = 0.99;
    let r = Math.sqrt(i);
    let theta = i * 2 * Math.PI / (goldenRatio_phi * goldenRatio_phi);

    let x = (Math.cos(theta) * r) * zoom;
    let y = (Math.sin(theta) * r) * zoom;
    let rX = Math.round((centerx) + x);
    let rY = Math.round((centery) + y);

    const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
    if (rX - cR < 0 || rY - cR < 0 || rX + cR > canvas.width || rY + cR > canvas.height) {
      return null;
    }

    const colors = this.hsvToRgb(Math.random(), s, v);

    const circle: Circle = {
      R: cR,
      rX: rX,
      rY: rY,
      value: value,
      backgroundColor: colors.backgroundColor,
      color: colors.color,
      fontSize: this.font_size
    };

    return circle;
  }

  hsvToRgb(h: number, s: number, v: number) {
    let r = 0, g = 0, b = 0;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);

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
      color: `rgb(0, 0, 0)`
    };
  }

  onRadiusChange(event: Event) {
    const r = +(event.target as HTMLInputElement).value;
    this.settingsForm.patchValue({
      fontSize: Math.max(r - 10, 1)
    });
  }
}
