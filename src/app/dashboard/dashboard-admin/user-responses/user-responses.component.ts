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
  filterType = 'all';
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
  private refreshInterval: any;

  constructor(private service: ReponsesService) {}

  ngOnInit(): void {
    this.getCurrentUser();
    this.loadData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.loadData();
    }, 30000);
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
  }

  getAllReponsesGlobal(): void {
    this.service.getAllReponsesByAdmin(this.userId).subscribe({
      next: (res: any) => {
        this.listeReponsesGlobal = res.data || [];
        this.extractSurveysFromResponses();
        this.applyFilters();
        this.showToast('Données chargées avec succès', 'success', 'fas fa-check-circle');
      },
      error: (err: any) => {
        console.error('Erreur serveur ❌', err);
        this.showToast('Erreur lors du chargement des données', 'error', 'fas fa-exclamation-circle');
      }
    });
  }

  extractSurveysFromResponses(): void {
    const surveysMap = new Map();
    this.listeReponsesGlobal.forEach(rep => {
      if (rep.enquete_id && rep.titre && !surveysMap.has(rep.enquete_id)) {
        surveysMap.set(rep.enquete_id, {
          id: rep.enquete_id,
          titre: rep.titre
        });
      }
    });
    this.surveysList = Array.from(surveysMap.values());
  }

  loadSurveysList(): void {
    this.service.getAllReponsesByAdmin(this.userId).subscribe({
      next: (res: any) => {
        const data = res.data || [];
        const surveysMap = new Map();
        data.forEach((rep: any) => {
          if (rep.enquete_id && rep.titre && !surveysMap.has(rep.enquete_id)) {
            surveysMap.set(rep.enquete_id, {
              id: rep.enquete_id,
              titre: rep.titre
            });
          }
        });
        this.surveysList = Array.from(surveysMap.values());
      },
      error: (err: any) => console.error('Erreur chargement questionnaires', err)
    });
  }

  applyFilters(): void {
    let filtered = [...this.listeReponsesGlobal];
    
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(rep => 
        (rep.prenom?.toLowerCase().includes(term) || false) ||
        (rep.nom?.toLowerCase().includes(term) || false) ||
        (rep.email?.toLowerCase().includes(term) || false)
      );
    }
    
    if (this.dateDebut) {
      const debut = new Date(this.dateDebut);
      debut.setHours(0, 0, 0, 0);
      filtered = filtered.filter(rep => {
        const repDate = new Date(rep.date_creation);
        return repDate >= debut;
      });
    }
    if (this.dateFin) {
      const fin = new Date(this.dateFin);
      fin.setHours(23, 59, 59, 999);
      filtered = filtered.filter(rep => {
        const repDate = new Date(rep.date_creation);
        return repDate <= fin;
      });
    }
    
    if (this.surveyFilter) {
      filtered = filtered.filter(rep => rep.enquete_id === +this.surveyFilter);
    }
    
    if (this.filterType === 'recent') {
      filtered = filtered.filter(rep => {
        const date = new Date(rep.date_creation);
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      });
    } else if (this.filterType === 'oldest') {
      filtered = filtered.filter(rep => {
        const date = new Date(rep.date_creation);
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 30;
      });
    }
    
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

  openModal(idReponse: number): void {
    this.service.getDetaillesReponseByid(idReponse).subscribe({
      next: (res: any) => {
        this.selectedReponse = res.data || res;
        if (Array.isArray(this.selectedReponse) && this.selectedReponse.length > 0) {
          this.selectedReponse = this.selectedReponse[0];
        }
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

  toggleExportDropdown(): void {
    this.exportDropdownVisible = !this.exportDropdownVisible;
  }

  closeExportDropdown(): void {
    this.exportDropdownVisible = false;
  }

  downloadCSV(): void {
    this.showToast('Export CSV en cours...', 'info', 'fas fa-spinner fa-spin');
    this.service.exportReponsesCsv(this.userId).subscribe({
      next: (data: Blob) => {
        this.downloadBlob(data, `reponses_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
        this.showToast('Export CSV réussi', 'success', 'fas fa-file-csv');
        this.closeExportDropdown();
      },
      error: () => this.showToast('Erreur lors de l\'export CSV', 'error', 'fas fa-exclamation-circle')
    });
  }

  telechargementPdf(): void {
    this.showToast('Export PDF en cours...', 'info', 'fas fa-spinner fa-spin');
    this.service.exportAllReponsesPdf(this.userId).subscribe({
      next: (blob: Blob) => {
        this.downloadBlob(blob, `reponses_${new Date().toISOString().split('T')[0]}.pdf`, 'application/pdf');
        this.showToast('Export PDF réussi', 'success', 'fas fa-file-pdf');
        this.closeExportDropdown();
      },
      error: () => this.showToast('Erreur lors de l\'export PDF', 'error', 'fas fa-exclamation-circle')
    });
  }

  downloadExcel(): void {
    this.showToast('Export Excel en cours...', 'info', 'fas fa-spinner fa-spin');
    this.service.exportAllReponsesExcel(this.userId).subscribe({
      next: (data: Blob) => {
        this.downloadBlob(data, `reponses_${new Date().toISOString().split('T')[0]}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        this.showToast('Export Excel réussi', 'success', 'fas fa-file-excel');
        this.closeExportDropdown();
      },
      error: () => this.showToast('Erreur lors de l\'export Excel', 'error', 'fas fa-exclamation-circle')
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
        this.nombreReponses = res.totalReponses || res.nomberReponses || 0;
      },
      error: (err: any) => console.error('Erreur serveur ❌', err)
    });
  }

  copyToClipboard(text: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Email copié dans le presse-papier', 'success', 'fas fa-copy');
    }).catch(() => {
      this.showToast('Erreur lors de la copie', 'error', 'fas fa-exclamation-circle');
    });
  }

  getStars(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  showToast(message: string, type: string, icon: string): void {
    this.toasts.push({ message, type, icon });
    setTimeout(() => {
      this.toasts.shift();
    }, 3000);
  }

  exportSelectedResponse(): void {
    if (this.selectedReponse) {
      this.downloadCSV();
    }
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Méthode pour obtenir l'URL complète de l'image
  getImageUrl(photoProfil: string): string {
    if (!photoProfil) {
      return '';
    }
    // Le chemin contient déjà /uploads/profiles/...
    return `http://localhost:3000${photoProfil}`;
  }

  // Méthode pour gérer les erreurs de chargement d'image
  onImageError(event: any): void {
    console.error('Erreur chargement image:', event.target.src);
    event.target.style.display = 'none';
    const parent = event.target.parentElement;
    if (parent) {
      const icon = document.createElement('i');
      icon.className = 'fas fa-user-circle';
      icon.style.fontSize = '40px';
      icon.style.color = '#9D50BB';
      parent.appendChild(icon);
    }
  }
}