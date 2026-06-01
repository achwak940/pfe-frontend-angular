import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Reclamation, ReclamationsService, YoloAnalysisResult } from '../reclmations.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

export interface Toast {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
  hiding: boolean;
  timer?: any;
}

export interface PriceDurationResponse {
  device_enc: number;
  damage_enc: number;
  total_damage: number;
  price: number;
  duration_h: number;
}

export interface RecommendResponse {
  severity: number;
  recommendations: Array<{
    solution: string;
    confidence: number;
    class_id?: number;
  }>;
  analysis: {
    analysis: {
      case_summary: string;
      damage_level: string;
      deep_analysis: string;
    };
    risks: {
      high: string[];
      medium: string[];
      low: string[];
    };
    recommendations_analysis: any[];
    decision: {
      final_choice: string;
      justification: string;
      risk_if_ignored: string;
    };
  };
}

export interface PredictionResponse {
  image_url: string;
  total_damage: number;
  price: number;
  duration: number;
  boxes: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    damage: string;
    confidence: number;
    gravite: number;
  }>;
}

@Component({
  selector: 'app-gestion-reclamation',
  templateUrl: './gestion-reclamation.component.html',
  styleUrls: ['./gestion-reclamation.component.css']
})
export class GestionReclamationComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('uploadImageInput') uploadImageInput!: ElementRef<HTMLInputElement>;

  reclamations: Reclamation[] = [];
  filteredReclamations: Reclamation[] = [];
  displayedReclamations: Reclamation[] = [];
  selectedReclamation: Reclamation | null = null;
  
  isLoading = false;
  isAnalyzing = false;
  isSubmitting = false;
  isSelectionMode = false;
  activeMenuId: number | null = null;
  
  selectedIds: number[] = [];
  
  searchQuery = '';
  selectedStatus = 'all';
  selectedGravity = 'all';
  selectedPeriod = 'all';
  
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;
  
  totalReclamations = 0;
  attenteCount = 0;
  enCoursCount = 0;
  traiteeCount = 0;
  rejeteCount = 0;
  resolutionRate = 0;
  avgResponseTime = 24;
  currentDate: Date = new Date();
  
  responseForm!: FormGroup;
  correctionForm!: FormGroup;
  
  showResponseModal = false;
  showCorrectionModal = false;
  showYoloModal = false;
  showDetailsModal = false;
  showImageModal = false;
  showUploadModal = false;
  showAnalysisModal = false;
  showReportModal = false;
  showRecommendationModal = false;
  
  yoloResult: YoloAnalysisResult | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadProgress = 0;
  
  selectedUploadFile: File | null = null;
  uploadPreviewUrl: string | null = null;
  
  currentImageUrl: string | null = null;
  currentImageName: string | null = null;
  zoomLevel: number = 1;
  imagePosition = { x: 0, y: 0 };
  isDragging = false;
  dragStart = { x: 0, y: 0 };
  imageContainerRef: ElementRef | null = null;
  
  selectedReclamationForAnalysis: Reclamation | null = null;
  
  isLoadingPrice = false;
  isLoadingRecommend = false;
  currentPriceData: PriceDurationResponse | null = null;
  currentRecommendData: RecommendResponse | null = null;
  selectedAnalysisReclamation: Reclamation | null = null;
  
  isRealYoloAnalysis = false;
  yoloAnalysisError: string | null = null;
  
  toasts: Toast[] = [];
  private toastIdCounter = 0;
  
  reportData: any = null;
  isGeneratingReport = false;
  
  get graviteTotale(): number {
    if (!this.reclamations || this.reclamations.length === 0) return 0;
    const total = this.reclamations.reduce((sum, r) => sum + (r.gravite || 0), 0);
    return total / this.reclamations.length;
  }
  
  get coutTotalEstime(): number {
    if (!this.reclamations) return 0;
    return this.reclamations.reduce((sum, r) => sum + ((r.totalSeverite || 0) * 50), 0);
  }
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private reclamationsService: ReclamationsService,
    private fb: FormBuilder,
    private router: Router 
  ) {
    this.initForms();
    this.setupSearchDebounce();
  }

  private initForms(): void {
    this.responseForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(10)]],
      sendEmail: [true],
      sendSMS: [false],
      priority: ['normal']
    });
    
    this.correctionForm = this.fb.group({
      problemDetected: ['', Validators.required],
      severity: [5, [Validators.required, Validators.min(0), Validators.max(10)]],
      confidence: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
      expertNotes: [''],
      estimatedCost: [0]
    });
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    this.loadReclamations();
    this.loadStats();
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.handleClickOutside.bind(this));
  }

  showToast(title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 4000): void {
    const toast: Toast = {
      id: this.toastIdCounter++,
      title,
      message,
      type,
      duration,
      hiding: false
    };
    this.toasts.push(toast);
    toast.timer = setTimeout(() => {
      this.hideToast(toast);
    }, duration);
  }

  hideToast(toast: Toast): void {
    toast.hiding = true;
    setTimeout(() => {
      this.removeToast(toast);
    }, 300);
  }

  removeToast(toast: Toast): void {
    if (toast.timer) clearTimeout(toast.timer);
    this.toasts = this.toasts.filter(t => t.id !== toast.id);
  }

  pauseToastTimer(toast: Toast): void {
    if (toast.timer) {
      clearTimeout(toast.timer);
      toast.timer = null;
    }
  }

  resumeToastTimer(toast: Toast): void {
    toast.timer = setTimeout(() => {
      this.hideToast(toast);
    }, toast.duration);
  }

  private handleClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-icon') && !target.closest('.card-menu')) {
      this.activeMenuId = null;
    }
  }

  toggleCardMenu(id: number): void {
    this.activeMenuId = this.activeMenuId === id ? null : id;
  }

  loadReclamations(): void {
    this.isLoading = true;
    const filters: any = {};
    if (this.selectedStatus !== 'all') filters.statut = this.selectedStatus;
    if (this.searchQuery) filters.search = this.searchQuery;
    
    this.reclamationsService.getAllReclamations(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Reclamation[]) => {
          this.reclamations = data && Array.isArray(data) ? data : [];
          this.applyFilters();
          this.updateStatistics();
          this.showToast('Succès', `${this.reclamations.length} réclamation(s) chargée(s)`, 'success');
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur chargement:', error);
          this.isLoading = false;
          this.reclamations = [];
          this.applyFilters();
          this.showToast('Erreur', 'Impossible de charger les réclamations', 'error');
        }
      });
  }

  loadStats(): void {
    this.reclamationsService.getStats().subscribe({
      next: (stats: any) => {
        if (stats) {
          this.totalReclamations = stats.total || 0;
          this.attenteCount = stats.enAttente || 0;
          this.enCoursCount = stats.enCours || 0;
          this.traiteeCount = stats.resolues || 0;
          this.rejeteCount = stats.rejetees || 0;
          this.resolutionRate = parseFloat(stats.tauxResolution) || 0;
        }
      },
      error: (error: any) => console.error('Erreur stats:', error)
    });
  }

  applyFilters(): void {
    if (!this.reclamations || !Array.isArray(this.reclamations)) {
      this.filteredReclamations = [];
      this.totalPages = 1;
      this.currentPage = 1;
      this.loadPage();
      return;
    }
    
    let filtered = [...this.reclamations];
    if (this.selectedStatus !== 'all') filtered = filtered.filter(r => r.statut === this.selectedStatus);
    if (this.selectedGravity !== 'all') {
      if (this.selectedGravity === 'faible') filtered = filtered.filter(r => (r.gravite || 0) < 4);
      else if (this.selectedGravity === 'moyenne') filtered = filtered.filter(r => (r.gravite || 0) >= 4 && (r.gravite || 0) < 6);
      else if (this.selectedGravity === 'elevee') filtered = filtered.filter(r => (r.gravite || 0) >= 6 && (r.gravite || 0) < 8);
      else if (this.selectedGravity === 'critique') filtered = filtered.filter(r => (r.gravite || 0) >= 8);
    }
    if (this.selectedPeriod !== 'all') filtered = this.filterByPeriodData(filtered, this.selectedPeriod);
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.id.toString().includes(query) ||
        (r.titre || '').toLowerCase().includes(query) ||
        (r.user?.nom || '').toLowerCase().includes(query) ||
        (r.user?.prenom || '').toLowerCase().includes(query) ||
        (r.user?.email || '').toLowerCase().includes(query)
      );
    }
    
    this.filteredReclamations = filtered;
    this.totalPages = Math.ceil(this.filteredReclamations.length / this.itemsPerPage) || 1;
    this.currentPage = 1;
    this.loadPage();
  }

  filterByPeriodData(reclamations: Reclamation[], period: string): Reclamation[] {
    const now = new Date();
    let dateDebut: Date | null = null;
    let dateFin: Date | null = null;
    
    switch(period) {
      case 'today':
        dateDebut = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFin = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        dateDebut = startOfWeek;
        dateFin = new Date(now);
        dateFin.setHours(23, 59, 59, 999);
        break;
      case 'month':
        dateDebut = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      default: return reclamations;
    }
    
    if (dateDebut && dateFin) {
      return reclamations.filter(r => {
        if (!r.createdAt) return false;
        const createdAt = new Date(r.createdAt);
        return createdAt >= dateDebut! && createdAt <= dateFin!;
      });
    }
    return reclamations;
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.loadReclamations();
  }

  filterByPeriod(period: string): void {
    this.selectedPeriod = period;
    this.applyFilters();
  }

  loadPage(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.displayedReclamations = this.filteredReclamations.slice(start, end);
  }

  onSearchInput(query: string): void {
    this.searchSubject.next(query);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = 'all';
    this.selectedGravity = 'all';
    this.selectedPeriod = 'all';
    this.loadReclamations();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  openBulkActions(): void {
    this.isSelectionMode = true;
  }

  exitSelectionMode(): void {
    this.isSelectionMode = false;
    this.selectedIds = [];
  }

  toggleSelection(id: number): void {
    if (this.selectedIds.includes(id)) {
      this.selectedIds = this.selectedIds.filter(i => i !== id);
    } else {
      this.selectedIds.push(id);
    }
    this.isSelectionMode = this.selectedIds.length > 0;
  }

  bulkUpdateStatus(status: string): void {
    if (this.selectedIds.length === 0) return;
    if (confirm(`Passer ${this.selectedIds.length} réclamation(s) en statut ${status} ?`)) {
      this.isSubmitting = true;
      this.reclamationsService.updateMultiple(this.selectedIds, { statut: status }).subscribe({
        next: () => {
          this.loadReclamations();
          this.exitSelectionMode();
          this.isSubmitting = false;
          this.showToast('Succès', `${this.selectedIds.length} réclamation(s) mises à jour`, 'success');
        },
        error: (err) => { this.isSubmitting = false; this.showToast('Erreur', 'Erreur mise à jour', 'error'); }
      });
    }
  }

  deleteSelected(): void {
    if (this.selectedIds.length === 0) return;
    if (confirm(`Supprimer ${this.selectedIds.length} réclamation(s) ?`)) {
      this.isSubmitting = true;
      this.reclamationsService.deleteMultiple(this.selectedIds).subscribe({
        next: () => {
          this.loadReclamations();
          this.exitSelectionMode();
          this.isSubmitting = false;
          this.showToast('Succès', `${this.selectedIds.length} réclamation(s) supprimées`, 'success');
        },
        error: (err) => { this.isSubmitting = false; this.showToast('Erreur', 'Erreur suppression', 'error'); }
      });
    }
  }

  deleteReclamation(id: number): void {
    if (confirm('Supprimer cette réclamation ?')) {
      this.reclamationsService.deleteReclamation(id).subscribe({
        next: () => { this.loadReclamations(); this.showToast('Succès', 'Réclamation supprimée', 'success'); },
        error: (err) => { this.showToast('Erreur', 'Erreur suppression', 'error'); }
      });
    }
  }

  viewDetails(reclamation: Reclamation): void {
    this.router.navigate(['/detailesRec'], { state: { reclamation } });
  }

  goToDetails(reclamation: Reclamation): void {
    this.router.navigate(['/detailesRec'], { state: { reclamation } });
  }

  openAnalysisModal(reclamation: Reclamation): void {
    this.selectedReclamationForAnalysis = reclamation;
    this.showAnalysisModal = true;
    this.activeMenuId = null;
  }

  closeAnalysisModal(): void {
    this.showAnalysisModal = false;
    this.selectedReclamationForAnalysis = null;
  }

  onAnalysisConfirm(event: any): void {
    console.log('Décision confirmée:', event);
    this.showToast('Succès', 'Décision enregistrée', 'success');
    this.closeAnalysisModal();
    this.loadReclamations();
  }

  openResponseModal(reclamation: Reclamation): void {
    this.selectedReclamation = reclamation;
    this.responseForm.reset({ message: '', sendEmail: true, sendSMS: false, priority: 'normal' });
    this.showResponseModal = true;
    this.activeMenuId = null;
  }

  closeResponseModal(): void {
    this.showResponseModal = false;
    this.selectedReclamation = null;
  }

  sendResponse(): void {
    if (this.responseForm.invalid || !this.selectedReclamation) return;
    this.isSubmitting = true;
    this.reclamationsService.repondreReclamation(this.selectedReclamation.id, this.responseForm.value).subscribe({
      next: () => {
        this.closeResponseModal();
        this.loadReclamations();
        this.isSubmitting = false;
        this.showToast('Succès', 'Réponse envoyée', 'success');
      },
      error: (error) => { this.isSubmitting = false; this.showToast('Erreur', 'Erreur envoi', 'error'); }
    });
  }

  openCorrectionModal(reclamation: Reclamation): void {
    this.selectedReclamation = reclamation;
    this.correctionForm.patchValue({
      problemDetected: reclamation.description,
      severity: reclamation.gravite || 5,
      confidence: (reclamation.confiance || 0.7) * 100,
      expertNotes: '',
      estimatedCost: 0
    });
    this.showCorrectionModal = true;
    this.activeMenuId = null;
  }

  closeCorrectionModal(): void {
    this.showCorrectionModal = false;
    this.selectedReclamation = null;
  }

  submitCorrection(): void {
    if (this.correctionForm.invalid || !this.selectedReclamation) return;
    this.isSubmitting = true;
    this.reclamationsService.updateReclamation(this.selectedReclamation.id, {
      description: this.correctionForm.value.problemDetected,
      gravite: this.correctionForm.value.severity,
      confiance: this.correctionForm.value.confidence / 100,
      notesExpert: this.correctionForm.value.expertNotes,
      coutEstime: this.correctionForm.value.estimatedCost
    }).subscribe({
      next: () => {
        this.closeCorrectionModal();
        this.loadReclamations();
        this.isSubmitting = false;
        this.showToast('Succès', 'Correction enregistrée', 'success');
      },
      error: (error) => { this.isSubmitting = false; this.showToast('Erreur', 'Erreur enregistrement', 'error'); }
    });
  }

  openImageFullscreen(reclamation: Reclamation): void {
    if (reclamation.imageUrl) {
      const imageUrl = this.getImageUrl(reclamation.imageUrl);
      this.resetImageZoom();
      const testImg = new Image();
      testImg.onload = () => {
        this.currentImageUrl = imageUrl;
        this.currentImageName = reclamation.imageName || `image_${reclamation.id}`;
        this.showImageModal = true;
        document.body.style.overflow = 'hidden';
      };
      testImg.onerror = () => {
        this.showToast('Erreur', 'Impossible de charger l\'image', 'error');
        const altUrl = `http://localhost:3000/${reclamation.imageUrl}`;
        const altImg = new Image();
        altImg.onload = () => {
          this.currentImageUrl = altUrl;
          this.currentImageName = reclamation.imageName || `image_${reclamation.id}`;
          this.showImageModal = true;
          document.body.style.overflow = 'hidden';
        };
        altImg.src = altUrl;
      };
      testImg.src = imageUrl;
    } else {
      this.showToast('Info', 'Aucune image disponible', 'info');
    }
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.currentImageUrl = null;
    this.currentImageName = null;
    this.resetImageZoom();
    document.body.style.overflow = '';
  }

  resetImageZoom(): void {
    this.zoomLevel = 1;
    this.imagePosition = { x: 0, y: 0 };
    this.isDragging = false;
  }

  zoomIn(): void {
    if (this.zoomLevel < 3) this.zoomLevel = Math.min(3, this.zoomLevel + 0.25);
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.5) {
      this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.25);
      if (this.zoomLevel === 1) this.imagePosition = { x: 0, y: 0 };
    }
  }

  resetZoom(): void {
    this.resetImageZoom();
  }

  onMouseDown(event: MouseEvent): void {
    if (this.zoomLevel > 1) {
      this.isDragging = true;
      this.dragStart = { x: event.clientX - this.imagePosition.x, y: event.clientY - this.imagePosition.y };
      event.preventDefault();
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging && this.zoomLevel > 1) {
      this.imagePosition = { x: event.clientX - this.dragStart.x, y: event.clientY - this.dragStart.y };
    }
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) this.zoomIn();
    else this.zoomOut();
  }

  getImageTransform(): string {
    return `translate(${this.imagePosition.x}px, ${this.imagePosition.y}px) scale(${this.zoomLevel})`;
  }

  getZoomPercentage(): number {
    return Math.round(this.zoomLevel * 100);
  }

  downloadImage(reclamation: Reclamation): void {
    if (reclamation.imageUrl) {
      this.downloadImageFromUrl(this.getImageUrl(reclamation.imageUrl), reclamation.imageName || `reclamation_${reclamation.id}.jpg`);
    }
  }

  downloadCurrentImage(): void {
    if (this.currentImageUrl) {
      this.downloadImageFromUrl(this.currentImageUrl, this.currentImageName || 'image.jpg');
    }
  }

  private downloadImageFromUrl(url: string, filename: string): void {
    fetch(url, { mode: 'cors', credentials: 'omit' })
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        link.click();
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
        this.showToast('Succès', 'Téléchargement démarré', 'success');
      })
      .catch(error => { window.open(url, '_blank'); this.showToast('Info', 'L\'image s\'ouvre dans un nouvel onglet', 'info'); });
  }

  analyzeReclamation(reclamation: Reclamation): void {
    this.selectedAnalysisReclamation = reclamation;
    this.isLoadingPrice = true;
    this.isLoadingRecommend = true;
    this.showRecommendationModal = true;
    this.activeMenuId = null;
    
    const severity = Math.min(1, Math.max(0, (reclamation.gravite || 5) / 10));
    const requestData = {
      device_enc: this.getDeviceEncoding(reclamation),
      damage_enc: this.getDamageEncoding(reclamation.typeDommage),
      total_damage: severity
    };
    
    this.reclamationsService.getPriceDuration(requestData).subscribe({
      next: (priceResult) => {
        this.currentPriceData = priceResult;
        this.isLoadingPrice = false;
        this.showToast('Estimation', `Prix: ${priceResult.price}€ - Durée: ${priceResult.duration_h}h`, 'success');
      },
      error: (err) => {
        console.error(err);
        this.isLoadingPrice = false;
        this.showToast('Erreur', 'Impossible d\'obtenir l\'estimation', 'error');
      }
    });
    
    this.reclamationsService.getRecommendations(requestData).subscribe({
      next: (recommendResult) => {
        this.currentRecommendData = recommendResult;
        this.isLoadingRecommend = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoadingRecommend = false;
        this.showToast('Erreur', 'Impossible d\'obtenir les recommandations', 'error');
      }
    });
  }

  closeRecommendationModal(): void {
    this.showRecommendationModal = false;
    this.currentPriceData = null;
    this.currentRecommendData = null;
    this.selectedAnalysisReclamation = null;
    this.isLoadingPrice = false;
    this.isLoadingRecommend = false;
  }

  applyRecommendation(): void {
    if (!this.selectedAnalysisReclamation || !this.currentRecommendData) return;
    
    const bestRecommendation = this.currentRecommendData.recommendations[0];
    const updateData: any = {
      notesExpert: `Recommandation IA: ${bestRecommendation.solution} (${bestRecommendation.confidence}%)\nJustification: ${this.currentRecommendData.analysis.decision.justification}`
    };
    if (this.currentPriceData) updateData.coutEstime = this.currentPriceData.price;
    
    this.isSubmitting = true;
    this.reclamationsService.updateReclamation(this.selectedAnalysisReclamation.id, updateData).subscribe({
      next: () => {
        this.loadReclamations();
        this.isSubmitting = false;
        this.showToast('Succès', 'Recommandation appliquée', 'success');
        this.closeRecommendationModal();
      },
      error: (err) => { this.isSubmitting = false; this.showToast('Erreur', 'Erreur application', 'error'); }
    });
  }

  openYoloModal(): void {
    this.showYoloModal = true;
    this.resetYoloState();
  }

  closeYoloModal(): void {
    this.showYoloModal = false;
    this.resetYoloState();
  }

  resetYoloState(): void {
    this.yoloResult = null;
    this.selectedFile = null;
    this.previewUrl = null;
    this.uploadProgress = 0;
    this.isRealYoloAnalysis = false;
    this.yoloAnalysisError = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.uploadProgress = 0;
      this.isRealYoloAnalysis = true;
      
      const reader = new FileReader();
      reader.onload = (e) => { this.previewUrl = e.target?.result as string; };
      reader.readAsDataURL(this.selectedFile);
      
      this.analyzeImageWithYolo(this.selectedFile);
    }
  }

  analyzeImageWithYolo(file: File): void {
    const interval = setInterval(() => { if (this.uploadProgress < 90) this.uploadProgress += 10; }, 300);
    
    this.reclamationsService.predictImage(file).subscribe({
      next: (prediction: PredictionResponse) => {
        clearInterval(interval);
        this.uploadProgress = 100;
        this.yoloResult = {
          title: 'Analyse automobile',
          description: `${prediction.boxes.length} dommage(s) détecté(s)`,
          category: this.getMainDamageCategory(prediction.boxes),
          damageCount: prediction.boxes.length,
          averageGravity: this.calculateAverageGravity(prediction.boxes),
          averageConfidence: this.calculateAverageConfidence(prediction.boxes),
          totalSeverity: prediction.total_damage,
          image_url: `http://localhost:8000${prediction.image_url}`,
          imageName: file.name,
          damages: prediction.boxes.map(box => ({ label: box.damage, confidence: box.confidence, severity: box.gravite }))
        };
        this.isRealYoloAnalysis = false;
        this.showToast('Analyse terminée', `${prediction.boxes.length} dommage(s) détecté(s)`, 'success');
      },
      error: (err) => {
        clearInterval(interval);
        this.isRealYoloAnalysis = false;
        this.yoloAnalysisError = err.message || 'Erreur analyse';
        this.showToast('Erreur', 'Échec analyse image', 'error');
        this.fallbackAnalyzeImage();
      }
    });
  }

  private fallbackAnalyzeImage(): void {
    setTimeout(() => {
      if (this.selectedFile) {
        this.yoloResult = {
          title: 'Détection de dommage',
          description: 'Rayure sur porte conducteur',
          category: 'Carrosserie',
          damageCount: 1,
          averageGravity: 6.5,
          averageConfidence: 0.89,
          totalSeverity: 6.5,
          image_url: this.previewUrl || '',
          imageName: this.selectedFile.name,
          damages: [{ label: 'Rayure', confidence: 0.89, severity: 6.5 }]
        };
        this.isRealYoloAnalysis = false;
      }
    }, 2000);
  }

  createReclamationFromYolo(): void {
    if (!this.yoloResult) return;
    this.isSubmitting = true;
    const userId = parseInt(localStorage.getItem('user_id') || '1');
    this.reclamationsService.createFromYolo(this.yoloResult, userId).subscribe({
      next: (reclamation) => {
        this.closeYoloModal();
        this.loadReclamations();
        this.isSubmitting = false;
        this.showToast('Succès', `Réclamation #${reclamation.id} créée`, 'success');
      },
      error: (error) => { this.isSubmitting = false; this.showToast('Erreur', 'Erreur création', 'error'); }
    });
  }

  openUploadModal(reclamation: Reclamation): void {
    this.selectedReclamation = reclamation;
    this.showUploadModal = true;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.selectedUploadFile = null;
    this.uploadPreviewUrl = null;
  }

  onUploadImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedUploadFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => { this.uploadPreviewUrl = e.target?.result as string; };
      reader.readAsDataURL(this.selectedUploadFile);
    }
  }

  uploadImage(): void {
    if (!this.selectedUploadFile || !this.selectedReclamation) return;
    this.isSubmitting = true;
    this.reclamationsService.uploadImage(this.selectedReclamation.id, this.selectedUploadFile).subscribe({
      next: () => {
        this.closeUploadModal();
        this.loadReclamations();
        this.isSubmitting = false;
        this.showToast('Succès', 'Image uploadée', 'success');
      },
      error: (error) => { this.isSubmitting = false; this.showToast('Erreur', 'Erreur upload', 'error'); }
    });
  }

  changerStatutReclamation(id: number, nouveauStatut: string): void {
    this.reclamationsService.changerStatut(id, nouveauStatut).subscribe({
      next: () => { this.loadReclamations(); this.showToast('Succès', `Statut changé`, 'success'); },
      error: (error) => { this.showToast('Erreur', 'Erreur changement statut', 'error'); }
    });
  }

  resoudreReclamation(id: number): void { this.changerStatutReclamation(id, 'RESOLU'); }
  rejeterReclamation(id: number): void { this.changerStatutReclamation(id, 'REJETE'); }
  mettreEnCours(id: number): void { this.changerStatutReclamation(id, 'EN_COURS'); }

  exportReclamations(): void {
    this.reclamationsService.exportToCsv({
      statut: this.selectedStatus !== 'all' ? this.selectedStatus : undefined,
      search: this.searchQuery || undefined
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reclamations_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showToast('Succès', 'Export CSV effectué', 'success');
      },
      error: (error) => { this.showToast('Erreur', 'Erreur export', 'error'); }
    });
  }

  openReportModal(): void {
    this.reportData = this.prepareReportData();
    this.showReportModal = true;
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportData = null;
  }

  prepareReportData(): any {
    return {
      generatedAt: new Date().toLocaleString('fr-FR'),
      totalReclamations: this.totalReclamations,
      parStatut: { detecte: this.attenteCount, enCours: this.enCoursCount, resolu: this.traiteeCount, rejete: this.rejeteCount },
      tauxResolution: this.resolutionRate,
      graviteMoyenne: this.graviteTotale.toFixed(1),
      coutTotal: this.coutTotalEstime
    };
  }

  generatePDFReport(): void {
    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('Rapport des Réclamations', 14, 20);
        doc.setFontSize(11);
        doc.text(`Généré le: ${this.reportData.generatedAt}`, 14, 30);
        doc.text(`Total: ${this.reportData.totalReclamations} réclamations`, 14, 38);
        doc.text(`Taux de résolution: ${this.reportData.tauxResolution}%`, 14, 46);
        (doc as any).autoTable({
          startY: 55,
          head: [['Statut', 'Nombre', 'Pourcentage']],
          body: [
            ['En attente', this.reportData.parStatut.detecte, ((this.reportData.parStatut.detecte / this.reportData.totalReclamations) * 100).toFixed(1) + '%'],
            ['En cours', this.reportData.parStatut.enCours, ((this.reportData.parStatut.enCours / this.reportData.totalReclamations) * 100).toFixed(1) + '%'],
            ['Résolues', this.reportData.parStatut.resolu, ((this.reportData.parStatut.resolu / this.reportData.totalReclamations) * 100).toFixed(1) + '%'],
            ['Rejetées', this.reportData.parStatut.rejete, ((this.reportData.parStatut.rejete / this.reportData.totalReclamations) * 100).toFixed(1) + '%']
          ]
        });
        doc.save(`rapport_reclamations_${new Date().toISOString().split('T')[0]}.pdf`);
        this.showToast('Succès', 'Rapport PDF généré', 'success');
        this.closeReportModal();
      });
    }).catch(() => { this.showToast('Erreur', 'Installation jspdf requise', 'error'); });
  }

  generateReport(): void { this.openReportModal(); }

  updateStatistics(): void {
    if (!this.reclamations || !Array.isArray(this.reclamations)) {
      this.totalReclamations = this.attenteCount = this.enCoursCount = this.traiteeCount = this.rejeteCount = 0;
      this.resolutionRate = 0;
      return;
    }
    this.totalReclamations = this.reclamations.length;
    this.attenteCount = this.reclamations.filter(r => r.statut === 'DETECTE').length;
    this.enCoursCount = this.reclamations.filter(r => r.statut === 'EN_COURS').length;
    this.traiteeCount = this.reclamations.filter(r => r.statut === 'RESOLU').length;
    this.rejeteCount = this.reclamations.filter(r => r.statut === 'REJETE').length;
    this.resolutionRate = this.totalReclamations > 0 ? (this.traiteeCount / this.totalReclamations) * 100 : 0;
  }

  getCriticityClass(gravity: number): string {
    if (gravity >= 8) return 'critical';
    if (gravity >= 6) return 'high';
    if (gravity >= 4) return 'medium';
    return 'low';
  }

  getCriticityLabel(gravity: number): string {
    if (gravity >= 8) return 'Critique';
    if (gravity >= 6) return 'Élevée';
    if (gravity >= 4) return 'Moyenne';
    return 'Faible';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { 'DETECTE': 'En attente', 'EN_COURS': 'En cours', 'RESOLU': 'Résolue', 'REJETE': 'Rejetée' };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = { 'DETECTE': 'attente', 'EN_COURS': 'encours', 'RESOLU': 'traitee', 'REJETE': 'rejete' };
    return map[status] || '';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Date inconnue';
    const date = new Date(dateStr);
    const diff = new Date().getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    let cleanPath = imageUrl;
    if (cleanPath.startsWith('/uploads/')) cleanPath = cleanPath.substring(1);
    else if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
    return `http://localhost:3000/${cleanPath}`;
  }

  getAvatarUrl(firstName?: string | null, lastName?: string | null): string {
    const name = encodeURIComponent(`${firstName || 'Utilisateur'} ${lastName || ''}`.trim());
    return `https://ui-avatars.com/api/?name=${name}&background=9D50BB&color=fff&bold=true&size=50`;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/default-image.png';
  }

  private getDeviceEncoding(reclamation: Reclamation): number {
    const vehicleType = (reclamation as any).vehicleType || 'standard';
    const deviceMap: Record<string, number> = { 'sedan': 0, 'suv': 1, 'compact': 2, 'standard': 0 };
    return deviceMap[vehicleType] || 0;
  }

  private getDamageEncoding(damageType: string): number {
    const damageMap: Record<string, number> = {
      'rayure': 0, 'scratch': 0, 'impact': 1, 'dent': 1, 'fissure': 2,
      'crack': 2, 'bris': 3, 'glass_shatter': 3, 'lamp_broken': 4, 'tire_flat': 5
    };
    return damageMap[damageType?.toLowerCase()] || 1;
  }

  private getMainDamageCategory(boxes: any[]): string {
    if (!boxes || boxes.length === 0) return 'Aucun dommage';
    const damages = boxes.map(b => b.damage);
    const freq: Record<string, number> = {};
    damages.forEach(d => freq[d] = (freq[d] || 0) + 1);
    return Object.entries(freq).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  private calculateAverageGravity(boxes: any[]): number {
    if (!boxes || boxes.length === 0) return 0;
    return parseFloat((boxes.reduce((acc, box) => acc + (box.gravite || 0), 0) / boxes.length).toFixed(1));
  }

  private calculateAverageConfidence(boxes: any[]): number {
    if (!boxes || boxes.length === 0) return 0;
    return parseFloat((boxes.reduce((acc, box) => acc + (box.confidence || 0), 0) / boxes.length).toFixed(2));
  }
}