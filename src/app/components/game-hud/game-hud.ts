import { Component, input, output } from '@angular/core';
import { City, GamePhase } from '../../models/game.models';
import { AuthService } from '../../auth.service';
import { GameService } from '../../game.service';
import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-hud',
  imports: [CommonModule],
  templateUrl: './game-hud.html',
  styleUrl: './game-hud.css'
})
export class GameHudComponent {
  public authService = inject(AuthService);
  public gameService = inject(GameService);

  cities             = input.required<City[]>();
  gamePhase          = input.required<GamePhase>();
  turnNumber         = input.required<number>();
  turnTimer          = input.required<number>();
  currentPlayerName  = input.required<string>();
  currentPlayerColor = input.required<string>();
  isMyTurn           = input.required<boolean>();
  canDefend          = input.required<boolean>();
  lootEarned         = input.required<number>();

  skipDefense  = output<void>();
  callAllies   = output<void>();
  leaveGame    = output<void>();

  get Math() { return Math; }

  getCityRank(city: City) {
    return this.gameService.getRank(city.xp || 0);
  }
}
