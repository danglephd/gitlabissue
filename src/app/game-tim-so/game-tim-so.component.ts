import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Circle } from '../models/circle.model';
import { GameState } from '../models/game.model';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-game-tim-so',
  templateUrl: './game-tim-so.component.html',
  styleUrls: ['./game-tim-so.component.css']
})
export class GameTimSoComponent implements AfterViewInit {
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sidenav') sidenavRef!: ElementRef;
  // UI state
  isShowSidenav = false;
  showGameOver = false;

  // // Game state
  // private timerInterval: any = null;
  // private gameStartTime = 0;
  // numberArray: number[] = [];
  // timerDisplay = '00:00:00';
  // currentNumber = '1';
  gameZoneItems: Array<Circle & { isHidden: boolean }> = [];
  gameState$ = this.gameService.gameState$;
  finalTimer = '00:00:00';

  settingsForm: FormGroup;

  constructor(private fb: FormBuilder,
              private gameService: GameService
  ) {
    this.settingsForm = this.fb.group({
      zoomBoard: [40],
      numbLength: [200],
      cR: [40],
      fontSize: [40],
      deltaTop: [40]
    });
  }

  ngAfterViewInit() {
    this.loadSavedSettings();
  }

  private loadSavedSettings() {
    const settings = ['zoomBoard', 'numbLength', 'cR', 'fontSize', 'deltaTop'];
    settings.forEach(setting => {
      const value = localStorage.getItem(setting);
      if (value) {
        this.settingsForm.get(setting)?.setValue(+value);
      }
    });
  }

  toggleNav() {
    this.isShowSidenav = !this.isShowSidenav;
    this.sidenavRef.nativeElement.style.width = this.isShowSidenav ? "350px" : "0";
    this.sidenavRef.nativeElement.classList.toggle('open');
  }

  closeNav() {
    this.isShowSidenav = false;
    (document.getElementById("mySidenav") as HTMLElement).style.width = "0";
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
    const formValues = this.settingsForm.value;
    this.saveSettings();
    
    const canvas = this.canvasRef.nativeElement;
    this.setupCanvas(canvas);
    console.log(canvas.width, canvas.height);
    
    this.gameZoneItems = this.gameService.generateCircles(canvas, formValues);
    
    this.gameService.startGame({
      radius: formValues.cR,
      fontSize: formValues.fontSize,
      totalNumbers: formValues.numbLength,
      timeLimit: 3600
    });
    
    this.isShowSidenav = false;
  }

  onNumberClick(item: Circle & { isHidden: boolean }) {
    if (this.gameService.checkNumber(item.value)) {
      item.isHidden = true;
    }
  }

  onRadiusChange(event: Event) {
    const radius = +(event.target as HTMLInputElement).value;
    this.settingsForm.patchValue({
      fontSize: Math.max(radius - 10, 1)
    });
  }

  private saveSettings() {
    Object.entries(this.settingsForm.value).forEach(([key, value]) => {
      localStorage.setItem(key, String(value));
    });
  }

  private setupCanvas(canvas: HTMLCanvasElement) {
    canvas.width = window.innerWidth - 20;
    canvas.height = window.innerHeight - 200;
    return { width: canvas.width, height: canvas.height };
  }

}
