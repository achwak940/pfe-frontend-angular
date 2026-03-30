import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReponsesService } from '../reponses.service';

@Component({
  selector: 'app-user-responses',
  templateUrl: './user-responses.component.html',
  styleUrls: ['./user-responses.component.css']
})
export class UserResponsesComponent implements OnInit, OnDestroy {
  // Données principales
  listeReponsesGlobal: any[] = [];
  filteredReponses: any[] = [];
  paginatedReponses: any[] = [];
  surveysList: any[] = [];
  
  // États UI
  exportDropdownVisible = false;
  modalVisible = false;
  selectedReponse: any = null;
  nombreReponses = 0;
  userId = 0;
  
  // Filtres
  searchTerm = '';
  filterType = 'all'; // all, recent, oldest
  sortBy = 'date_desc';
  dateDebut: string = '';
  dateFin: string = '';
  surveyFilter = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  
  // Notifications
  toasts: Array<{ message: string, type: string, icon: string }> = [];
  private toastTimeout: any;

  constructor(
    private http: HttpClient,
    private service: ReponsesService
  ) {}

  ngOnInit(): void {
    this.getCurrentUser();
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  getCurrentUser(): void {
    const user = localStorage.getItem('currentUser');
    if (user) {
      const currentUser = JSON.parse(user);
      this.userId = currentUser.id;
    }
  }

  loadData(): void {
    this.getAllReponsesGlobal();
    this.getNombreReponses();
    this.getSurveysList();
  }

  getAllReponsesGlobal(): void {
    this.service.getAllReponsesByAdmin(this.userId).subscribe({
      next: (res: any) => {
        this.listeReponsesGlobal = res.data || [];
        this.applyFilters();
        this.showToast('Données chargées avec succès', 'success', 'fas fa-check-circle');
      },
      error: (err: any) => {
        console.error('Erreur serveur ❌', err);
        this.showToast('Erreur lors du chargement des données', 'error', 'fas fa-exclamation-circle');
      }
    });
  }

  getSurveysList(): void {
    this.service.getAllReponsesByAdmin(this.userId).subscribe({
      next: (res: any) => {
        this.surveysList = res.data || [];
      },
      error: (err: any) => console.error('Erreur chargement questionnaires', err)
    });
  }

  applyFilters(): void {
    let filtered = [...this.listeReponsesGlobal];
    
    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(rep => 
        rep.prenom?.toLowerCase().includes(term) ||
        rep.nom?.toLowerCase().includes(term) ||
        rep.email?.toLowerCase().includes(term)
      );
    }
    
    // Filtre par date
    if (this.dateDebut) {
      const debut = new Date(this.dateDebut);
      filtered = filtered.filter(rep => new Date(rep.date_creation) >= debut);
    }
    if (this.dateFin) {
      const fin = new Date(this.dateFin);
      fin.setHours(23, 59, 59);
      filtered = filtered.filter(rep => new Date(rep.date_creation) <= fin);
    }
    
    // Filtre par questionnaire
    if (this.surveyFilter) {
      filtered = filtered.filter(rep => rep.enquete_id === +this.surveyFilter);
    }
    
    // Filtre type (récent/ancien)
    if (this.filterType === 'recent') {
      filtered = filtered.filter(rep => {
        const date = new Date(rep.date_creation);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      });
    } else if (this.filterType === 'oldest') {
      filtered = filtered.filter(rep => {
        const date = new Date(rep.date_creation);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 30;
      });
    }
    
    // Tri
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'date_desc':
          return new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime();
        case 'date_asc':
          return new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime();
        case 'name_asc':
          return `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`);
        case 'name_desc':
          return `${b.prenom} ${b.nom}`.localeCompare(`${a.prenom} ${a.nom}`);
        default:
          return 0;
      }
    });
    
    this.filteredReponses = filtered;
    this.totalPages = Math.ceil(this.filteredReponses.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePaginatedReponses();
  }

  updatePaginatedReponses(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedReponses = this.filteredReponses.slice(start, end);
  }

  setFilter(type: string): void {
    this.filterType = type;
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterType = 'all';
    this.sortBy = 'date_desc';
    this.dateDebut = '';
    this.dateFin = '';
    this.surveyFilter = '';
    this.applyFilters();
    this.showToast('Filtres réinitialisés', 'info', 'fas fa-info-circle');
  }

  // Pagination
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedReponses();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedReponses();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedReponses();
    }
  }

  changeItemsPerPage(): void {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredReponses.length / this.itemsPerPage);
    this.updatePaginatedReponses();
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

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  // Modal - CORRECTION ICI : Utiliser getDetaillesReponseByid avec D majuscule
  openModal(idReponse: number): void {
    this.service.getDetaillesReponseByid(idReponse).subscribe({
      next: (res: any) => {
        this.selectedReponse = res.data;
        this.modalVisible = true;
      },
      error: (err: any) => {
        console.error('Erreur récupération détail réponse', err);
        this.showToast('Erreur lors du chargement des détails', 'error', 'fas fa-exclamation-circle');
      }
    });
  }

  closeModal(): void {
    this.selectedReponse = null;
    this.modalVisible = false;
  }

  // Export
  toggleExportDropdown(): void {
    this.exportDropdownVisible = !this.exportDropdownVisible;
    
    // Fermer le dropdown après 3 secondes
    setTimeout(() => {
      this.exportDropdownVisible = false;
    }, 3000);
  }

  downloadCSV(): void {
    this.service.exportReponsesCsv(this.userId).subscribe({
      next: (data: Blob) => {
        this.downloadBlob(data, 'reponses.csv', 'text/csv');
        this.showToast('Export CSV réussi', 'success', 'fas fa-file-csv');
      },
      error: (err: any) => {
        console.error('Erreur téléchargement CSV', err);
        this.showToast('Erreur lors de l\'export CSV', 'error', 'fas fa-exclamation-circle');
      }
    });
  }

  telechargementPdf(): void {
    this.service.exportAllReponsesPdf(this.userId).subscribe({
      next: (blob: Blob) => {
        this.downloadBlob(blob, 'reponses.pdf', 'application/pdf');
        this.showToast('Export PDF réussi', 'success', 'fas fa-file-pdf');
      },
      error: (err: any) => {
        console.error('Erreur téléchargement PDF', err);
        this.showToast('Erreur lors de l\'export PDF', 'error', 'fas fa-exclamation-circle');
      }
    });
  }

  downloadExcel(): void {
    this.service.exportAllReponsesExcel(this.userId).subscribe({
      next: (data: Blob) => {
        this.downloadBlob(data, 'reponses.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        this.showToast('Export Excel réussi', 'success', 'fas fa-file-excel');
      },
      error: (err: any) => {
        console.error('Erreur téléchargement Excel', err);
        this.showToast('Erreur lors de l\'export Excel', 'error', 'fas fa-exclamation-circle');
      }
    });
  }

  private downloadBlob(blob: Blob, filename: string, mimeType: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  getNombreReponses(): void {
    this.service.getNombreReponsesByAdmin(this.userId).subscribe({
      next: (res: any) => {
        this.nombreReponses = res.nomberReponses || 0;
      },
      error: (err: any) => console.error('Erreur serveur ❌', err)
    });
  }

  // Utilitaires
  copyToClipboard(text: string): void {
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Email copié dans le presse-papier', 'success', 'fas fa-copy');
    }).catch(() => {
      this.showToast('Erreur lors de la copie', 'error', 'fas fa-exclamation-circle');
    });
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  showToast(message: string, type: string, icon: string): void {
    this.toasts.push({ message, type, icon });
    
    // Auto-supprimer après 3 secondes
    setTimeout(() => {
      this.toasts.shift();
    }, 3000);
  }
}