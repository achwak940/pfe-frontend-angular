import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AnalysisResponse, PriceDurationResponse, RecommandationService } from '../recommandation.service';

@Component({
  selector: 'app-detailes-rec',
  templateUrl: './detailes-rec.component.html',
  styleUrls: ['./detailes-rec.component.css']
})
export class DetailesRecComponent implements OnInit {
  @Input() reclamation: any;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<any>();

  analysisData: AnalysisResponse | null = null;
  priceDuration: PriceDurationResponse | null = null;
  isLoadingAnalysis = true;
  selectedSolutionIndex = 0;
  showFullImage = false;
  fullImageUrl = '';
  imageLoadError = false;
  currentImageUrl = '';
  retryCount = 0;

  // Banque d'images de voitures endommagées (réalistes pour sinistres)
  private readonly DAMAGED_CAR_IMAGES: string[] = [
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1566473965998-3e105dafec1b?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1566730928615-c637b4c002bf?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&h=500&fit=crop'
  ];

  // Images de secours - CDN robustes
  private readonly FALLBACK_IMAGES: string[] = [
    'https://cdn.pixabay.com/photo/2016/11/17/19/53/car-1832720_640.jpg',
    'https://cdn.pixabay.com/photo/2019/12/30/06/41/crash-4729241_640.jpg',
    'https://cdn.pixabay.com/photo/2020/05/30/11/33/car-5240506_640.jpg',
    'https://cdn.pixabay.com/photo/2017/06/27/07/54/car-accident-2446536_640.jpg'
  ];

  // Image ultime de secours (base64 - garantie de fonctionner)
  private readonly ULTIMATE_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"%3E%3Crect width="800" height="500" fill="%23f0ecf3"/%3E%3Ctext x="400" y="230" font-family="Arial" font-size="24" fill="%239D50BB" text-anchor="middle"%3E🚗 Image non disponible%3C/text%3E%3Ctext x="400" y="270" font-family="Arial" font-size="14" fill="%238a8a9e" text-anchor="middle"%3EVéhicule sinistré%3C/text%3E%3C/svg%3E';

  constructor(private recommandationService: RecommandationService) {}

  ngOnInit(): void {
    this.initializeImage();
    this.loadAnalysis();
  }

  /**
   * Initialise l'URL de l'image à afficher en tenant compte de l'image de la réclamation
   */
  initializeImage(): void {
    this.imageLoadError = false;
    this.retryCount = 0;
    const rawUrl = this.reclamation?.imageUrl;
    const fullUrl = this.buildFullImageUrl(rawUrl);
    this.currentImageUrl = this.getValidImageUrl(fullUrl);
  }

