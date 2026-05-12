import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { SocketService } from '../../services/socket.service';
import { FactionCardComponent } from '../faction-card/faction-card.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-faction-select',
  standalone: true,
  imports: [CommonModule, FactionCardComponent],
  template: `
    <div class="select-wrap">

      <!-- Header -->
      <div class="select-header">
        <div class="title-col">
          <span class="pre-title">🚀 GUERRA DE MISILES</span>
          <h1 class="main-title">Elige tu Facción</h1>
          <p class="sub-title">
            {{ game.isMultiplayer()
              ? 'Selecciona tu facción para la batalla. Cada ronda dispondrás de 50 misiles.'
              : 'Selecciona 2–8 facciones. Los jugadores planifican simultáneamente cada ronda.' }}
          </p>
        </div>
        <div class="counter-col">
          <div class="counter-ring" [class.ready]="game.selectedFactionIds().length >= 2">
            <span class="c-num">{{ game.selectedFactionIds().length }}</span>
            <span class="c-den">/ 8</span>
          </div>
          <span class="c-label" [class.ready]="game.selectedFactionIds().length >= 2">
            {{ game.selectedFactionIds().length >= 2 ? '✅ ¡Listo!' : 'Faltan ≥ 2' }}
          </span>
        </div>
      </div>

      <!-- Info banner -->
      <div class="rules-banner">
        <div class="rule">🚀 <strong>50 misiles</strong> por ronda</div>
        <div class="rule">⚔️ <strong>1 misil</strong> = 1 daño</div>
        <div class="rule">🛡️ <strong>2 misiles</strong> = 1 escudo</div>
        <div class="rule">⏱️ <strong>30 s</strong> para planificar</div>
        <div class="rule">❤️ <strong>500 HP</strong> cada facción</div>
      </div>

      <!-- Multiplayer: player selections -->
      @if (game.isMultiplayer()) {
        <div class="multiplayer-status">
          @for (p of game.multiplayerPlayers(); track p.socketId) {
            <div class="player-sel-pill" [class.ready]="!!jugadoresSelecciones()[p.socketId]">
              <span class="p-bullet">●</span>
              <span class="p-name">{{ p.nombre }}:</span>
              <span class="p-faction" [style.color]="getFaction(jugadoresSelecciones()[p.socketId])?.color">
                {{ getFaction(jugadoresSelecciones()[p.socketId])?.name || 'Eligiendo...' }}
              </span>
            </div>
          }
        </div>
      }

      <!-- Selected strip (local) -->
      @if (!game.isMultiplayer() && game.selectedFactionIds().length > 0) {
        <div class="selected-strip">
          @for (id of game.selectedFactionIds(); track id) {
            <div class="sel-pill"
              [style.border-color]="getFaction(id)?.color"
              [style.background]="getFaction(id)?.gradientFrom">
              <span class="pill-icon" [innerHTML]="getFaction(id)?.svgIcon"></span>
              <span class="pill-name">{{ getFaction(id)?.name }}</span>
              <button class="pill-rm" (click)="game.toggleFaction(id)" title="Quitar">✕</button>
            </div>
          }
        </div>
      }

      <!-- Faction Grid -->
      <div class="factions-grid">
        @for (f of game.factions; track f.id) {
          <app-faction-card
            [faction]="f"
            [selected]="game.selectedFactionIds().includes(f.id)"
            [disabled]="game.selectedFactionIds().length >= 8 && !game.selectedFactionIds().includes(f.id)"
            (selectedChange)="toggleFaction(f.id)"
          />
        }
      </div>

      <!-- Action row -->
      <div class="action-row">
        <button class="start-btn" [disabled]="!canStartBattle()" (click)="startBattle()">
          🚀 LANZAR BATALLA
          @if (game.isMultiplayer()) {
            <span class="start-count">{{ Object.keys(jugadoresSelecciones()).length }} / {{ game.multiplayerPlayers().length }}</span>
          }
        </button>
        @if (!game.isMultiplayer()) {
          <button class="quick-btn" (click)="quickStart()">🎲 Aleatorio 4</button>
          <button class="all-btn"   (click)="allFactions()">⚡ Todas (8)</button>
        }
      </div>

    </div>
  `,
  styles: [`
    .select-wrap { display: flex; flex-direction: column; gap: 20px; padding: 24px; max-width: 1200px; margin: 0 auto; }
    .select-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
    .title-col { flex: 1; }
    .pre-title { font-size: 0.68rem; font-weight: 800; letter-spacing: 0.2em; color: rgba(255,255,255,0.4); display: block; margin-bottom: 6px; }
    .main-title { font-size: 2rem; font-weight: 900; margin: 0; background: linear-gradient(135deg,#fff 30%,rgba(255,255,255,0.45)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .sub-title { margin: 8px 0 0; color: rgba(255,255,255,0.48); font-size: 0.82rem; }
    .counter-col { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .counter-ring { width: 70px; height: 70px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.35); transition: all 0.4s; flex-direction: column; }
    .counter-ring.ready { border-color: #22c55e; box-shadow: 0 0 20px rgba(34,197,94,0.4); }
    .c-num { font-size: 1.4rem; font-weight: 900; color: #fff; } .c-den { font-size: 0.72rem; color: rgba(255,255,255,0.38); }
    .c-label { font-size: 0.68rem; font-weight: 700; color: rgba(255,255,255,0.45); } .c-label.ready { color: #22c55e; }

    .rules-banner { display: flex; gap: 10px; flex-wrap: wrap; padding: 12px 16px; background: rgba(0,212,255,0.06); border: 1px solid rgba(0,212,255,0.15); border-radius: 12px; }
    .rule { font-size: 0.72rem; color: rgba(255,255,255,0.7); padding: 3px 10px; background: rgba(255,255,255,0.05); border-radius: 20px; }
    .rule strong { color: #00d4ff; }

    .multiplayer-status { display: flex; gap: 10px; flex-wrap: wrap; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 10px; }
    .player-sel-pill { display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; transition: 0.3s; }
    .player-sel-pill.ready { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.3); }
    .p-bullet { font-size: 8px; color: rgba(255,255,255,0.2); } .player-sel-pill.ready .p-bullet { color: #22c55e; }
    .p-name { font-size: 0.75rem; font-weight: 600; color: rgba(255,255,255,0.6); } .p-faction { font-size: 0.75rem; font-weight: 800; }

    .selected-strip { display: flex; gap: 8px; flex-wrap: wrap; padding: 12px 14px; background: rgba(0,0,0,0.3); border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); }
    .sel-pill { display: flex; align-items: center; gap: 5px; border: 1.5px solid; border-radius: 20px; padding: 3px 8px 3px 5px; }
    .pill-icon { width: 20px; height: 20px; } .pill-icon ::ng-deep svg { width: 100%; height: 100%; }
    .pill-name { font-size: 0.7rem; font-weight: 700; color: #fff; }
    .pill-rm { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.35); font-size: 0.68rem; padding: 0 2px; transition: color 0.2s; } .pill-rm:hover { color: #ef4444; }

    .factions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }

    .action-row { display: flex; gap: 10px; align-items: center; justify-content: center; padding-bottom: 24px; }
    .start-btn { display: flex; align-items: center; gap: 10px; background: linear-gradient(135deg,#7c3aed,#4f46e5); border: none; border-radius: 14px; padding: 15px 32px; cursor: pointer; font-size: 0.95rem; font-weight: 900; color: #fff; letter-spacing: 0.07em; transition: all 0.25s; box-shadow: 0 8px 28px rgba(124,58,237,0.4); }
    .start-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 14px 38px rgba(124,58,237,0.6); }
    .start-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .start-count { font-size: 0.68rem; background: rgba(255,255,255,0.2); border-radius: 20px; padding: 2px 8px; }
    .quick-btn, .all-btn { background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.14); color: rgba(255,255,255,0.65); border-radius: 12px; padding: 15px 20px; cursor: pointer; font-size: 0.82rem; font-weight: 700; transition: all 0.2s; }
    .quick-btn:hover, .all-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
    @media (max-width: 600px) { .main-title { font-size: 1.4rem; } .factions-grid { grid-template-columns: 1fr 1fr; } .action-row { flex-direction: column; } }
  `]
})
export class FactionSelectComponent implements OnInit, OnDestroy {
  game = inject(GameService);
  socketService = inject(SocketService);
  private subs: Subscription[] = [];

