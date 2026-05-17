// ── Tipos de accion ──────────────────────────────────────
// Define los posibles eventos que pueden ocurrir en la partida y mostrarse en el registro
export type ActionType = 'attack' | 'shield' | 'death' | 'status' | 'round_start' | 'resolve';

// ── Ataque individual ───────────────
// Representa cuántos misiles dispara un jugador contra un objetivo en concreto
export interface AttackAssignment {
  targetIdx: number;
  missiles: number;
}

// ── Plan completo de un jugador ──────────────────────────────
// Contiene todas las decisiones de un jugador en una ronda
export interface PlayerPlan {
  actorIdx: number;
  attacks: AttackAssignment[];   // Lista de ataques (a quien y cuantos misiles)
  shieldMissiles: number;        // Misiles gastados en escudo (2 misiles = 1 punto de escudo)
  totalSpent: number;            // Total gastado (no puede ser mayor de 50)
  confirmed: boolean;            // Indica si el jugador ya fijó su plan
}

// ── Evento de ataque resuelto ──────────────────
// Guarda el resultado de un ataque para luego mostrarlo en el log
export interface RoundResult {
  actorIdx: number;
  targetIdx: number;
  incomingDamage: number;        // Daño bruto antes de aplicar escudo
  shieldAbsorbed: number;        // Daño absorbido por el escudo
  hpDamage: number;              // Vida real perdida
  shieldBroken: boolean;         // Indica si el escudo se rompió con este ataque
}

// ── Plantilla de Faccion ──────────────────────────────────
// Define como se ve una faccion (solo es visual, no afecta a las stats)
export interface FactionTemplate {
  id: string;
  name: string;
  lore: string;                  // Breve historia de la faccion
  color: string;
  gradientFrom: string;
  gradientTo: string;
  svgIcon: string;               // Icono para la UI
}

// ── Combatiente ────────────────────────────────────────
// Representa el estado de un jugador dentro de la batalla
export interface Fighter {
  factionId: string;
  playerName: string;            // Nombre del usuario que lo controla
  name: string;                  // Nombre de la faccion
  hp: number;                    // Puntos de vida actuales
  maxHp: number;                 // Vida maxima
  missiles: number;              // Misiles disponibles (se resetea a 50 cada ronda)
  shieldHp: number;              // Escudo disponible para absorber daño
  alive: boolean;                // Indica si sigue vivo
  surrendered?: boolean;         // Indica si se rindio voluntariamente
  color: string;
  gradientFrom: string;
  gradientTo: string;
  svgIcon: string;
  lore: string;
  planConfirmed: boolean;        // ¿Ya confirmo sus movimientos para esta ronda?
}

// ── Registro de batalla ─────────────────────────────────────────────────
// Representa una linea en el historial de combate
export interface BattleLogEntry {
  round: number;
  actorName: string;             // Quien hizo la accion
  targetName: string;            // Quien la recibio
  icon: string;
  message: string;
  type: ActionType;
  value?: number;
}

// ── Fases del juego ─────────────────────────────────────────────────
// login     -> pantalla de inicio
// lobby     -> donde se espera a otros jugadores o se configura la partida
// planning  -> jugadores deciden a donde disparar (30s)
// resolving -> calculando resultados
// gameover  -> partida terminada, pantalla de victoria
export type GamePhase = 'login' | 'lobby' | 'planning' | 'resolving' | 'gameover';
