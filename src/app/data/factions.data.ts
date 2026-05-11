import { FactionTemplate } from '../models/game.models';

/**
 * 8 facciones basadas en:
 *  - ~500 HP base
 *  - 50 misiles base
 *  - Daño base para un misil estándar = 50 HP.
 */
export const FACTIONS: FactionTemplate[] = [

  // 1. VANGUARDIA DE HIERRO – La Fortaleza
  {
    id: 'iron_vanguard',
    name: 'Vanguardia de Hierro',
    lore: 'Fortalezas móviles con blindaje pesado. Sus disparos son lentos pero implacables.',
    color: '#7ecfff',
    gradientFrom: '#0d1f35',
    gradientTo: '#1a4a7a',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="iv" cx="50%" cy="40%"><stop offset="0%" stop-color="#7ecfff"/><stop offset="100%" stop-color="#0d1f35"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#iv)" stroke="#7ecfff" stroke-width="2.5"/><rect x="36" y="22" width="28" height="38" rx="5" fill="#a8d8ff" opacity="0.8"/><rect x="42" y="60" width="16" height="20" rx="3" fill="#c0e8ff" opacity="0.7"/><line x1="50" y1="22" x2="50" y2="80" stroke="#fff" stroke-width="2" opacity="0.5"/><line x1="36" y1="41" x2="64" y2="41" stroke="#fff" stroke-width="2" opacity="0.5"/><circle cx="50" cy="14" r="5" fill="#fff" opacity="0.9"/></svg>`,
    baseHp: 700,
    baseArmor: 25,
    baseMissiles: 45,
    abilities: [
      { id:'iv_shell', name:'Proyectil Vanguardia', description:'Impacto estándar: 50 de daño.', icon:'💥', type:'missile', damage:50, missileCost:4, cooldown:0, currentCooldown:0 },
      { id:'iv_barricade', name:'Fortificar', description:'Despliega escudos: +150 HP de escudo.', icon:'🛡️', type:'shield', shieldAmount:150, missileCost:2, cooldown:4, currentCooldown:0 },
      { id:'iv_siege', name:'Ráfaga de Asedio', description:'Alto impacto: 100 de daño.', icon:'🔥', type:'burst', damage:100, missileCost:10, cooldown:5, currentCooldown:0 },
      { id:'iv_reload', name:'Caja de Munición', description:'Reabastecimiento: +15 misiles.', icon:'📦', type:'reload', reloadMissiles:15, missileCost:0, cooldown:6, currentCooldown:0 },
    ],
    passive: { name: 'Blindaje Reactivo', description: 'Recupera 10 HP al final de su turno.', icon: '🛠️' }
  },

  // 2. CULTO DE LAS SOMBRAS – El Cañón de Cristal
  {
    id: 'shadow_cult',
    name: 'Culto de las Sombras',
    lore: 'Alta precisión, alto riesgo. Sus misiles atraviesan defensas a costa de su propia durabilidad.',
    color: '#c77dff',
    gradientFrom: '#12002a',
    gradientTo: '#38006e',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="sc" cx="50%" cy="40%"><stop offset="0%" stop-color="#c77dff"/><stop offset="100%" stop-color="#12002a"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#sc)" stroke="#c77dff" stroke-width="2.5"/><path d="M50 18 Q68 36 62 52 Q74 46 68 64 Q56 57 50 74 Q44 57 32 64 Q26 46 38 52 Q32 36 50 18Z" fill="#c77dff" opacity="0.75"/><circle cx="42" cy="38" r="5" fill="#fff" opacity="0.9"/></svg>`,
    baseHp: 400,
    baseArmor: 8,
    baseMissiles: 65,
    abilities: [
      { id:'sc_snipe', name:'Disparo del Vacío', description:'Ignora armadura: 75 de daño.', icon:'🎯', type:'snipe', damage:75, missileCost:6, cooldown:2, currentCooldown:0 },
      { id:'sc_burst', name:'Furia Sombría', description:'Ataque rápido: 120 de daño.', icon:'🌑', type:'burst', damage:120, missileCost:10, cooldown:4, currentCooldown:0 },
      { id:'sc_drain', name:'Segador de Almas', description:'Roba 60 HP del enemigo.', icon:'🩸', type:'drain', damage:90, healHp:60, missileCost:8, cooldown:4, currentCooldown:0 },
      { id:'sc_reload', name:'Alijo del Vacío', description:'Materializa munición: +20 misiles.', icon:'💜', type:'reload', reloadMissiles:20, missileCost:0, cooldown:6, currentCooldown:0 },
    ],
    passive: { name: 'Velo Sombrío', description: 'Gana 10 de escudo cada vez que usa una habilidad.', icon: '🌌' }
  },

  // 3. CÍRCULO DE ASCUAS – El Piromante
  {
    id: 'ember_circle',
    name: 'Círculo de Ascuas',
    lore: 'Ojivas de termita que causan explosiones secundarias masivas.',
    color: '#ff6b35',
    gradientFrom: '#2a0800',
    gradientTo: '#6b1500',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="ec" cx="50%" cy="35%"><stop offset="0%" stop-color="#ffaa44"/><stop offset="100%" stop-color="#2a0800"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#ec)" stroke="#ff6b35" stroke-width="2.5"/><path d="M50 78 Q34 62 38 46 Q28 56 33 34 Q43 46 41 28 Q50 13 50 13 Z" fill="#ff6b35" opacity="0.9"/></svg>`,
    baseHp: 500,
    baseArmor: 15,
    baseMissiles: 55,
    abilities: [
      { id:'ec_rocket', name:'Cohete Ígneo', description:'Estándar: 55 de daño.', icon:'🔥', type:'missile', damage:55, missileCost:5, cooldown:0, currentCooldown:0 },
      { id:'ec_aoe', name:'Bomba de Termita', description:'Área: 90 de daño puro.', icon:'💣', type:'aoe', aoeDamage:90, missileCost:10, cooldown:4, currentCooldown:0 },
      { id:'ec_burst', name:'Tormenta Infernal', description:'Calor extremo: 130 de daño.', icon:'🌋', type:'burst', damage:130, missileCost:15, cooldown:5, currentCooldown:0 },
      { id:'ec_reload', name:'Célula de Calor', description:'Recarga: +18 misiles.', icon:'☀️', type:'reload', reloadMissiles:18, missileCost:0, cooldown:6, currentCooldown:0 },
    ],
    passive: { name: 'Post-Combustión', description: 'Sus ataques de misiles infligen 10 de daño extra.', icon: '🧨' }
  },

  // 4. GUARDIANES DE ESPINAS – El Protector
  {
    id: 'thorn_wardens',
    name: 'Guardianes de Espinas',
    lore: 'Bio-misiles y cascos autorreparables los hacen increíblemente difíciles de abatir.',
    color: '#52c41a',
    gradientFrom: '#0a1f00',
    gradientTo: '#1a4000',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="tw" cx="50%" cy="40%"><stop offset="0%" stop-color="#7de84a"/><stop offset="100%" stop-color="#0a1f00"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#tw)" stroke="#52c41a" stroke-width="2.5"/></svg>`,
    baseHp: 650,
    baseArmor: 20,
    baseMissiles: 45,
    abilities: [
      { id:'tw_spike', name:'Misil de Espinas', description:'Golpe rápido: 45 de daño.', icon:'🌿', type:'missile', damage:45, missileCost:4, cooldown:0, currentCooldown:0 },
      { id:'tw_repair', name:'Bio-Regeneración', description:'Reparación orgánica: +140 HP.', icon:'💚', type:'reload', healHp:140, missileCost:2, cooldown:4, currentCooldown:0 },
      { id:'tw_shield', name:'Égida de Raíces', description:'Escudo orgánico: +110 de escudo.', icon:'🪨', type:'shield', shieldAmount:110, missileCost:0, cooldown:5, currentCooldown:0 },
      { id:'tw_reload', name:'Suministro de Esporas', description:'Regenera munición: +16 misiles.', icon:'🌱', type:'reload', reloadMissiles:16, missileCost:0, cooldown:6, currentCooldown:0 },
    ],
    passive: { name: 'Fotosíntesis', description: 'Gana 3 misiles al inicio de su turno.', icon: '🍃' }
  },

  // 5. HERALDOS DEL VACÍO – El Imparable
  {
    id: 'void_heralds',
    name: 'Heraldos del Vacío',
    lore: 'Ojivas cuánticas que ignoran la realidad física y el blindaje.',
    color: '#00d4ff',
    gradientFrom: '#000820',
    gradientTo: '#001a40',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="vh" cx="50%" cy="50%"><stop offset="0%" stop-color="#00d4ff"/><stop offset="100%" stop-color="#000820"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#vh)" stroke="#00d4ff" stroke-width="2.5"/></svg>`,
    baseHp: 480,
    baseArmor: 18,
    baseMissiles: 55,
    abilities: [
      { id:'vh_snipe', name:'Pulso del Vacío', description:'Ignora armadura: 60 de daño.', icon:'🌀', type:'snipe', damage:60, missileCost:5, cooldown:0, currentCooldown:0 },
      { id:'vh_aoe', name:'Bomba de Gravedad', description:'Área: 80 de daño puro.', icon:'💫', type:'aoe', aoeDamage:80, missileCost:12, cooldown:4, currentCooldown:0 },
      { id:'vh_burst', name:'Horizonte de Sucesos', description:'Erradicación total: 140 de daño.', icon:'🕳️', type:'burst', damage:140, missileCost:16, cooldown:6, currentCooldown:0 },
      { id:'vh_reload', name:'Sifón del Vacío', description:'Recupera munición: +18 misiles.', icon:'♾️', type:'reload', reloadMissiles:18, missileCost:0, cooldown:6, currentCooldown:0 },
    ],
    passive: { name: 'Entropía', description: 'Ignora 5 de armadura enemiga permanentemente.', icon: '⚛️' }
  },

  // 6. LEGIÓN DE LA TORMENTA – El Enjambre
  {
    id: 'storm_legion',
    name: 'Legión de la Tormenta',
    lore: 'Misiles de producción en masa. Individualmente débiles, pero nunca dejan de caer.',
    color: '#ffd700',
    gradientFrom: '#191400',
    gradientTo: '#3d3000',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="sl" cx="50%" cy="30%"><stop offset="0%" stop-color="#ffd700"/><stop offset="100%" stop-color="#191400"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#sl)" stroke="#ffd700" stroke-width="2.5"/></svg>`,
    baseHp: 520,
    baseArmor: 10,
    baseMissiles: 80,
    abilities: [
      { id:'sl_rapid', name:'Disparo Eléctrico', description:'Barato: 35 de daño.', icon:'⚡', type:'missile', damage:35, missileCost:2, cooldown:0, currentCooldown:0 },
      { id:'sl_burst', name:'Volea de Tormenta', description:'Muchos disparos: 85 de daño.', icon:'🌩️', type:'burst', damage:85, missileCost:8, cooldown:3, currentCooldown:0 },
      { id:'sl_aoe', name:'Trueno', description:'Área: 100 de daño.', icon:'🌪️', type:'aoe', aoeDamage:100, missileCost:12, cooldown:5, currentCooldown:0 },
      { id:'sl_reload', name:'Carga Estática', description:'Recarga: +25 misiles.', icon:'☄️', type:'reload', reloadMissiles:25, missileCost:0, cooldown:6, currentCooldown:0 },
    ],
    passive: { name: 'Sobrecarga', description: 'Tiene un 15% de probabilidad de no consumir misiles al atacar.', icon: '🔋' }
  },

  // 7. PACTO DE HUESOS – El Segador
  {
    id: 'bone_covenant',
    name: 'Pacto de Huesos',
    lore: 'Sifona la energía vital de los enemigos para alimentar sus propios sistemas.',
    color: '#c8c8d8',
    gradientFrom: '#0a0a12',
    gradientTo: '#18182e',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bc" cx="50%" cy="40%"><stop offset="0%" stop-color="#c8c8d8"/><stop offset="100%" stop-color="#0a0a12"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#bc)" stroke="#c8c8d8" stroke-width="2.5"/></svg>`,
    baseHp: 550,
    baseArmor: 20,
    baseMissiles: 50,
    abilities: [
      { id:'bc_necro', name:'Disparo Necrótico', description:'Estándar: 50 de daño.', icon:'💀', type:'missile', damage:50, missileCost:5, cooldown:0, currentCooldown:0 },
      { id:'bc_drain', name:'Sifón de Almas', description:'Drenaje: 90 de daño, +60 HP.', icon:'🩸', type:'drain', damage:90, healHp:60, missileCost:10, cooldown:4, currentCooldown:0 },
      { id:'bc_shield', name:'Escudo Óseo', description:'Escudo: +110 de escudo.', icon:'🦴', type:'shield', shieldAmount:110, missileCost:2, cooldown:5, currentCooldown:0 },
      { id:'bc_reload', name:'Saqueo de Tumbas', description:'Reabastecer: +18 misiles.', icon:'☠️', type:'reload', reloadMissiles:18, missileCost:0, cooldown:6, currentCooldown:0 },
    ],
    passive: { name: 'Cosecha de Almas', description: 'Cuando un enemigo muere, recupera 100 HP.', icon: '⚰️' }
  },

  // 8. ORDEN RADIANTE – El Guardián
  {
    id: 'radiant_order',
    name: 'Orden Radiante',
    lore: 'Misiles sagrados que castigan al enemigo mientras otorgan protección divina.',
    color: '#ffee58',
    gradientFrom: '#1e1400',
    gradientTo: '#4a3400',
    svgIcon: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="ro" cx="50%" cy="40%"><stop offset="0%" stop-color="#ffe060"/><stop offset="100%" stop-color="#1e1400"/></radialGradient></defs><polygon points="50,5 95,30 95,70 50,95 5,70 5,30" fill="url(#ro)" stroke="#ffee58" stroke-width="2.5"/></svg>`,
    baseHp: 580,
    baseArmor: 25,
    baseMissiles: 50,
    abilities: [
      { id:'ro_smite', name:'Misil Sagrado', description:'Divino: 50 de daño.', icon:'✝️', type:'missile', damage:50, missileCost:5, cooldown:0, currentCooldown:0 },
      { id:'ro_repair', name:'Remiendo Sagrado', description:'Reparación: +130 HP.', icon:'💛', type:'reload', healHp:130, missileCost:2, cooldown:4, currentCooldown:0 },
      { id:'ro_shield', name:'Égida Solar', description:'Escudo: +150 de escudo.', icon:'☀️', type:'shield', shieldAmount:150, missileCost:0, cooldown:5, currentCooldown:0 },
      { id:'ro_reload', name:'Don Divino', description:'Reabastecimiento: +18 misiles.', icon:'⚖️', type:'reload', reloadMissiles:18, missileCost:0, cooldown:6, currentCooldown:0 },
    ],
    passive: { name: 'Resplandor', description: 'Otorga un 10% de reducción de daño adicional.', icon: '✨' }
  },
];