  jugadoresSelecciones = signal<Record<string, string>>({});
  Object = Object;

  canStartBattle = computed(() => {
    if (!this.game.isMultiplayer()) return this.game.selectedFactionIds().length >= 2;
    const sel = Object.keys(this.jugadoresSelecciones()).length;
    const tot = this.game.multiplayerPlayers().length;
    return sel === tot && tot >= 2;
  });

  ngOnInit() {
    if (this.game.isMultiplayer()) {
      this.subs.push(
        this.socketService.onJugadorEligioFaccion().subscribe(data => {
          this.jugadoresSelecciones.update(s => ({ ...s, [data.socketId]: data.faccionId }));
        }),
        this.socketService.onBatallaComenzada().subscribe(datos => {
          this.game.startBattle(datos.ids, datos.order, datos.nombres);
        })
      );
    }
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

  getFaction(id: string) { return this.game.factions.find(f => f.id === id); }

  toggleFaction(id: string) {
    if (this.game.isMultiplayer()) {
      this.game.selectedFactionIds.set([id]);
      this.socketService.seleccionarFaccion(id);
      this.jugadoresSelecciones.update(s => ({ ...s, [this.socketService.getMiSocketId()]: id }));
    } else {
      this.game.toggleFaction(id);
    }
  }

  startBattle() {
    if (this.game.isMultiplayer()) {
      const players = this.game.multiplayerPlayers();
      const ids: string[]    = [];
      const nombres: string[] = [];
      for (const p of players) {
        ids.push(this.jugadoresSelecciones()[p.socketId]);
        nombres.push(p.nombre);
      }
      const order = ids.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      this.socketService.comenzarBatalla({ ids, order, nombres });
    } else {
      if (this.game.selectedFactionIds().length >= 2)
        this.game.startBattle(this.game.selectedFactionIds());
    }
  }

  quickStart() {
    const shuffled = [...this.game.factions].sort(() => Math.random() - 0.5).slice(0, 4);
    this.game.startBattle(shuffled.map(f => f.id));
  }

  allFactions() { this.game.startBattle(this.game.factions.map(f => f.id)); }
}
