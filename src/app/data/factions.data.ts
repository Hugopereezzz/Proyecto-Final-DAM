import { FactionTemplate } from '../models/game.models';

/**
 * 8 facciones – solo estéticas (nombres, colores, iconos, lore).
 * Todas las mecánicas son idénticas: 500 HP, 50 misiles por ronda.
 */
export const FACTIONS: FactionTemplate[] = [

  // 1. VANGUARDIA DE HIERRO
  {
    id: 'iron_vanguard',
    name: 'Vanguardia de Hierro',
    lore: 'Fortalezas móviles con blindaje pesado. Lentos pero implacables.',
    color: '#7ecfff',
    gradientFrom: '#0d1f35',
    gradientTo: '#1a4a7a',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="iv" cx="50%" cy="40%"><stop offset="0%" stop-color="#7ecfff"/><stop offset="100%" stop-color="#0d1f35"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#iv)" stroke="#7ecfff" stroke-width="2.5"/><rect x="36" y="22" width="28" height="38" rx="5" fill="#a8d8ff" opacity="0.8"/><rect x="42" y="60" width="16" height="20" rx="3" fill="#c0e8ff" opacity="0.7"/><line x1="50" y1="22" x2="50" y2="80" stroke="#fff" stroke-width="2" opacity="0.5"/><line x1="36" y1="41" x2="64" y2="41" stroke="#fff" stroke-width="2" opacity="0.5"/><circle cx="50" cy="14" r="5" fill="#fff" opacity="0.9"/></svg>`,
  },

  // 2. CULTO DE LAS SOMBRAS
  {
    id: 'shadow_cult',
    name: 'Culto de las Sombras',
    lore: 'Alta precisión, alto riesgo. Sus misiles atraviesan la oscuridad.',
    color: '#c77dff',
    gradientFrom: '#12002a',
    gradientTo: '#38006e',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="sc" cx="50%" cy="40%"><stop offset="0%" stop-color="#c77dff"/><stop offset="100%" stop-color="#12002a"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#sc)" stroke="#c77dff" stroke-width="2.5"/><path d="M50 18 Q68 36 62 52 Q74 46 68 64 Q56 57 50 74 Q44 57 32 64 Q26 46 38 52 Q32 36 50 18Z" fill="#c77dff" opacity="0.75"/><circle cx="42" cy="38" r="5" fill="#fff" opacity="0.9"/></svg>`,
  },

  // 3. CÍRCULO DE ASCUAS
  {
    id: 'ember_circle',
    name: 'Círculo de Ascuas',
    lore: 'Ojivas de termita que causan explosiones secundarias masivas.',
    color: '#ff6b35',
    gradientFrom: '#2a0800',
    gradientTo: '#6b1500',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="ec" cx="50%" cy="35%"><stop offset="0%" stop-color="#ffaa44"/><stop offset="100%" stop-color="#2a0800"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#ec)" stroke="#ff6b35" stroke-width="2.5"/><path d="M50 78 Q34 62 38 46 Q28 56 33 34 Q43 46 41 28 Q50 13 50 13 Z" fill="#ff6b35" opacity="0.9"/></svg>`,
  },

  // 4. GUARDIANES DE ESPINAS
  {
    id: 'thorn_wardens',
    name: 'Guardianes de Espinas',
    lore: 'Bio-misiles y cascos autorreparables, increíblemente difíciles de abatir.',
    color: '#52c41a',
    gradientFrom: '#0a1f00',
    gradientTo: '#1a4000',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="tw" cx="50%" cy="40%"><stop offset="0%" stop-color="#7de84a"/><stop offset="100%" stop-color="#0a1f00"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#tw)" stroke="#52c41a" stroke-width="2.5"/><circle cx="50" cy="50" r="18" fill="none" stroke="#52c41a" stroke-width="3" opacity="0.7"/><line x1="50" y1="15" x2="50" y2="85" stroke="#7de84a" stroke-width="2" opacity="0.6"/><line x1="15" y1="50" x2="85" y2="50" stroke="#7de84a" stroke-width="2" opacity="0.6"/></svg>`,
  },

  // 5. HERALDOS DEL VACÍO
  {
    id: 'void_heralds',
    name: 'Heraldos del Vacío',
    lore: 'Ojivas cuánticas que ignoran la realidad física.',
    color: '#00d4ff',
    gradientFrom: '#000820',
    gradientTo: '#001a40',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="vh" cx="50%" cy="50%"><stop offset="0%" stop-color="#00d4ff"/><stop offset="100%" stop-color="#000820"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#vh)" stroke="#00d4ff" stroke-width="2.5"/><circle cx="50" cy="50" r="20" fill="none" stroke="#00d4ff" stroke-width="2" opacity="0.8"/><circle cx="50" cy="50" r="8" fill="#00d4ff" opacity="0.6"/></svg>`,
  },

  // 6. LEGIÓN DE LA TORMENTA
  {
    id: 'storm_legion',
    name: 'Legión de la Tormenta',
    lore: 'Misiles de producción en masa. Nunca dejan de caer.',
    color: '#ffd700',
    gradientFrom: '#191400',
    gradientTo: '#3d3000',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="sl" cx="50%" cy="30%"><stop offset="0%" stop-color="#ffd700"/><stop offset="100%" stop-color="#191400"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#sl)" stroke="#ffd700" stroke-width="2.5"/><path d="M60 20 L40 50 L55 50 L38 80 L70 42 L54 42 Z" fill="#ffd700" opacity="0.85"/></svg>`,
  },

  // 7. PACTO DE HUESOS
  {
    id: 'bone_covenant',
    name: 'Pacto de Huesos',
    lore: 'Sifona la energía vital de los enemigos para alimentar sus sistemas.',
    color: '#c8c8d8',
    gradientFrom: '#0a0a12',
    gradientTo: '#18182e',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bc" cx="50%" cy="40%"><stop offset="0%" stop-color="#c8c8d8"/><stop offset="100%" stop-color="#0a0a12"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#bc)" stroke="#c8c8d8" stroke-width="2.5"/><line x1="35" y1="30" x2="65" y2="70" stroke="#c8c8d8" stroke-width="5" stroke-linecap="round" opacity="0.8"/><line x1="65" y1="30" x2="35" y2="70" stroke="#c8c8d8" stroke-width="5" stroke-linecap="round" opacity="0.8"/><circle cx="35" cy="28" r="7" fill="#c8c8d8" opacity="0.7"/><circle cx="65" cy="28" r="7" fill="#c8c8d8" opacity="0.7"/><circle cx="35" cy="72" r="7" fill="#c8c8d8" opacity="0.7"/><circle cx="65" cy="72" r="7" fill="#c8c8d8" opacity="0.7"/></svg>`,
  },

  // 8. ORDEN RADIANTE
  {
    id: 'radiant_order',
    name: 'Orden Radiante',
    lore: 'Misiles sagrados que castigan al enemigo con luz divina.',
    color: '#ffee58',
    gradientFrom: '#1e1400',
    gradientTo: '#4a3400',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="ro" cx="50%" cy="40%"><stop offset="0%" stop-color="#ffe060"/><stop offset="100%" stop-color="#1e1400"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#ro)" stroke="#ffee58" stroke-width="2.5"/><polygon points="50,22 57,42 78,42 61,55 68,75 50,62 32,75 39,55 22,42 43,42" fill="#ffee58" opacity="0.85"/></svg>`,
  },
];
