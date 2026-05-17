// src/app/dashboard/dashboard-admin/gestion-reclamation/gestion-reclamation.component.ts
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

@Component({
  selector: 'app-gestion-reclamation',
  templateUrl: './gestion-reclamation.component.html',
  styleUrls: ['./gestion-reclamation.component.css']
})
export class GestionReclamationComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('uploadImageInput') uploadImageInput!: ElementRef<HTMLInputElement>;

  // Data
  reclamations: Reclamation[] = [];
  filteredReclamations: Reclamation[] = [];
  displayedReclamations: Reclamation[] = [];
  selectedReclamation: Reclamation | null = null;
  
  // UI State
  isLoading = false;
  isAnalyzing = false;
  isSubmitting = false;
  isSelectionMode = false;
  activeMenuId: number | null = null;
  
  // Selection
  selectedIds: number[] = [];
  
  // Filters
  searchQuery = '';
  selectedStatus = 'all';
  selectedGravity = 'all';
  selectedPeriod = 'all';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;
  
  // Statistics
  totalReclamations = 0;
  attenteCount = 0;
  enCoursCount = 0;
  traiteeCount = 0;
  rejeteCount = 0;
  resolutionRate = 0;
  avgResponseTime = 24;
  currentDate: Date = new Date();
  
  // Forms
  responseForm!: FormGroup;
  correctionForm!: FormGroup;
  
  // Modals
  showResponseModal = false;
  showCorrectionModal = false;
  showYoloModal = false;
  showDetailsModal = false;
  showImageModal = false;
  showUploadModal = false;
  showAnalysisModal = false;
  showReportModal = false;
  
  // YOLO
  yoloResult: YoloAnalysisResult | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadProgress = 0;
  
  // Image upload
  selectedUploadFile: File | null = null;
  uploadPreviewUrl: string | null = null;
  
  // Image fullscreen with zoom
  currentImageUrl: string | null = null;
  currentImageName: string | null = null;
  zoomLevel: number = 1;
  imagePosition = { x: 0, y: 0 };
  isDragging = false;
  dragStart = { x: 0, y: 0 };
  imageContainerRef: ElementRef | null = null;
  
  // Analyse IA détaillée
  selectedReclamationForAnalysis: Reclamation | null = null;
  
  // Toast notifications
  toasts: Toast[] = [];
  private toastIdCounter = 0;
  
  // Report generation
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

  // ==================== TOAST NOTIFICATIONS ====================

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
    if (toast.timer) {
      clearTimeout(toast.timer);
    }
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

  // ==================== UI HELPERS ====================

  private handleClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-icon') && !target.closest('.card-menu')) {
      this.activeMenuId = null;
    }
  }

  toggleCardMenu(id: number): void {
    this.activeMenuId = this.activeMenuId === id ? null : id;
  }

  // ==================== CHARGEMENT DES DONNÉES ====================

  loadReclamations(): void {
    this.isLoading = true;
    
    const filters: any = {};
    if (this.selectedStatus !== 'all') {
      filters.statut = this.selectedStatus;
    }
    if (this.searchQuery) {
      filters.search = this.searchQuery;
    }
    
    this.reclamationsService.getAllReclamations(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Reclamation[]) => {
          if (data && Array.isArray(data)) {
            this.reclamations = data;
            console.log('✅ Réclamations chargées:', this.reclamations.length);
            this.applyFilters();
            this.updateStatistics();
            this.showToast('Succès', `${data.length} réclamation(s) chargée(s) avec succès`, 'success');
          } else {
            console.error('❌ Les données reçues ne sont pas un tableau:', data);
            this.reclamations = [];
            this.applyFilters();
            this.showToast('Erreur', 'Format de données invalide', 'error');
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('❌ Erreur chargement:', error);
          this.isLoading = false;
          this.reclamations = [];
          this.applyFilters();
          this.showToast('Erreur', 'Impossible de charger les réclamations. Vérifiez la connexion au serveur.', 'error');
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
      error: (error: any) => {
        console.error('❌ Erreur chargement stats:', error);
      }
    });
  }

  // ==================== FILTRES ET RECHERCHE ====================

  applyFilters(): void {
    if (!this.reclamations || !Array.isArray(this.reclamations)) {
      this.filteredReclamations = [];
      this.totalPages = 1;
      this.currentPage = 1;
      this.loadPage();
      return;
    }
    
    let filtered = [...this.reclamations];
    
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(r => r.statut === this.selectedStatus);
    }
    
    if (this.selectedGravity !== 'all') {
      if (this.selectedGravity === 'faible') {
        filtered = filtered.filter(r => (r.gravite || 0) < 4);
      } else if (this.selectedGravity === 'moyenne') {
        filtered = filtered.filter(r => (r.gravite || 0) >= 4 && (r.gravite || 0) < 6);
      } else if (this.selectedGravity === 'elevee') {
        filtered = filtered.filter(r => (r.gravite || 0) >= 6 && (r.gravite || 0) < 8);
      } else if (this.selectedGravity === 'critique') {
        filtered = filtered.filter(r => (r.gravite || 0) >= 8);
      }
    }
    
    if (this.selectedPeriod !== 'all') {
      filtered = this.filterByPeriodData(filtered, this.selectedPeriod);
    }
    
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
      default:
        return reclamations;
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
    this.selectedPeriod = 'all';
    this.loadReclamations();
    this.showToast('Info', `Filtre appliqué: ${this.getStatusLabel(status)}`, 'info');
  }

  filterByPeriod(period: string): void {
    this.selectedPeriod = period;
    this.applyFilters();
    
    const periodLabels: Record<string, string> = {
      'today': "aujourd'hui",
      'week': 'cette semaine',
      'month': 'ce mois'
    };
    this.showToast('Info', `Filtre par période: ${periodLabels[period] || period} - ${this.filteredReclamations.length} réclamation(s) trouvée(s)`, 'info');
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
    this.showToast('Info', 'Recherche effacée', 'info');
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = 'all';
    this.selectedGravity = 'all';
    this.selectedPeriod = 'all';
    this.loadReclamations();
    this.showToast('Info', 'Tous les filtres ont été réinitialisés', 'info');
  }

  // ==================== PAGINATION ====================

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
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ==================== SÉLECTION MULTIPLE ====================

  openBulkActions(): void {
    this.isSelectionMode = true;
    this.showToast('Info', 'Mode sélection activé. Cliquez sur les cases à cocher pour sélectionner les réclamations.', 'info');
  }

  exitSelectionMode(): void {
    this.isSelectionMode = false;
    this.selectedIds = [];
    this.showToast('Info', 'Mode sélection désactivé', 'info');
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
    if (this.selectedIds.length === 0) {
      this.showToast('Attention', 'Aucune réclamation sélectionnée', 'warning');
      return;
    }
    
    const statusLabel = status === 'EN_COURS' ? 'en cours' : 
                        status === 'RESOLU' ? 'résolues' : 
                        status === 'DETECTE' ? 'détectées' :
                        status === 'REJETE' ? 'rejetées' : status;
    
    if (confirm(`Êtes-vous sûr de vouloir passer ${this.selectedIds.length} réclamation(s) en statut "${statusLabel}" ?`)) {
      this.isSubmitting = true;
      this.reclamationsService.updateMultiple(this.selectedIds, { statut: status }).subscribe({
        next: () => {
          this.loadReclamations();
          this.exitSelectionMode();
          this.isSubmitting = false;
          this.showToast('Succès', `${this.selectedIds.length} réclamation(s) passée(s) en ${statusLabel}`, 'success');
        },
        error: (err: any) => {
          console.error('❌ Erreur bulk update:', err);
          this.isSubmitting = false;
          this.showToast('Erreur', 'Erreur lors de la mise à jour des statuts', 'error');
        }
      });
    }
  }

  deleteSelected(): void {
    if (this.selectedIds.length === 0) {
      this.showToast('Attention', 'Aucune réclamation sélectionnée', 'warning');
      return;
    }
    
    if (confirm(`⚠️ Supprimer ${this.selectedIds.length} réclamation(s) ? Cette action est irréversible.`)) {
      this.isSubmitting = true;
      this.reclamationsService.deleteMultiple(this.selectedIds).subscribe({
        next: () => {
          this.loadReclamations();
          this.exitSelectionMode();
          this.isSubmitting = false;
          this.showToast('Succès', `${this.selectedIds.length} réclamation(s) supprimée(s)`, 'success');
        },
        error: (err: any) => {
          console.error('❌ Erreur suppression multiple:', err);
          this.isSubmitting = false;
          this.showToast('Erreur', 'Erreur lors de la suppression', 'error');
        }
      });
    }
  }

  // ==================== SUPPRESSION INDIVIDUELLE ====================

  deleteReclamation(id: number): void {
    if (confirm('⚠️ Supprimer cette réclamation ? Cette action est irréversible.')) {
      this.reclamationsService.deleteReclamation(id).subscribe({
        next: () => {
          this.loadReclamations();
          this.showToast('Succès', `Réclamation #${id} supprimée`, 'success');
        },
        error: (err: any) => {
          console.error('❌ Erreur de suppression:', err);
          this.showToast('Erreur', `Impossible de supprimer la réclamation #${id}`, 'error');
        }
      });
    }
  }

  // ==================== DÉTAILS ET NAVIGATION ====================

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
    console.log('✅ Décision confirmée:', event);
    this.showToast('Succès', 'Décision enregistrée avec succès', 'success');
    this.closeAnalysisModal();
    this.loadReclamations();
  }

  // ==================== IMAGE FULLSCREEN AVEC ZOOM ====================

  openImageFullscreen(reclamation: Reclamation): void {
    console.log('🔍 openImageFullscreen:', reclamation);
    
    if (reclamation.imageUrl) {
      const imageUrl = this.getImageUrl(reclamation.imageUrl);
      console.log('📸 URL image:', imageUrl);
      
      this.resetImageZoom();
      
      const testImg = new Image();
      testImg.onload = () => {
        console.log('✅ Image chargée');
        this.currentImageUrl = imageUrl;
        this.currentImageName = reclamation.imageName || `image_${reclamation.id}`;
        this.showImageModal = true;
        document.body.style.overflow = 'hidden';
      };
      testImg.onerror = () => {
        console.error('❌ Impossible de charger l\'image');
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
    if (this.zoomLevel < 3) {
      this.zoomLevel = Math.min(3, this.zoomLevel + 0.25);
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 0.5) {
      this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.25);
      if (this.zoomLevel === 1) {
        this.imagePosition = { x: 0, y: 0 };
      }
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
      this.imagePosition = {
        x: event.clientX - this.dragStart.x,
        y: event.clientY - this.dragStart.y
      };
    }
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  getImageTransform(): string {
    return `translate(${this.imagePosition.x}px, ${this.imagePosition.y}px) scale(${this.zoomLevel})`;
  }

  getZoomPercentage(): number {
    return Math.round(this.zoomLevel * 100);
  }

  // ==================== TÉLÉCHARGEMENT D'IMAGE ====================

  downloadImage(reclamation: Reclamation): void {
    if (reclamation.imageUrl) {
      const url = this.getImageUrl(reclamation.imageUrl);
      this.downloadImageFromUrl(url, reclamation.imageName || `reclamation_${reclamation.id}.jpg`);
    } else {
      this.showToast('Erreur', 'Aucune image à télécharger', 'error');
    }
  }

  downloadCurrentImage(): void {
    if (this.currentImageUrl) {
      this.downloadImageFromUrl(this.currentImageUrl, this.currentImageName || 'image.jpg');
    }
  }

  private downloadImageFromUrl(url: string, filename: string): void {
    fetch(url, { mode: 'cors', credentials: 'omit' })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.blob();
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = this.sanitizeFilename(filename);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
        this.showToast('Succès', 'Téléchargement démarré', 'success');
      })
      .catch(error => {
        console.error('Erreur fetch:', error);
        window.open(url, '_blank');
        this.showToast('Info', 'L\'image s\'ouvre dans un nouvel onglet', 'info');
      });
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '_');
  }

  // ==================== MODAL RÉPONSE ====================

  openResponseModal(reclamation: Reclamation): void {
    this.selectedReclamation = reclamation;
    this.responseForm.reset({ 
      message: '', 
      sendEmail: true, 
      sendSMS: false, 
      priority: 'normal' 
    });
    this.showResponseModal = true;
    this.activeMenuId = null;
  }

  closeResponseModal(): void {
    this.showResponseModal = false;
    this.selectedReclamation = null;
    this.responseForm.reset();
  }

  sendResponse(): void {
    if (this.responseForm.invalid || !this.selectedReclamation) {
      this.showToast('Erreur', 'Veuillez remplir le message (min 10 caractères)', 'error');
      return;
    }
    
    this.isSubmitting = true;
    this.reclamationsService.repondreReclamation(this.selectedReclamation.id, {
      message: this.responseForm.value.message,
      priority: this.responseForm.value.priority,
      sendEmail: this.responseForm.value.sendEmail,
      sendSMS: this.responseForm.value.sendSMS
    }).subscribe({
      next: () => {
        this.closeResponseModal();
        this.loadReclamations();
        this.isSubmitting = false;
        this.showToast('Succès', 'Notification envoyée avec succès', 'success');
      },
      error: (error: any) => {
        console.error('❌ Erreur envoi réponse:', error);
        this.isSubmitting = false;
        this.showToast('Erreur', 'Erreur lors de l\'envoi', 'error');
      }
    });
  }

  // ==================== MODAL CORRECTION ====================

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
    this.correctionForm.reset();
  }

  submitCorrection(): void {
    if (this.correctionForm.invalid || !this.selectedReclamation) {
      this.showToast('Erreur', 'Formulaire invalide', 'error');
      return;
    }
    
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
      error: (error: any) => {
        console.error('❌ Erreur correction:', error);
        this.isSubmitting = false;
        this.showToast('Erreur', 'Erreur lors de l\'enregistrement', 'error');
      }
    });
  }

  // ==================== YOLO ====================

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
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      
      const interval = setInterval(() => {
        if (this.uploadProgress < 100) {
          this.uploadProgress += 20;
        } else {
          clearInterval(interval);
          this.analyzeImage();
        }
      }, 200);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  analyzeImage(): void {
    if (!this.selectedFile) return;
    this.isAnalyzing = true;
    
    setTimeout(() => {
      this.yoloResult = {
        title: 'Détection de dommage automobile',
        description: 'Rayure profonde sur la porte conducteur',
        category: 'Carrosserie',
        damageCount: 1,
        averageGravity: 6.5,
        averageConfidence: 0.89,
        totalSeverity: 6.5,
        image_url: this.previewUrl || '',
        imageName: this.selectedFile?.name || 'image.jpg',
        damages: [{ label: 'Rayure', confidence: 0.89, severity: 6.5 }]
      };
      this.isAnalyzing = false;
      this.showToast('Succès', 'Analyse YOLO terminée', 'success');
    }, 2000);
  }

  createReclamationFromYolo(): void {
    if (!this.yoloResult) {
      this.showToast('Erreur', 'Aucun résultat YOLO', 'error');
      return;
    }
    
    this.isSubmitting = true;
    const userId = parseInt(localStorage.getItem('user_id') || '1');
    
    this.reclamationsService.createFromYolo(this.yoloResult, userId).subscribe({
      next: () => {
        this.closeYoloModal();
        this.loadReclamations();
        this.isSubmitting = false;
        this.showToast('Succès', 'Réclamation créée via YOLO', 'success');
      },
      error: (error: any) => {
        console.error('❌ Erreur création YOLO:', error);
        this.isSubmitting = false;
        this.showToast('Erreur', 'Erreur lors de la création', 'error');
      }
    });
  }

  // ==================== UPLOAD IMAGE ====================

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
      reader.onload = (e) => {
        this.uploadPreviewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedUploadFile);
    }
  }

  uploadImage(): void {
    if (!this.selectedUploadFile || !this.selectedReclamation) {
      this.showToast('Erreur', 'Aucun fichier sélectionné', 'error');
      return;
    }
    
    this.isSubmitting = true;
    this.reclamationsService.uploadImage(this.selectedReclamation.id, this.selectedUploadFile).subscribe({
      next: () => {
        this.closeUploadModal();
        this.loadReclamations();
        this.isSubmitting = false;
        this.showToast('Succès', 'Image uploadée avec succès', 'success');
      },
      error: (error: any) => {
        console.error('❌ Erreur upload:', error);
        this.isSubmitting = false;
        this.showToast('Erreur', 'Erreur lors de l\'upload', 'error');
      }
    });
  }

  // ==================== GESTION DES STATUTS ====================

  changerStatutReclamation(id: number, nouveauStatut: string): void {
    const statutLabels: Record<string, string> = {
      'DETECTE': 'détectée',
      'EN_COURS': 'en cours',
      'RESOLU': 'résolue',
      'REJETE': 'rejetée'
    };
    
    if (confirm(`Passer cette réclamation en ${statutLabels[nouveauStatut]} ?`)) {
      this.reclamationsService.changerStatut(id, nouveauStatut).subscribe({
        next: () => {
          this.loadReclamations();
          this.showToast('Succès', `Réclamation #${id} passée en ${statutLabels[nouveauStatut]}`, 'success');
        },
        error: (error: any) => {
          console.error('❌ Erreur changement statut:', error);
          this.showToast('Erreur', 'Erreur lors du changement de statut', 'error');
        }
      });
    }
  }

  resoudreReclamation(id: number): void {
    this.changerStatutReclamation(id, 'RESOLU');
  }

  rejeterReclamation(id: number): void {
    this.changerStatutReclamation(id, 'REJETE');
  }

  mettreEnCours(id: number): void {
    this.changerStatutReclamation(id, 'EN_COURS');
  }

  // ==================== EXPORT ====================

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
      error: (error: any) => {
        console.error('❌ Erreur export:', error);
        this.showToast('Erreur', 'Erreur lors de l\'export', 'error');
      }
    });
  }

  // ==================== RAPPORT ====================

  openReportModal(): void {
    this.isGeneratingReport = true;
    this.reportData = this.prepareReportData();
    this.showReportModal = true;
    this.isGeneratingReport = false;
  }

  closeReportModal(): void {
    this.showReportModal = false;
    this.reportData = null;
  }

  prepareReportData(): any {
    const now = new Date();
    return {
      generatedAt: now.toLocaleString('fr-FR'),
      totalReclamations: this.totalReclamations,
      parStatut: {
        detecte: this.attenteCount,
        enCours: this.enCoursCount,
        resolu: this.traiteeCount,
        rejete: this.rejeteCount
      },
      tauxResolution: this.resolutionRate,
      graviteMoyenne: this.graviteTotale.toFixed(1),
      coutTotal: this.coutTotalEstime,
      reclamations: this.filteredReclamations
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
            ['En attente', this.reportData.parStatut.detecte, 
             ((this.reportData.parStatut.detecte / this.reportData.totalReclamations) * 100).toFixed(1) + '%'],
            ['En cours', this.reportData.parStatut.enCours, 
             ((this.reportData.parStatut.enCours / this.reportData.totalReclamations) * 100).toFixed(1) + '%'],
            ['Résolues', this.reportData.parStatut.resolu, 
             ((this.reportData.parStatut.resolu / this.reportData.totalReclamations) * 100).toFixed(1) + '%'],
            ['Rejetées', this.reportData.parStatut.rejete, 
             ((this.reportData.parStatut.rejete / this.reportData.totalReclamations) * 100).toFixed(1) + '%']
          ]
        });
        
        doc.save(`rapport_reclamations_${new Date().toISOString().split('T')[0]}.pdf`);
        this.showToast('Succès', 'Rapport PDF généré', 'success');
        this.closeReportModal();
      });
    }).catch(() => {
      this.showToast('Erreur', 'Installation jspdf requise', 'error');
    });
  }

  generateReport(): void {
    this.openReportModal();
  }

  // ==================== UTILITAIRES ====================

  updateStatistics(): void {
    if (!this.reclamations || !Array.isArray(this.reclamations)) {
      this.totalReclamations = 0;
      this.attenteCount = 0;
      this.enCoursCount = 0;
      this.traiteeCount = 0;
      this.rejeteCount = 0;
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
    const map: Record<string, string> = {
      'DETECTE': 'En attente',
      'EN_COURS': 'En cours',
      'RESOLU': 'Résolue',
      'REJETE': 'Rejetée'
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'DETECTE': 'attente',
      'EN_COURS': 'encours',
      'RESOLU': 'traitee',
      'REJETE': 'rejete'
    };
    return map[status] || '';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Date inconnue';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    let cleanPath = imageUrl;
    if (cleanPath.startsWith('/uploads/')) {
      cleanPath = cleanPath.substring(1);
    } else if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    return `http://localhost:3000/${cleanPath}`;
  }

  getAvatarUrl(firstName?: string | null, lastName?: string | null): string {
    const first = firstName || 'Utilisateur';
    const last = lastName || '';
    const name = encodeURIComponent(`${first} ${last}`.trim());
    return `https://ui-avatars.com/api/?name=${name}&background=9D50BB&color=fff&bold=true&size=50`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/default-image.png';
  }
}