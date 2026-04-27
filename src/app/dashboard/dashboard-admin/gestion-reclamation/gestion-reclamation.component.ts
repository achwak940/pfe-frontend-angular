// src/app/dashboard/dashboard-admin/gestion-reclamation/gestion-reclamation.component.ts
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CreateReclamationDto, Reclamation, ReclamationsService, YoloAnalysisResult } from '../reclmations.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-gestion-reclamation',
  templateUrl: './gestion-reclamation.component.html',
  styleUrls: ['./gestion-reclamation.component.css']
})
export class GestionReclamationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  public Math = Math;
  
  reclamations: Reclamation[] = [];
  filteredReclamations: Reclamation[] = [];
  displayedReclamations: Reclamation[] = [];
  selectedReclamation: Reclamation | null = null;
  
  isLoading = false;
  isAnalyzing = false;
  isSubmitting = false;
  isDeleting = false;
  
  showFilters = false;
  isSelectionMode = false;
  isGridView = true;
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'info' | 'warning' = 'success';
  
  selectedIds: number[] = [];
  selectAll = false;
  
  searchQuery = '';
  selectedStatus = 'all';
  selectedGravity = 'all';
  dateRange = { start: '', end: '' };
  sortBy = 'date_desc';
  
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;
  pageSizeOptions = [6, 12, 24, 48];
  
  totalReclamations = 0;
  attenteCount = 0;
  traiteeCount = 0;
  enCoursCount = 0;
  rejeteCount = 0;
  graviteTotale = 0;
  coutTotalEstime = 0;
  resolutionRate = 0;
  
  responseForm!: FormGroup;
  correctionForm!: FormGroup;
  filterForm!: FormGroup;
  
  showResponseModal = false;
  showCorrectionModal = false;
  showYoloModal = false;
  showDetailsModal = false;
  showExportModal = false;
  
  yoloResult: YoloAnalysisResult | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadProgress = 0;
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private reclamationsService: ReclamationsService,
    private fb: FormBuilder
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
    
    this.filterForm = this.fb.group({
      status: ['all'],
      gravity: ['all'],
      startDate: [''],
      endDate: ['']
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
  }

  ngAfterViewInit(): void {
    this.initAnimations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initAnimations(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.claim-card').forEach(el => observer.observe(el));
  }

  loadReclamations(): void {
    this.isLoading = true;
    this.reclamationsService.getAllReclamations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Reclamation[]) => {
          this.reclamations = data;
          this.applyFilters();
          this.updateStatistics();
          this.isLoading = false;
          this.showNotificationMessage('Réclamations chargées', 'success');
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.isLoading = false;
          this.showNotificationMessage('Erreur de chargement', 'error');
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.reclamations];
    
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(r => r.statut === this.selectedStatus);
    }
    
    if (this.selectedGravity !== 'all') {
      if (this.selectedGravity === 'faible') {
        filtered = filtered.filter(r => r.gravite < 4);
      } else if (this.selectedGravity === 'moyenne') {
        filtered = filtered.filter(r => r.gravite >= 4 && r.gravite < 7);
      } else if (this.selectedGravity === 'elevee') {
        filtered = filtered.filter(r => r.gravite >= 7);
      }
    }
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.id.toString().includes(query) ||
        r.titre?.toLowerCase().includes(query) ||
        r.user?.nom?.toLowerCase().includes(query) ||
        r.user?.prenom?.toLowerCase().includes(query)
      );
    }
    
    this.filteredReclamations = filtered;
    this.totalPages = Math.ceil(this.filteredReclamations.length / this.itemsPerPage);
    this.currentPage = 1;
    this.loadPage();
  }

  loadPage(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.displayedReclamations = this.filteredReclamations.slice(start, end);
  }

  onSearchInput(query: string): void {
    this.searchSubject.next(query);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = 'all';
    this.selectedGravity = 'all';
    this.dateRange = { start: '', end: '' };
    this.applyFilters();
    this.showNotificationMessage('Filtres réinitialisés', 'success');
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

  toggleSelection(id: number): void {
    if (this.selectedIds.includes(id)) {
      this.selectedIds = this.selectedIds.filter(i => i !== id);
    } else {
      this.selectedIds.push(id);
    }
    this.isSelectionMode = this.selectedIds.length > 0;
    this.selectAll = this.selectedIds.length === this.displayedReclamations.length;
  }

  exitSelectionMode(): void {
    this.isSelectionMode = false;
    this.selectedIds = [];
    this.selectAll = false;
  }

  deleteSelected(): void {
    if (this.selectedIds.length === 0) return;
    
    if (confirm(`Supprimer ${this.selectedIds.length} réclamation(s) ?`)) {
      this.selectedIds.forEach(id => {
        this.reclamationsService.deleteReclamation(id).subscribe({
          next: () => this.loadReclamations(),
          error: (err) => console.error(err)
        });
      });
      this.exitSelectionMode();
      this.showNotificationMessage(`${this.selectedIds.length} réclamation(s) supprimée(s)`, 'success');
    }
  }

  deleteReclamation(id: number): void {
    if (confirm('Supprimer cette réclamation ?')) {
      this.reclamationsService.deleteReclamation(id).subscribe({
        next: () => {
          this.loadReclamations();
          this.showNotificationMessage('Réclamation supprimée', 'success');
        },
        error: () => this.showNotificationMessage('Erreur de suppression', 'error')
      });
    }
  }

  openResponseModal(reclamation: Reclamation): void {
    this.selectedReclamation = reclamation;
    this.responseForm.reset({ message: '', sendEmail: true, sendSMS: false, priority: 'normal' });
    this.showResponseModal = true;
  }

  openCorrectionModal(reclamation: Reclamation): void {
    this.selectedReclamation = reclamation;
    this.correctionForm.patchValue({
      problemDetected: reclamation.description,
      severity: reclamation.gravite,
      confidence: reclamation.confiance * 100
    });
    this.showCorrectionModal = true;
  }

  sendResponse(): void {
    if (this.responseForm.invalid || !this.selectedReclamation) return;
    
    this.isSubmitting = true;
    this.reclamationsService.repondreReclamation(this.selectedReclamation.id, {
      message: this.responseForm.value.message,
      priority: this.responseForm.value.priority,
      sendEmail: this.responseForm.value.sendEmail,
      sendSMS: this.responseForm.value.sendSMS
    }).subscribe({
      next: () => {
        this.showNotificationMessage('Réponse envoyée', 'success');
        this.closeResponseModal();
        this.loadReclamations();
        this.isSubmitting = false;
      },
      error: () => {
        this.showNotificationMessage('Erreur d\'envoi', 'error');
        this.isSubmitting = false;
      }
    });
  }

  submitCorrection(): void {
    if (this.correctionForm.invalid || !this.selectedReclamation) return;
    
    this.isSubmitting = true;
    this.reclamationsService.updateReclamation(this.selectedReclamation.id, {
      description: this.correctionForm.value.problemDetected,
      gravite: this.correctionForm.value.severity,
      confiance: this.correctionForm.value.confidence / 100
    }).subscribe({
      next: () => {
        this.showNotificationMessage('Correction enregistrée', 'success');
        this.closeCorrectionModal();
        this.loadReclamations();
        this.isSubmitting = false;
      },
      error: () => {
        this.showNotificationMessage('Erreur de correction', 'error');
        this.isSubmitting = false;
      }
    });
  }

  openYoloModal(): void {
    this.showYoloModal = true;
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
        damages: [{ label: 'Rayure', confidence: 0.89, severity: 6 }]
      };
      this.isAnalyzing = false;
      this.showNotificationMessage('Analyse terminée', 'success');
    }, 2000);
  }

  createReclamationFromYolo(): void {
    if (!this.yoloResult) return;
    
    this.isSubmitting = true;
    const userId = parseInt(localStorage.getItem('user_id') || '1');
    
    this.reclamationsService.createFromYolo(this.yoloResult, userId).subscribe({
      next: () => {
        this.showNotificationMessage('Réclamation créée', 'success');
        this.closeYoloModal();
        this.loadReclamations();
        this.isSubmitting = false;
      },
      error: () => {
        this.showNotificationMessage('Erreur de création', 'error');
        this.isSubmitting = false;
      }
    });
  }

  updateStatistics(): void {
    this.totalReclamations = this.reclamations.length;
    this.attenteCount = this.reclamations.filter(r => r.statut === 'DETECTE').length;
    this.traiteeCount = this.reclamations.filter(r => r.statut === 'RESOLU').length;
    this.enCoursCount = this.reclamations.filter(r => r.statut === 'EN_COURS').length;
    this.rejeteCount = this.reclamations.filter(r => r.statut === 'REJETE').length;
    
    const totalGravite = this.reclamations.reduce((sum, r) => sum + (r.gravite || 0), 0);
    this.graviteTotale = this.reclamations.length > 0 ? totalGravite / this.reclamations.length : 0;
    this.coutTotalEstime = this.reclamations.reduce((sum, r) => sum + ((r.totalSeverite || 0) * 50), 0);
    this.resolutionRate = this.totalReclamations > 0 ? (this.traiteeCount / this.totalReclamations) * 100 : 0;
  }

  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return 'assets/images/no-image.png';
    let cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    return `http://localhost:3000/${cleanPath}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/no-image.png';
  }

  openImage(imageUrl: string): void {
    window.open(this.getImageUrl(imageUrl), '_blank');
  }

  getGravityClass(gravity: number): string {
    if (gravity < 4) return 'faible';
    if (gravity < 7) return 'moyenne';
    return 'elevee';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'DETECTE': 'En attente',
      'EN_COURS': 'En cours',
      'RESOLU': 'Traitée',
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
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  closeResponseModal(): void {
    this.showResponseModal = false;
    this.responseForm.reset();
  }

  closeCorrectionModal(): void {
    this.showCorrectionModal = false;
    this.correctionForm.reset();
  }

  closeYoloModal(): void {
    this.showYoloModal = false;
    this.resetYoloState();
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedReclamation = null;
  }

  private showNotificationMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;
    setTimeout(() => { this.showNotification = false; }, 4000);
  }

  getSeverityColor(severity: number): string {
    if (severity < 4) return '#2ecc71';
    if (severity < 7) return '#f39c12';
    return '#e74c3c';
  }

  getConfidenceColor(confidence: number): string {
    if (confidence > 0.8) return '#2ecc71';
    if (confidence > 0.6) return '#f39c12';
    return '#e74c3c';
  }
}