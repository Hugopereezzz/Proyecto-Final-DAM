export type AbilityType = 'missile' | 'burst' | 'shield' | 'reload' | 'snipe' | 'aoe' | 'drain';

export interface Ability {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: AbilityType;
  damage?: number;          // direct damage
  missileCost: number;      // missiles consumed
  healHp?: number;          // HP recovered (reload/repair)
  reloadMissiles?: number;  // missiles restored
  shieldAmount?: number;    // temp HP shield
  aoeDamage?: number;       // flat AOE damage ignoring defense
  cooldown: number;
  currentCooldown: number;
}

export interface StatusEffect {
  name: string;
  icon: string;
  turnsLeft: number;
  shieldHp?: number;
}

export interface FactionTemplate {
  id: string;
  name: string;
  lore: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  svgIcon: string;
  // Base stats (tweak per faction from 500 HP / 50 missiles)
  baseHp: number;
  baseArmor: number;        // damage reduction flat
  baseMissiles: number;
  abilities: Ability[];
  passive: {
    name: string;
    description: string;
    icon: string;
  };
}

export interface Fighter {
  factionId: string;
  playerName: string;
  name: string;
  hp: number;
  maxHp: number;
  missiles: number;
  maxMissiles: number;
  armor: number;
  alive: boolean;
  surrendered?: boolean;
  shieldHp: number;
  statusEffects: StatusEffect[];
  color: string;
  gradientFrom: string;
  gradientTo: string;
  svgIcon: string;
  lore: string;
  abilities: Ability[];
  passive: {
    name: string;
    description: string;
    icon: string;
  };
}

export interface BattleLogEntry {
  turn: number;
  actorName: string;
  targetName: string;
  abilityName: string;
  abilityIcon: string;
  message: string;
  type: AbilityType | 'death' | 'status';
  value?: number;
}

export type GamePhase = 'login' | 'lobby' | 'selection' | 'battle' | 'gameover';
