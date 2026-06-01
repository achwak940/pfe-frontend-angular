import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { NormalizedAnalysisData, ApiPriceDurationResponse, RecommandationService } from '../recommandation.service';

export interface ExtendedPriceDurationResponse {
  price?: number;
  duration_h?: number;
  duration?: number;
}

@Component({
  selector: 'app-detailes-rec',
  templateUrl: './detailes-rec.component.html',
  styleUrls: ['./detailes-rec.component.css']
})
export class DetailesRecComponent implements OnInit, OnDestroy {
  @Input() reclamation: any;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<any>();

  analysisData: any = null;
  priceDuration: ExtendedPriceDurationResponse | null = null;
  
  isLoadingAnalysis = true;
  isLoadingPrice = true;
  selectedSolutionIndex = 0;
  apiError = false;
  errorMessage = '';

  constructor(private recommandationService: RecommandationService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const total_damage = this.reclamation?.gravite ?? this.reclamation?.severity ?? 0.68;
    const damage_enc = this.reclamation?.typeDommage ? 2 : 0;
    const device_enc = this.reclamation?.typeVehicule ? 1 : 0;

    this.isLoadingAnalysis = true;
    this.apiError = false;

    this.recommandationService.getRecommendations(device_enc, damage_enc, total_damage).subscribe({
      next: (data) => {
        if (data?.recommendations) {
          data.recommendations = data.recommendations.map((rec: any, index: number) => ({
            ...rec,
            tags: rec.tags || this.getDefaultTags(rec.solution, index)
          }));
        }
        this.analysisData = data;
        this.isLoadingAnalysis = false;
      },
      error: (error) => {
        this.apiError = true;
        this.errorMessage = error.message;
        this.isLoadingAnalysis = false;
      }
    });

    this.recommandationService.getPriceDuration(device_enc, damage_enc, total_damage).subscribe({
      next: (data) => {
        this.priceDuration = data as ExtendedPriceDurationResponse;
        this.isLoadingPrice = false;
      },
      error: (error) => {
        this.isLoadingPrice = false;
      }
    });
  }

  getSeverityClass(): string {
    const score = this.getSeverityScore();
    if (score <= 0.33) return 'low';
    if (score <= 0.66) return 'medium';
    return 'high';
  }

  getCurrentDate(): string {
    const now = new Date();
    return now.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 80) return '#22C55E';
    if (confidence >= 60) return '#EAB308';
    if (confidence >= 40) return '#F97316';
    return '#EF4444';
  }

  getDefaultTags(solution: string, index: number): string[] {
    const tagsByIndex: { [key: number]: string[] } = {
      0: ['Réparation', 'Carrosserie'],
      1: ['Mécanique', 'Structure'],
      2: ['Peinture', 'Finitions'],
      3: ['Contrôle', 'Sécurité']
    };
    return tagsByIndex[index] || ['Diagnostic', 'Recommandation'];
  }

  getSeverityScore(): number {
    if (this.analysisData?.severity) {
      return parseFloat((this.analysisData.severity / 4).toFixed(2));
    }
    return 0.68;
  }

  getNeedleAngle(): number {
    const score = this.getSeverityScore();
    return 180 - (score * 180);
  }

  getGaugeActiveColor(): string {
    const score = this.getSeverityScore();
    if (score <= 0.33) return '#7C3AED';
    if (score <= 0.66) return '#3B82F6';
    return '#6B7280';
  }

  getGaugeActiveLabel(): string {
    const score = this.getSeverityScore();
    if (score <= 0.33) return 'LÉGER';
    if (score <= 0.66) return 'MODÉRÉ';
    return 'CRITIQUE';
  }

  getDefaultJustification(solution: string): string {
    if (solution.includes('Solution 12') || solution.includes('Réparation')) {
      return 'Solution optimale pour les dommages modérés avec un excellent rapport qualité-prix.';
    }
    if (solution.includes('carrosserie') || solution.includes('partielle')) {
      return 'Intervention ciblée sur les zones endommagées, préservant les parties saines.';
    }
    if (solution.includes('remplacement') || solution.includes('complet')) {
      return 'Remplacement des composants endommagés pour une sécurité optimale.';
    }
    return 'Solution proposée par l\'analyse IA basée sur les données du véhicule.';
  }

  getDuration(): number {
    let duration = 0;
    if (this.priceDuration?.duration_h) {
      duration = this.priceDuration.duration_h;
    } else if ((this.priceDuration as any)?.duration) {
      duration = (this.priceDuration as any).duration;
    }
    return Math.ceil(duration);
  }

  getFormattedPrice(): string {
    let price = this.priceDuration?.price || 0;
    const roundedPrice = Math.round(price);
    return roundedPrice.toLocaleString('fr-FR') + ' DT';
  }

  selectSolution(index: number): void {
    this.selectedSolutionIndex = index;
  }

  confirmDecision(): void {
    if (this.analysisData?.recommendations[this.selectedSolutionIndex]) {
      const selected = this.analysisData.recommendations[this.selectedSolutionIndex];
      this.confirm.emit({
        recommendation: selected,
        analysis: this.analysisData,
        priceDuration: this.priceDuration,
        selectedIndex: this.selectedSolutionIndex
      });
      this.showNotification(`Décision confirmée: ${selected.solution}`, 'success');
    }
  }

  private showNotification(message: string, type: string): void {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#22C55E' : '#EF4444'};
      color: white;
      border-radius: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 13px;
      font-weight: 500;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  goBack(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {}
}