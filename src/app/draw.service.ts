import { Injectable } from '@angular/core';
import { GameState, City, Missile } from './models/game.models';

@Injectable({
  providedIn: 'root'
})
export class DrawService {
  private missileImg: HTMLImageElement;
  private spriteCache: Map<string, HTMLCanvasElement> = new Map();

  constructor() {
    this.missileImg = new Image();
    this.missileImg.crossOrigin = 'anonymous';
    this.missileImg.onload = () => console.log('✅ Missile sprite loaded successfully');
    this.missileImg.onerror = () => console.error('❌ Failed to load missile sprite from /missile.png');
    this.missileImg.src = '/missile.png';
  }

  private getTintedSprite(color: string): HTMLCanvasElement {
    if (this.spriteCache.has(color)) return this.spriteCache.get(color)!;
    
    const canvas = document.createElement('canvas');
    canvas.width = 60; canvas.height = 30;
    const ctx = canvas.getContext('2d')!;
    
    ctx.drawImage(this.missileImg, 0, 0, 60, 30);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 60, 30);
    
    this.spriteCache.set(color, canvas);
    return canvas;
  }


  public render(
    ctx: CanvasRenderingContext2D, 
    state: GameState, 
    screenShake: number, 
    continentPaths: Path2D[],
    opts: { mouseX: number, mouseY: number, myCityId: number, isMyTurn: boolean, myContinentIndex: number }
  ) {
    if (!ctx || !state) return;

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // 1. Background
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, width, height);

    // Global Event Tint
    if (state.globalEvent?.type === 'solar-storm') {
       const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
       grad.addColorStop(0, 'rgba(255, 100, 0, 0.05)');
       grad.addColorStop(1, 'transparent');
       ctx.fillStyle = grad;
       ctx.fillRect(0, 0, width, height);
    }

    // 2. Shake & Stars
    ctx.save();
    if (state.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * state.screenShake, (Math.random() - 0.5) * state.screenShake);
    }
    for (const star of state.stars) {
      ctx.globalAlpha = star.alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2.5 Weather Rendering
    this.drawWeather(ctx, state);

    // 3. Continents
    if (continentPaths.length > 0) {
      continentPaths.forEach((path, idx) => {
        const isMine = idx === opts.myContinentIndex;
        if (isMine) {
          ctx.strokeStyle = state.cities.find(c => c.id === opts.myCityId)?.color || '#00e5ff';
          ctx.lineWidth = 2.5;
          ctx.fillStyle = ctx.strokeStyle + '44';
          ctx.shadowBlur = 15;
          ctx.shadowColor = ctx.strokeStyle;
        } else {
          ctx.strokeStyle = 'rgba(0, 150, 255, 0.25)';
          ctx.lineWidth = 1;
          ctx.fillStyle = 'rgba(10, 40, 80, 0.4)';
          ctx.shadowBlur = 0;
        }
        ctx.fill(path);
        ctx.stroke(path);
      });
      ctx.shadowBlur = 0; 
    }

    // 3.5 Weather Indicator
    this.drawWeatherIndicator(ctx, state);

    // 4. Scanlines
    ctx.fillStyle = 'rgba(0, 255, 100, 0.02)';
    for (let i = 0; i < height; i += 4) {
      ctx.fillRect(0, i, width, 1);
    }

    // 5. Ground
    const groundY = height - 60;
    const grd = ctx.createLinearGradient(0, groundY, 0, height);
    grd.addColorStop(0, '#1a1a3a');
    grd.addColorStop(1, '#0f0f2a');
    ctx.fillStyle = grd;
    ctx.fillRect(0, groundY, width, 60);
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.2)';
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(width, groundY); ctx.stroke();

    // 6. Cities
    this.drawCities(ctx, state, opts);

    // 7. Missiles
    this.drawMissiles(ctx, state);

    // 8. Explosions
    this.drawExplosions(ctx, state);

    // 9. Floating Rewards
    this.drawFloatingRewards(ctx, state);

    // 10. Crosshair & Guidance
    this.drawCrosshair(ctx, state, opts);

    // 11. Damage Zones
    this.drawDamageZones(ctx, state, opts);

    // 12. Emoji Pings
    this.drawEmojiPings(ctx, state);
  }

  private drawDamageZones(ctx: CanvasRenderingContext2D, state: GameState, opts: any) {
    if (state.phase !== 'aiming' || !opts.isMyTurn) return;
    for (const city of state.cities) {
      if (!city.isAlive || city.id === opts.myCityId) continue;
      if (Math.hypot(opts.mouseX - city.x, opts.mouseY - city.y) > 200) continue;
      for (const b of city.buildings) {
        if (b.destroyed) continue;
        if (Math.abs(opts.mouseX - b.x) < 15 && Math.abs(opts.mouseY - b.y) < 15) {
          ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
          ctx.beginPath(); ctx.arc(b.x, b.y, 10, 0, Math.PI * 2); ctx.stroke();
        }
      }
    }
  }

  private drawCities(ctx: CanvasRenderingContext2D, state: GameState, opts: any) {
    for (const city of state.cities) {
      // Buildings
      for (const b of city.buildings) {
        if (b.destroyed) {
          ctx.fillStyle = 'rgba(60, 60, 60, 0.8)';
          ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
          // Smoke particles
          if (Math.random() > 0.8) {
             ctx.fillStyle = `rgba(100, 100, 100, ${Math.random() * 0.4})`;
             ctx.beginPath(); ctx.arc(b.x, b.y - Math.random() * 20, 2 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          ctx.fillStyle = b.color;
          ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
          // Pulse effect
          const pulse = 8 + Math.sin(Date.now() * 0.005 + b.x) * 2;
          ctx.beginPath(); ctx.arc(b.x, b.y, pulse, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 255, 150, 0.15)`; ctx.stroke();
        }
      }

      if (city.isAlive) {
        ctx.fillStyle = 'rgba(0, 20, 40, 0.6)';
        const hudW = 90; const hudH = 35;
        const hudX = city.x - hudW / 2; const hudY = city.y - 45;
        ctx.strokeStyle = city.color;
        ctx.fillRect(hudX, hudY, hudW, hudH);
        ctx.strokeRect(hudX, hudY, hudW, hudH);
        
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px "Orbitron", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(city.name, city.x, hudY + 12);
        
        const barW = 80;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(city.x - barW/2, hudY + 22, barW, 4);
        ctx.fillStyle = city.color;
        ctx.fillRect(city.x - barW/2, hudY + 22, barW * (city.health / city.maxHealth), 4);
      }

      // Turn indicator
      if (city.id === state.cities[state.currentPlayerIndex]?.id && city.isAlive && state.phase === 'aiming') {
        const bounce = Math.sin(Date.now() * 0.005) * 4;
        ctx.fillStyle = '#ffffff';
        ctx.fillText('▼', city.x, city.y - 65 + bounce);
      }
    }
  }

  private drawMissiles(ctx: CanvasRenderingContext2D, state: GameState) {
    for (const m of state.missiles) {
      if (!m.active) continue;

      let missileColor = m.color;
      let trailColor = 'rgba(255, 255, 255, 0.4)';
      let glowColor = m.color;

      if (m.isDefensive) {
        missileColor = '#fff';
        glowColor = '#fff';
      } else {
        switch (m.skin) {
          case 'fire':
            missileColor = '#ff3d00'; trailColor = 'rgba(255, 200, 0, 0.5)'; glowColor = '#ff3d00';
            break;
          case 'neon':
            missileColor = '#ff00ff'; trailColor = 'rgba(0, 229, 255, 0.5)'; glowColor = '#ff00ff';
            break;
          case 'toxic':
            missileColor = '#ccff00'; trailColor = 'rgba(0, 230, 118, 0.5)'; glowColor = '#ccff00';
            break;
          case 'ghost':
            missileColor = '#cfd8dc'; trailColor = 'rgba(200, 200, 200, 0.3)'; glowColor = '#90a4ae';
            break;
        }
      }

      if (m.isNuclear) {
        glowColor = '#ff0000';
      }

      // Trail
      for (const tp of m.trail) {
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = trailColor.replace('0.4', (tp.alpha * 0.4).toString()).replace('0.5', (tp.alpha * 0.5).toString());
        ctx.fill();
      }

      // Head
      if (this.missileImg && this.missileImg.complete) {
        ctx.save();
        ctx.translate(m.currentX, m.currentY);
        
        // Rotate towards target
        const dx = m.targetX - m.startX;
        const dy = m.targetY - m.startY;
        const angle = Math.atan2(dy, dx);
        ctx.rotate(angle);
        
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = glowColor;

        // Tint effect for skins
        const finalColor = missileColor;
        const sprite = this.getTintedSprite(finalColor);
        ctx.drawImage(sprite, -15, -7.5, 30, 15);
        
        ctx.restore();
      } else {
        // Fallback with more flare: Triangle pointing to target
        ctx.save();
        ctx.translate(m.currentX, m.currentY);
        const dx = m.targetX - m.startX;
        const dy = m.targetY - m.startY;
        ctx.rotate(Math.atan2(dy, dx));
        
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-6, -5);
        ctx.lineTo(-6, 5);
        ctx.closePath();
        
        ctx.fillStyle = missileColor;
        ctx.shadowBlur = 15;
        ctx.shadowColor = glowColor;
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  private drawExplosions(ctx: CanvasRenderingContext2D, state: GameState) {
    for (const exp of state.explosions) {
      if (exp.alpha > 0) {
        ctx.beginPath(); ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
        grad.addColorStop(0, exp.color + 'aa');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.fill();
      }
      for (const p of exp.particles) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 100, ${p.alpha})`; ctx.fill();
      }
    }
  }

  private drawFloatingRewards(ctx: CanvasRenderingContext2D, state: GameState) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px "Orbitron", sans-serif';
    for (const r of state.floatingRewards) {
      ctx.globalAlpha = r.alpha;
      ctx.fillStyle = '#ffca28';
      ctx.fillText(`+${r.value}`, r.x, r.y - r.yOffset);
    }
    ctx.globalAlpha = 1.0;
  }

  private drawCrosshair(ctx: CanvasRenderingContext2D, state: GameState, opts: any) {
    if (state.phase !== 'aiming' || !opts.isMyTurn) return;
    const currentCity = state.cities.find(c => c.id === opts.myCityId);
    if (!currentCity) return;
    
    ctx.strokeStyle = 'rgba(255, 50, 50, 0.6)';
    ctx.beginPath();
    ctx.moveTo(opts.mouseX - 15, opts.mouseY); ctx.lineTo(opts.mouseX + 15, opts.mouseY);
    ctx.moveTo(opts.mouseX, opts.mouseY - 15); ctx.lineTo(opts.mouseX, opts.mouseY + 15);
    ctx.stroke();

    // Line from city
    ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.moveTo(currentCity.x, currentCity.y - 40); ctx.lineTo(opts.mouseX, opts.mouseY); ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawWeather(ctx: CanvasRenderingContext2D, state: GameState) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    if (state.weather.type === 'fog') {
      ctx.fillStyle = 'rgba(200, 220, 255, 0.15)';
      ctx.fillRect(0, 0, w, h);
    }

    if (state.weather.type === 'windy') {
       ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
       ctx.lineWidth = 1;
       for (let i = 0; i < 20; i++) {
         const sx = (Date.now() * 0.5 + i * 200) % (w + 400) - 200;
         const sy = (i * 47) % h;
         ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 50, sy); ctx.stroke();
       }
    }

    if (state.weather.type === 'storm') {
       ctx.strokeStyle = 'rgba(150, 180, 255, 0.4)';
       ctx.lineWidth = 1;
       for (let i = 0; i < 50; i++) {
         const sx = (i * 31) % w;
         const sy = (Date.now() * 0.8 + i * 19) % h;
         ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 5, sy + 15); ctx.stroke();
       }
       if (Math.random() > 0.98) {
         ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
         ctx.fillRect(0, 0, w, h);
       }
    }
  }

  private drawWeatherIndicator(ctx: CanvasRenderingContext2D, state: GameState) {
    const w = 150;
    const h = 40;
    const x = ctx.canvas.width - w - 20;
    const y = 20;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#fff';
    ctx.font = '12px "Orbitron"';
    ctx.textAlign = 'left';
    ctx.fillText(`${state.weather.icon} ${state.weather.title}`, x + 10, y + 25);
    
    // Wind vector
    if (state.weather.windX !== 0 || state.weather.windY !== 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#00e5ff';
      const vx = x + w - 20;
      const vy = y + 20;
      ctx.moveTo(vx, vy);
      ctx.lineTo(vx + state.weather.windX * 50, vy + state.weather.windY * 50);
      ctx.stroke();
    }
  }

  private drawEmojiPings(ctx: CanvasRenderingContext2D, state: GameState) {
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    for (const ping of state.activeEmojis) {
      const city = state.cities.find(c => c.id === ping.cityId);
      if (city) {
        const elapsed = Date.now() - ping.startTime;
        const alpha = Math.max(0, 1 - elapsed / ping.duration);
        const yOffset = (elapsed / ping.duration) * 40;
        ctx.globalAlpha = alpha;
        ctx.fillText(ping.emoji, city.x, city.y - 100 - yOffset);
      }
    }
    ctx.globalAlpha = 1.0;
  }
}
