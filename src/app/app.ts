import { Component, ViewChild, ElementRef, signal, computed, AfterViewInit, OnDestroy, NgZone, HostListener, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GameService } from './game.service';
import { DrawService } from './draw.service';
import { GameState, City, Missile, GamePhase } from './models/game.models';
import { WebsocketService, RoomPlayer } from './websocket.service';
import { AuthService, User as AuthUser } from './auth.service';

import { LoginComponent } from './components/login/login';
import { LobbyComponent } from './components/lobby/lobby';
import { GameHudComponent } from './components/game-hud/game-hud';
import { RouletteComponent } from './components/roulette/roulette';
import { GameOverComponent } from './components/game-over/game-over';
import { LobbyPrincipalComponent } from './components/lobby-principal/lobby-principal';

/**
 * Clase principal de la aplicación.
 * Gestiona si el usuario está en la pantalla de login o en el lobby.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoginComponent, LobbyComponent, GameHudComponent, RouletteComponent, GameOverComponent, LobbyPrincipalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  public gameService = inject(GameService);
  private wsService = inject(WebsocketService);
  public authService = inject(AuthService);
  public drawService = inject(DrawService);

  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private animFrameId = 0;
  public state!: GameState;

  // Global State Signals
  gamePhase = signal<GamePhase>('auth');
  turnNumber = signal(1);
  turnTimer = signal(30);
  cities = signal<City[]>([]);
  winner = signal<City | null>(null);
  canDefend = signal(false);

  // Lobby/Social Signals
  inRoom = signal(false);
  currentRoomId = signal('');
  currentRoomName = signal('');
  roomPlayers = signal<RoomPlayer[]>([]);
  isHost = signal(false);
  myCityId = signal(-1);
  myFactionId = signal(-1);
  myContinentIndex = signal(-1);
  isMyTurn = computed(() => this.state?.currentPlayerIndex === this.state?.cities.findIndex(c => c.id === this.myCityId()));

  // Simplified UI States
  roulette = signal({ visible: false, player: '', skillIdx: -1 });
  showShop = signal(false);
  leaderboardRows = signal<AuthUser[]>([]);

  // Título de la aplicación almacenado en un signal (reactivo)
  protected readonly title = signal('ProyectoFinal');
  // Estado de autenticación: indica si hay una sesión activa
  isLoggedIn = signal(false);
  // Almacena el nombre del usuario actualmente identificado
  currentUser = signal('');

  private mouseX = 0; private mouseY = 0;
  private continentPaths: Path2D[] = [];
  private defenseUsed = false;
  private screenShake = 0;

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.setupSubscriptions();
    this.refreshLeaderboard();
  }

  ngAfterViewInit() {}

  ngOnDestroy() { if (this.animFrameId) cancelAnimationFrame(this.animFrameId); }

  private setupSubscriptions() {
    this.wsService.roomUpdate$.subscribe(players => this.roomPlayers.set(players));
    this.wsService.gameStarted$.subscribe(data => this.startGame(data.players));
    this.wsService.missileLaunched$.subscribe(() => { if(this.state) this.state.phase = 'defending'; this.canDefend.set(true); this.defenseUsed = false; });
    this.wsService.defenseLaunched$.subscribe(data => this.gameService.launchDefense(this.state, data.targetMissileId, data.fromCityId, data.hitSuccess));
    this.wsService.turnAdvanced$.subscribe(data => this.onTurnAdvanced(data));
    this.wsService.skillRoulette$.subscribe(data => this.handleRoulette(data.assignments));
    this.wsService.gameOver$.subscribe(data => { this.winner.set(this.state.cities.find(c => c.name === data.winnerName) || null); this.gamePhase.set('gameover'); });
  }

  async startGame(players: any[]) {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.state = this.gameService.initGame(this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height, players, this.authService.currentUserStats(), this.currentRoomId());
    this.gamePhase.set('setup');
    this.loadGeoJson();
  }

  // --- Core Game Loop ---
  gameLoop() {
    const safeDelta = 16.6;
    if (this.state && this.state.phase !== 'result') {
      this.gameService.updateMissiles(this.state, safeDelta);
      this.gameService.updateExplosions(this.state, safeDelta);
      if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - 0.5);
      this.state.screenShake = this.screenShake;
    }

    if (this.ctx && this.state) {
      this.drawService.render(this.ctx, this.state, this.continentPaths, {
        mouseX: this.mouseX, mouseY: this.mouseY,
        myCityId: this.myCityId(), isMyTurn: this.isMyTurn(), myContinentIndex: this.myContinentIndex(),
        factions: this.gameService.FACTIONS
      });
    }
    this.animFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  // --- Input Handlers ---
  @HostListener('mousemove', ['$event'])
  onCanvasMouseMove(e: MouseEvent) {
    if (!this.canvasRef) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  }

  onCanvasClick(e: MouseEvent) {
    if (this.state && this.state.phase === 'aiming' && this.isMyTurn()) {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      this.wsService.launchMissile(this.currentRoomId(), this.myCityId(), x, y);
      this.state.phase = 'firing';
    }
  }

  handleDefenseClick(missileId: number) {
    if (this.canDefend() && !this.defenseUsed) {
      this.wsService.launchDefense(this.currentRoomId(), missileId, this.myCityId());
      this.defenseUsed = true;
    }
  }

  skipDefense() {
    this.canDefend.set(false);
  }

  callAlliedSupport() {
    // Placeholder for allied support logic
  }

  leaveGame() {
    this.gamePhase.set('setup');
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }

  logout() {
    this.authService.logout();
    this.isLoggedIn.set(false);
    this.gamePhase.set('auth');
  }

  returnToLobby() {
    this.gamePhase.set('setup');
  }

  // --- Helpers ---
  private onTurnAdvanced(data: any) {
    if (this.state) {
      this.state.currentPlayerIndex = data.nextPlayerIndex;
      this.state.turnNumber = data.turnNumber;
      this.state.phase = 'aiming';
    }
    this.turnNumber.set(data.turnNumber);
    this.turnTimer.set(30);
  }

  private handleRoulette(assignments: any[]) {
    const myAss = assignments.find(a => a.playerName === this.authService.displayName());
    if (myAss) {
      this.roulette.set({ visible: true, player: myAss.playerName, skillIdx: myAss.skillIndex });
      setTimeout(() => this.roulette.set({ ...this.roulette(), visible: false }), 4000);
      this.gameService.applySkill(this.state, this.myCityId(), myAss.skillIndex);
    }
  }

  async refreshLeaderboard() {
    const rows = await this.authService.getLeaderboard();
    this.leaderboardRows.set(rows);
  }

  // --- Simplified Lobby methods ---
  async createRoom() {
    const res = await this.wsService.createRoom(this.authService.displayName(), "Sala de " + this.authService.displayName(), true);
    if (res.success) { this.currentRoomId.set(res.roomId); this.inRoom.set(true); this.isHost.set(true); this.myCityId.set(res.cityId); }
  }

  async joinRoom(code: string) {
    const res = await this.wsService.joinRoom(code, this.authService.displayName());
    if (res.success) { this.currentRoomId.set(res.roomId); this.inRoom.set(true); this.isHost.set(false); this.myCityId.set(res.cityId); }
  }

  private loadGeoJson() {
    // Basic paths for continents
    this.continentPaths = [];
    for(let i=0; i<4; i++) {
      const p = new Path2D();
      p.rect(100 + i*200, 100, 150, 150);
      this.continentPaths.push(p);
    }
    this.animFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * Método disparado cuando el componente de Login emite un éxito.
   * Actualiza el estado global de la aplicación para mostrar el Lobby.
   * @param data Objeto con la información del usuario logueado.
   */
  onLoginSuccess(data: {username: string}) {
    this.currentUser.set(data.username); // Guardamos el nombre
    this.isLoggedIn.set(true);          // Cambiamos a modo "logueado"
    this.gamePhase.set('setup');
    this.refreshLeaderboard();
  }

  // Helper getters for template
  currentPlayerName() { return this.state?.cities[this.state.currentPlayerIndex]?.name || 'Nadie'; }
  currentPlayerColor() { return this.state?.cities[this.state.currentPlayerIndex]?.color || '#fff'; }
  rouletteVisible() { return this.roulette().visible; }
  roulettePlayer() { return this.roulette().player; }
  rouletteDisplaySkill() { return 'Skill ' + this.roulette().skillIdx; }
  rouletteSkillDescription() { return 'Descripción de la habilidad'; }
  endReason() { return 'Juego Terminado'; }
  winBonus() { return 100; }
  totalEarnings() { return 500; }
}
