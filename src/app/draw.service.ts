import { Injectable } from '@angular/core';
import { GameState, City, Missile, Explosion, Star, Crater, Weather, FloatingReward } from './models/game.models';

@Injectable({ providedIn: 'root' })
export class DrawService {
  public render(ctx: CanvasRenderingContext2D, state: GameState, paths: Path2D[], opts: any) {
    if (!ctx || !state) return;
    const { width, height } = ctx.canvas;

    this.drawBackground(ctx, width, height);
    this.drawSilhouettes(ctx, width, height);

    ctx.save();
    if (state.screenShake > 0) ctx.translate((Math.random()-0.5)*state.screenShake, (Math.random()-0.5)*state.screenShake);
    this.drawStars(ctx, state.stars);
    this.drawWeather(ctx, state.weather, width, height);
    ctx.restore();

    this.drawMap(ctx, state, paths, opts);
    
    const groundY = height - 60;
    this.drawGround(ctx, width, height, groundY);

    this.drawCities(ctx, state, opts);
    this.drawMissiles(ctx, state.missiles);
    this.drawExplosions(ctx, state.explosions);
    this.drawUI(ctx, state, opts);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#0a0a1a'); grd.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
  }

  private drawStars(ctx: CanvasRenderingContext2D, stars: Star[]) {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  private drawMap(ctx: CanvasRenderingContext2D, state: GameState, paths: Path2D[], opts: any) {
    paths.forEach((path, idx) => {
      const isMine = idx === opts.myContinentIndex;
      const color = isMine ? (state.cities.find(c => c.id === opts.myCityId)?.color || '#00e5ff') : 'rgba(0, 150, 255, 0.25)';
      ctx.strokeStyle = color;
      ctx.lineWidth = isMine ? 2.5 : 1;
      ctx.fillStyle = isMine ? color + '33' : 'rgba(10, 40, 80, 0.4)';
      ctx.fill(path); ctx.stroke(path);
    });
  }

  private drawGround(ctx: CanvasRenderingContext2D, w: number, h: number, groundY: number) {
    ctx.fillStyle = '#1a1a3a'; ctx.fillRect(0, groundY, w, 60);
    ctx.strokeStyle = 'rgba(100, 100, 255, 0.2)';
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();
  }

  private drawCities(ctx: CanvasRenderingContext2D, state: GameState, opts: any) {
    for (const city of state.cities) {
      for (const b of city.buildings) {
        ctx.fillStyle = b.destroyed ? '#444' : b.color;
        ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI*2); ctx.fill();
      }
      if (city.isAlive) {
        const hudX = city.x - 45, hudY = city.y - 45;
        ctx.fillStyle = 'rgba(0, 20, 40, 0.7)'; ctx.strokeStyle = city.color;
        ctx.fillRect(hudX, hudY, 90, 35); ctx.strokeRect(hudX, hudY, 90, 35);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText(city.factionId != null ? opts.factions[city.factionId]?.name : city.name, city.x, hudY + 12);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(city.x - 40, hudY + 22, 80, 4);
        ctx.fillStyle = city.color; ctx.fillRect(city.x - 40, hudY + 22, 80 * (city.health/city.maxHealth), 4);
      }
    }
  }

  private drawMissiles(ctx: CanvasRenderingContext2D, missiles: Missile[]) {
    for (const m of missiles) {
      const color = m.isDefensive ? '#fff' : m.color;
      for (const t of m.trail) {
        ctx.globalAlpha = t.alpha * 0.3; ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(t.x, t.y, 1.5, 0, Math.PI*2); ctx.fill();
      }
      if (!m.active) continue;
      ctx.save(); ctx.translate(m.currentX, m.currentY);
      ctx.rotate(Math.atan2(m.targetY - m.startY, m.targetX - m.startX));
      ctx.fillStyle = color; ctx.shadowBlur = 10; ctx.shadowColor = color;
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-6, -4); ctx.lineTo(-6, 4); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1.0; ctx.shadowBlur = 0;
  }

  private drawExplosions(ctx: CanvasRenderingContext2D, explosions: Explosion[]) {
    for (const exp of explosions) {
      if (exp.alpha <= 0) continue;
      const grad = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
      grad.addColorStop(0, exp.color + 'aa'); grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI*2); ctx.fill();
    }
  }

  private drawUI(ctx: CanvasRenderingContext2D, state: GameState, opts: any) {
    if (state.phase === 'aiming' && opts.isMyTurn) {
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.6)';
      ctx.beginPath(); ctx.moveTo(opts.mouseX-15, opts.mouseY); ctx.lineTo(opts.mouseX+15, opts.mouseY);
      ctx.moveTo(opts.mouseX, opts.mouseY-15); ctx.lineTo(opts.mouseX, opts.mouseY+15); ctx.stroke();
    }
    const idx = ctx.canvas.width - 170;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(idx, 20, 150, 40);
    ctx.fillStyle = '#fff'; ctx.font = '12px Orbitron'; ctx.textAlign = 'left';
    ctx.fillText(`${state.weather.icon} ${state.weather.title}`, idx + 10, 45);
  }

  private drawSilhouettes(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#050510';
    for (let i = 0; i < 12; i++) {
      const bh = 100 + (Math.sin(i*1.5)*0.5+0.5)*150;
      ctx.fillRect(i * (w/12), h - 60 - bh, w/12 + 2, bh);
    }
  }

  private drawWeather(ctx: CanvasRenderingContext2D, weather: Weather, w: number, h: number) {
    if (weather.type === 'fog') {
      ctx.fillStyle = 'rgba(200, 220, 255, 0.1)'; ctx.fillRect(0, 0, w, h);
    } else if (weather.type === 'storm') {
      ctx.strokeStyle = 'rgba(150, 180, 255, 0.3)';
      for (let i = 0; i < 30; i++) {
        const x = (i * 40) % w, y = (Date.now() * 0.5 + i * 20) % h;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x-3, y+10); ctx.stroke();
      }
    }
  }
}
