import { Component, AfterViewInit } from '@angular/core';

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
    (document.getElementById("game-over") as HTMLElement).style.display = "none";
  }

  initBoard() {
    if (localStorage.getItem("zoomBoard") !== null) {
      this.zoomBoard = +localStorage.getItem("zoomBoard")!;
    }
    if (localStorage.getItem("numbLength") !== null) {
      this.numbLength = +localStorage.getItem("numbLength")!;
    }
    if (localStorage.getItem("cR") !== null) {
      this.cR = +localStorage.getItem("cR")!;
    }
    if (localStorage.getItem("font-size") !== null) {
      this.font_size = +localStorage.getItem("font-size")!;
    }
    if (localStorage.getItem("delta_top") !== null) {
      this.delta_top = +localStorage.getItem("delta_top")!;
    }
    (document.getElementById("cR") as HTMLInputElement).value = this.cR.toString();
    (document.getElementById("vn_numberLength") as HTMLInputElement).value = this.numbLength.toString();
    (document.getElementById("zoomBoard") as HTMLInputElement).value = this.zoomBoard.toString();
    (document.getElementById("font-size") as HTMLInputElement).value = this.font_size.toString();
    (document.getElementById("delta_top") as HTMLInputElement).value = this.delta_top.toString();
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
    (document.getElementById("vn_timer") as HTMLElement).innerHTML = `${hours}:${minutes}:${seconds}`;
    if (+hours >= 1) {
      clearInterval(this.x);
    }
  }

  startCounting = () => {
    this.start = new Date().getTime();
    (document.getElementById("vn_timer") as HTMLElement).innerHTML = `00:00:00`;
    (document.getElementById("vn_number") as HTMLElement).innerHTML = '';
    this.Init();
    this.closeNav();
    this.closeFinish();

    localStorage.setItem("zoomBoard", (document.getElementById("zoomBoard") as HTMLInputElement).value);
    localStorage.setItem("numbLength", (document.getElementById("vn_numberLength") as HTMLInputElement).value);
    localStorage.setItem("cR", (document.getElementById("cR") as HTMLInputElement).value);
    localStorage.setItem("font-size", (document.getElementById("font-size") as HTMLInputElement).value);
    localStorage.setItem("delta_top", (document.getElementById("delta_top") as HTMLInputElement).value);

    if (this.x) {
      clearInterval(this.x);
    }
    this.x = setInterval(this.gameTimer, 1000);
    return false;
  }

  stopCounting() {
    (document.getElementById("vn_timer") as HTMLElement).innerHTML = `00:00:00`;
    (document.getElementById("gameZone") as HTMLElement).innerHTML = '';
    (document.getElementById("vn_number") as HTMLElement).innerHTML = '';
    clearInterval(this.x);
  }

  Init() {
    const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
    canvas.width = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) - 20;
    canvas.height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) - 200;
    const ctx = canvas.getContext("2d")!;
    let lookNumber = 1;
    this.cR = parseInt((document.getElementById("cR") as HTMLInputElement).value);
    this.zoomBoard = parseInt((document.getElementById("zoomBoard") as HTMLInputElement).value);
    this.numbLength = parseInt((document.getElementById("vn_numberLength") as HTMLInputElement).value);
    this.delta_top = parseInt((document.getElementById("delta_top") as HTMLInputElement).value);

    ctx.beginPath();

    let centerx = canvas.width / 2;
    let centery = canvas.height / 2;
    let j = 0, i = 0, k = 0;

    let finalNumber = this.calculateFinalNumber(this.numbLength, canvas.width, canvas.height, centerx, centery);
    this.numbLength = finalNumber;
    this.InitNumberArray();
    (document.getElementById("gameZone") as HTMLElement).innerHTML = '';
    (document.getElementById("vn_number") as HTMLElement).innerHTML = '1';
    let fontSize = (document.getElementById("font-size") as HTMLInputElement).value;

    for (j = 0, i = j + 1; j < this.numbLength || k < this.numbLength; j++, i = j + 1) {
      let c = this.RandCircle(i, centerx, centery, this.numberArray[k], this.zoomBoard, this.cR);

      if (c != null) {
        let node = document.createElement("div");
        let textnode = document.createTextNode(c.value.toString());
        node.appendChild(textnode);
        node.classList.add('numberCircle');
        node.style.backgroundColor = c.backgroundColor;
        node.style.top = (c.rY + parseInt(this.delta_top as any)) + 'px';
        node.style.left = c.rX + 'px'; // Thay vì node.style.right
        node.style.width = c.R + 'px';
        node.style.height = c.R + 'px';
        node.style.lineHeight = c.R + 'px';
        node.style.fontSize = fontSize + "px";
        node.style.color = c.color;

        node.addEventListener('click', (event) => {
          var nodeNum = document.getElementById('vn_number') as HTMLElement;
          if (node.innerHTML == `${lookNumber}`) {
            node.classList.add('hidden');
            lookNumber++;
            nodeNum.innerHTML = lookNumber.toString();
            if (lookNumber > this.numbLength) {
              clearInterval(this.x);
              nodeNum.innerHTML = ' - ';
              (document.getElementById("game-over") as HTMLElement).style.display = "flex";
              (document.getElementById("final_timer") as HTMLElement).innerHTML = (document.getElementById("vn_timer") as HTMLElement).innerHTML;
            }
          }
        });
        (document.getElementById("gameZone") as HTMLElement).appendChild(node);
        k++;
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

    let circleColor = this.hsvToRgb(Math.random(), s, v);

    let c = {
      R: cR,
      rX: rX,
      rY: rY,
      value: value,
      backgroundColor: circleColor.backgroundColor,
      color: circleColor.color
    };
    return c;
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
    const fontSizeInput = document.getElementById('font-size') as HTMLInputElement;
    if (fontSizeInput) {
      fontSizeInput.value = String(Math.max(r - 10, 1));
    }
  }
}
