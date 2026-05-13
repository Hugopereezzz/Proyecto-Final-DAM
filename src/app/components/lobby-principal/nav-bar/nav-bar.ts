// src/app/components/lobby-principal/nav-bar/nav-bar.ts
import { Component, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { GameService } from '../../../services/game.service';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [UpperCasePipe],
  templateUrl: './nav-bar.html',
  styleUrls: ['./nav-bar.css']
})
export class NavBarComponent {
  readonly game = inject(GameService);
}
