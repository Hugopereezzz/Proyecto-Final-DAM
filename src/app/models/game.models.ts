// ── Action types (simplified) ──────────────────────────────────────
export type ActionType = 'attack' | 'shield' | 'death' | 'status' | 'round_start' | 'resolve';

// ── A single attack assignment inside a player's plan ───────────────
export interface AttackAssignment {
  targetIdx: number;
  missiles: number;
}

// ── A player's full plan for one round ──────────────────────────────
export interface PlayerPlan {
  actorIdx: number;
  attacks: AttackAssignment[];   // list of attacks (can target multiple enemies)
  shieldMissiles: number;        // missiles spent on shield (2 missiles = 1 shield point)
  totalSpent: number;            // must be ≤ 50
  confirmed: boolean;
}

// ── One resolved attack event (used in battle log) ──────────────────
export interface RoundResult {
  actorIdx: number;
  targetIdx: number;
  incomingDamage: number;        // raw damage before shield
  shieldAbsorbed: number;        // how much shield ate
  hpDamage: number;              // actual HP lost
  shieldBroken: boolean;         // true if this hit shattered the shield
}

// ── Faction template (cosmetic only – no mechanics) ──────────────────
export interface FactionTemplate {
  id: string;
  name: string;
  lore: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  svgIcon: string;
}

// ── Fighter (in-battle state) ────────────────────────────────────────
export interface Fighter {
  factionId: string;
  playerName: string;
  name: string;
  hp: number;
  maxHp: number;
  missiles: number;              // always reset to 50 at round start
  shieldHp: number;              // absorbed damage before HP
  alive: boolean;
  surrendered?: boolean;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  svgIcon: string;
  lore: string;
  planConfirmed: boolean;        // has this player confirmed their plan?
}

// ── Battle log entry ─────────────────────────────────────────────────
export interface BattleLogEntry {
  round: number;
  actorName: string;
  targetName: string;
  icon: string;
  message: string;
  type: ActionType;
  value?: number;
}

// planning  → players assign missiles (30s timer)
// resolving → server/host resolves all actions simultaneously
export type GamePhase = 'login' | 'lobby' | 'planning' | 'resolving' | 'gameover';
