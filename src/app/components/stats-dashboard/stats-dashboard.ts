import { Component, OnInit, inject, signal, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-container">
      <div class="stats-header">
        <h2>CENTRO DE INTELIGENCIA ESTRATÉGICA</h2>
        <button class="btn-close" (click)="onClose.emit()">×</button>
      </div>

      <div class="stats-grid">
        <div class="stat-card summary">
          <div class="stat-label">PARTIDAS REGISTRADAS</div>
          <div class="stat-value">{{ totalPartidas() }}</div>
        </div>

        <div class="stat-card chart-card">
          <h3>DISTRIBUCIÓN DE VICTORIAS POR CONTINENTE</h3>
          <canvas #continentChart></canvas>
        </div>

        <div class="stat-card info">
          <h3>INSIGHTS ESTRATÉGICOS</h3>
          <p *ngIf="totalPartidas() === 0">No hay datos suficientes para generar un informe táctico.</p>
          <ul *ngIf="totalPartidas() > 0">
            <li>Nivel de conflicto global: <strong>ALTO</strong></li>
            <li>Sistema preferido: {{ topContinentName() }}</li>
            <li>Tasa de efectividad: {{ (totalPartidas() * 0.85).toFixed(0) }}%</li>
          </ul>
        </div>
      </div>
      
      <div class="stats-footer">
        <button class="cyber-btn" (click)="syncData()">
          <span class="nav-icon">🔄</span>
          <span class="nav-text">SINCRONIZAR CON ATLAS</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .stats-container {
      background: rgba(5, 10, 20, 0.95);
      border: 1px solid var(--primary);
      border-radius: 20px;
      padding: 30px;
      color: #fff;
      backdrop-filter: blur(20px);
      box-shadow: 0 0 50px rgba(0, 229, 255, 0.2);
    }
    .stats-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 30px; border-bottom: 1px solid rgba(0, 229, 255, 0.3);
      padding-bottom: 15px;
    }
    .stats-header h2 { font-family: 'Orbitron'; color: var(--primary); letter-spacing: 2px; }
    .btn-close { background: none; border: none; color: #fff; font-size: 2rem; cursor: pointer; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
    .stat-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      padding: 20px; border-radius: 12px;
    }
    .summary { grid-column: span 2; display: flex; align-items: center; justify-content: space-between; }
    .stat-label { font-family: 'Orbitron'; color: #9ca3af; font-size: 0.8rem; }
    .stat-value { font-family: 'Orbitron'; font-size: 2.5rem; color: var(--gold); }
    
    .chart-card { min-height: 300px; display: flex; flex-direction: column; }
    .chart-card h3 { font-size: 0.9rem; margin-bottom: 20px; opacity: 0.8; }
    
    .info h3 { font-size: 0.9rem; margin-bottom: 15px; color: var(--primary); }
    .info ul { padding-left: 20px; color: #d1d5db; }
    .info li { margin-bottom: 10px; font-size: 0.9rem; }

    .stats-footer { margin-top: 30px; display: flex; justify-content: center; }
  `],
  outputs: ['onClose']
})
export class StatsDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  
  @ViewChild('continentChart') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  totalPartidas = signal(0);
  topContinentName = signal('Desconocido');
  
  @Output() onClose = new EventEmitter<void>();
  
  private chart: any;

  private continentNames = ['América del Norte', 'Eurasia', 'América del Sur', 'África'];

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.http.get<any>('http://localhost:8080/api/estadisticas/stats-globales').subscribe(data => {
      this.totalPartidas.set(data.totalPartidas);
      
      const counts = [0, 0, 0, 0];
      data.porContinente.forEach((item: any) => {
        if (item._id >= 0 && item._id < 4) {
          counts[item._id] = item.count;
        }
      });
      
      const maxIdx = counts.indexOf(Math.max(...counts));
      if (counts[maxIdx] > 0) {
        this.topContinentName.set(this.continentNames[maxIdx]);
      }

      this.initChart(counts);
    });
  }

  initChart(data: number[]) {
    if (this.chart) this.chart.destroy();
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.continentNames,
        datasets: [{
          data: data,
          backgroundColor: ['#00e5ff', '#ff0055', '#00e676', '#ffca28'],
          borderColor: 'transparent',
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#fff', font: { family: 'Orbitron', size: 10 } }
          }
        }
      }
    });
  }

  syncData() {
    this.http.post('http://localhost:8080/api/estadisticas/copiar', {}).subscribe(() => {
      this.loadStats();
    });
  }
}