  /**
   * Construit une URL absolue à partir d'une URL relative (stockée en BDD)
   */
  private buildFullImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Nettoie les slashs en trop et ajoute le base URL du backend
    const cleanPath = url.replace(/^\/+/, '');
    return `http://localhost:3000/${cleanPath}`;
  }

  /**
   * Retourne une URL valide : si l'URL est absente ou invalide, retourne une image aléatoire de sinistre
   */
  private getValidImageUrl(url: string): string {
    if (url && url.trim() !== '' &&
        !url.includes('placeholder') &&
        !url.includes('via.placeholder.com')) {
      return url;
    }
    return this.getRandomDamagedCarImage();
  }

  loadAnalysis(): void {
    const severity = this.reclamation?.gravite ?? 2.5;
    // Encodage simple du type de dommage (à adapter selon votre logique métier)
    const damageEnc = this.encodeDamageType(this.reclamation?.typeDommage);
    const deviceEnc = 0; // static pour l'instant, pourrait venir du device utilisé

    this.recommandationService.getRecommendations(deviceEnc, damageEnc, severity).subscribe({
      next: (data) => {
        this.analysisData = data;
        this.isLoadingAnalysis = false;
      },
      error: (error) => {
        console.error('Erreur chargement analyse:', error);
        this.isLoadingAnalysis = false;
      }
    });

    this.recommandationService.getPriceDuration(deviceEnc, damageEnc, severity).subscribe({
      next: (data) => {
        this.priceDuration = data;
      },
      error: (error) => {
        console.error('Erreur chargement prix/durée:', error);
      }
    });
  }

  /**
   * Convertit le type de dommage en code numérique pour l'API
   */
  private encodeDamageType(typeDommage: string): number {
    if (!typeDommage) return 0;
    const lower = typeDommage.toLowerCase();
    if (lower.includes('rayure') || lower.includes('griffe')) return 1;
    if (lower.includes('bosse') || lower.includes('enfoncement')) return 2;
    if (lower.includes('casse') || lower.includes('bris')) return 3;
    if (lower.includes('choc') || lower.includes('collision')) return 4;
    return 0;
  }

  getRandomDamagedCarImage(): string {
    const randomIndex = Math.floor(Math.random() * this.DAMAGED_CAR_IMAGES.length);
    return this.DAMAGED_CAR_IMAGES[randomIndex];
  }

  getRandomFallbackImage(): string {
    const randomIndex = Math.floor(Math.random() * this.FALLBACK_IMAGES.length);
    return this.FALLBACK_IMAGES[randomIndex];
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    this.imageLoadError = true;

    if (this.retryCount === 0) {
      this.retryCount++;
      imgElement.src = this.getRandomFallbackImage();
    } else if (this.retryCount === 1) {
      this.retryCount++;
      imgElement.src = this.getRandomDamagedCarImage();
    } else {
      imgElement.src = this.ULTIMATE_FALLBACK;
    }
    imgElement.classList.add('image-error');
  }

  onImageLoad(event: Event): void {
    this.imageLoadError = false;
    const imgElement = event.target as HTMLImageElement;
    imgElement.classList.remove('image-error');
    imgElement.classList.add('image-loaded');
  }

  getSeverityPercent(): number {
    if (!this.analysisData) return 75;
    return Math.round(this.analysisData.severity * 25);
  }

  getSeverityClass(): string {
    const severity = this.analysisData?.severity || 0;
    if (severity >= 3) return 'high';
    if (severity >= 1.5) return 'medium';
    return 'low';
  }

  getSeverityLabel(): string {
    const severity = this.analysisData?.severity || 0;
    if (severity >= 3) return 'ÉLEVÉE';
    if (severity >= 1.5) return 'MODÉRÉE';
    return 'FAIBLE';
  }

  getProgressClass(confidence: number): string {
    if (confidence >= 50) return 'high-progress';
    if (confidence >= 30) return 'medium-progress';
    return 'low-progress';
  }

  getDamageTypes(): string[] {
    return this.reclamation?.typeDommage?.split(',') || ['Choc', 'Rayure'];
  }

  getEstimatedCost(confidence: number): number {
    const baseCost = this.priceDuration?.price || 500;
    return Math.round(baseCost * (confidence / 100));
  }

  getEstimatedDuration(confidence: number): number {
    const baseDuration = this.priceDuration?.duration || 5;
    return Math.round(baseDuration * (confidence / 100));
  }

  selectSolution(index: number): void {
    this.selectedSolutionIndex = index;
  }

  confirmSolution(): void {
    const selected = this.analysisData?.recommendations[this.selectedSolutionIndex];
    if (selected) {
      this.showNotification(`Solution confirmée: ${selected.solution}`, 'success');
    }
  }

  ignoreSolution(index: number): void {
    const ignored = this.analysisData?.recommendations[index];
    if (ignored) {
      this.showNotification(`Solution ignorée: ${ignored.solution}`, 'warning');
    }
  }

  confirmFinalDecision(): void {
    if (this.analysisData && this.analysisData.recommendations[this.selectedSolutionIndex]) {
      const selectedRecommendation = this.analysisData.recommendations[this.selectedSolutionIndex];
      this.confirm.emit({
        recommendation: selectedRecommendation,
        analysis: this.analysisData,
        priceDuration: this.priceDuration,
        selectedIndex: this.selectedSolutionIndex
      });
      this.showNotification('Décision confirmée avec succès!', 'success');
    }
  }

  showDetailedComparison(): void {
    if (this.analysisData?.recommendations) {
      const comparisonDetails = this.analysisData.recommendations.map((rec, idx) => ({
        index: idx,
        solution: rec.solution,
        confidence: rec.confidence
      }));
      console.log('Détails comparaison:', comparisonDetails);
      this.showNotification('Comparaison détaillée disponible dans la console', 'info');
    }
  }

  assignExpert(): void {
    this.showNotification(`Expert assigné au sinistre #${this.reclamation?.id || 'inconnu'}`, 'success');
  }

  exportReport(): void {
    const report = {
      reclamation: this.reclamation,
      analysis: this.analysisData,
      priceDuration: this.priceDuration,
      exportedAt: new Date().toISOString(),
      selectedSolution: this.selectedSolutionIndex
    };
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const fileName = `rapport_sinistre_${this.reclamation?.id || 'export'}_${Date.now()}.json`;
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showNotification('Rapport exporté avec succès!', 'success');
  }

  printReport(): void {
    window.print();
  }

  shareReport(): void {
    const shareData = {
      title: `Rapport sinistre #${this.reclamation?.id || ''}`,
      text: `Analyse du sinistre - ${this.reclamation?.titre || 'Sinistre automobile'}`,
      url: window.location.href
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(() => this.fallbackShare());
    } else {
      this.fallbackShare();
    }
  }

  private fallbackShare(): void {
    const dummy = document.createElement('textarea');
    document.body.appendChild(dummy);
    dummy.value = window.location.href;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    this.showNotification('Lien copié dans le presse-papier!', 'info');
  }

  openFullImage(url: string): void {
    if (url && url !== this.ULTIMATE_FALLBACK) {
      this.fullImageUrl = url;
      this.showFullImage = true;
      document.body.style.overflow = 'hidden';
    } else {
      this.showNotification('Image non disponible', 'error');
    }
  }

  closeFullImage(): void {
    this.showFullImage = false;
    this.fullImageUrl = '';
    document.body.style.overflow = '';
  }

  retryImage(): void {
    this.retryCount = 0;
    this.imageLoadError = false;
    this.currentImageUrl = this.getRandomDamagedCarImage();
  }

  downloadImage(): void {
    const imageUrl = this.currentImageUrl;
    if (!imageUrl || imageUrl === this.ULTIMATE_FALLBACK) {
      this.showNotification('Aucune image valide à télécharger', 'error');
      return;
    }
    const fileName = this.reclamation?.imageName || `sinistre_${Date.now()}.jpg`;
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        this.showNotification('Image téléchargée!', 'success');
      })
      .catch(() => {
        window.open(imageUrl, '_blank');
      });
  }

  formatDate(date: Date | string): string {
    if (!date) return 'Non spécifiée';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Date invalide';
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack(): void {
    this.close.emit();
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 70) return '#2ecc71';
    if (confidence >= 50) return '#f39c12';
    return '#e74c3c';
  }

  getSeverityColor(): string {
    const severity = this.analysisData?.severity || 0;
    if (severity >= 3) return '#e74c3c';
    if (severity >= 1.5) return '#f39c12';
    return '#2ecc71';
  }

  getFirstRecommendationSolution(): string {
    return this.analysisData?.recommendations?.[0]?.solution || 'La réparation partielle';
  }

  getFirstRecommendationConfidence(): number {
    return this.analysisData?.recommendations?.[0]?.confidence || 46;
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#9D50BB'};
      color: white;
      border-radius: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-weight: 500;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  ngOnDestroy(): void {
    this.closeFullImage();
  }
}