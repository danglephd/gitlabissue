export interface GameState {
  currentNumber: number;
  score: number;
  timeLeft: number; // Đảm bảo luôn có giá trị
  isGameOver: boolean;
  config: GameConfig;
}

export interface GameConfig {
  radius: number;
  fontSize: number;
  totalNumbers: number;
  timeLimit: number;
}