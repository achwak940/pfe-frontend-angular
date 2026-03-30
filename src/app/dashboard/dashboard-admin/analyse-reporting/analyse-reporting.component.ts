import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ReponsesService } from '../reponses.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analyse-reporting',
  templateUrl: './analyse-reporting.component.html',
  styleUrls: ['./analyse-reporting.component.css']
})
export class AnalyseReportingComponent implements OnInit, OnDestroy, AfterViewInit {
  
  // ==================== DONNÉES PRINCIPALES ====================
  reponsesData: any = { data: [] };
  statsEnquetes: any[] = [];
  topUtilisateurs: any[] = [];
  tauxCompletion: any = { taux: 0, repondants: 0, total: 0 };
  participationPeriode: any[] = [];
  detailsEnquete: any = null;
  evolutionData: any = { labels: [], valeurs: [] };
  
  // ==================== MODAL ====================
  selectedEnquete: any = null;
  showDetailsModal: boolean = false;
  isLoadingDetails: boolean = false;
  
  // ==================== FILTRES ====================
  searchTerm: string = '';
  selectedStatut: string = 'Tous';
  dateDebut: string = '';
  dateFin: string = '';
  periode: string = 'semaine';
  typeParticipationFilter: string = 'TOUS';
  triColonne: string = 'titre';
  triOrdre: 'asc' | 'desc' = 'asc';
  
  // ==================== ÉTATS UI ====================
  isLoading: boolean = false;
  loadingStats: boolean = false;
  loadingTopUsers: boolean = false;
  loadingTaux: boolean = false;
  loadingParticipation: boolean = false;
  exportDropdownVisible: boolean = false;
  autoRefresh: boolean = false;
  showFiltresAvances: boolean = false;
  
  // ==================== UTILISATEUR ====================
  currentUser: any;
  currentUserId: number = 0;
  
  // ==================== PAGINATION ====================
  currentPage: number = 1;
  itemsPerPage: number = 10;
  itemsPerPageOptions: number[] = [5, 10, 20, 50];
  
  // ==================== GRAPHIQUES ====================
  @ViewChild('participationChart') participationChartRef!: ElementRef;
  @ViewChild('evolutionChart') evolutionChartRef!: ElementRef;
  private participationChart: Chart | null = null;
  private evolutionChart: Chart | null = null;
  
  // ==================== STATISTIQUES ====================
  statsGlobales: any = {
    totalEnquetes: 0,
    totalReponses: 0,
    tauxMoyenCompletion: 0,
    enquetesPubliees: 0,
    enquetesBrouillon: 0,
    enquetesFermees: 0,
    participantsUniques: 0,
    evolutionMensuelle: []
  };
  
  // ==================== STATISTIQUES AVANCÉES ====================
  statistiquesAvancees: any = {
    meilleurTaux: 0,
    meilleureEnquete: null,
    pireTaux: 100,
    pireEnquete: null,
    moyenneReponsesParEnquete: 0,
    enquetePlusPopulaire: null,
    totalParticipants: 0
  };
  
  // ==================== TOAST ====================
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: string = 'success';
  
  private refreshInterval: any;

  constructor(private reponsesService: ReponsesService) {}

  ngOnInit(): void {
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
      this.currentUserId = this.currentUser.id;
      this.loadAllData();
      this.startAutoRefresh();
    } else {
      this.showToastMessage('Veuillez vous connecter', 'error');
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.participationPeriode.length > 0) {
        this.updateParticipationChart();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.participationChart) {
      this.participationChart.destroy();
    }
    if (this.evolutionChart) {
      this.evolutionChart.destroy();
    }
  }

  startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      if (this.autoRefresh) {
        this.refreshData();
      }
    }, 30000);
  }

  // ==================== CHARGEMENT DES DONNÉES ====================
  loadAllData(): void {
    this.loadReponses();
    this.loadStatsEnquetes();
    this.loadTopUtilisateurs();
    this.loadTauxCompletion();
    this.loadParticipationParPeriode();
    this.calculerStatistiquesAvancees();
  }

  loadReponses(): void {
    this.isLoading = true;
    this.reponsesService.getAllReponsesByAdmin(this.currentUserId).subscribe({
      next: (data: any) => {
        this.reponsesData = data;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur chargement réponses:', error);
        this.isLoading = false;
        this.showToastMessage('Erreur chargement réponses', 'error');
      }
    });
  }

  loadStatsEnquetes(): void {
    this.loadingStats = true;
    this.reponsesService.getStatsParEnquete(this.currentUserId).subscribe({
      next: (data: any) => {
        this.statsEnquetes = data || [];
        this.calculerStatsGlobales();
        this.calculerStatistiquesAvancees();
        this.loadingStats = false;
      },
      error: (error: any) => {
        console.error('Erreur chargement stats:', error);
        this.loadingStats = false;
        this.showToastMessage('Erreur chargement statistiques', 'error');
      }
    });
  }

  loadTopUtilisateurs(): void {
    this.loadingTopUsers = true;
    this.reponsesService.getTopUtilisateurs(this.currentUserId).subscribe({
      next: (data: any) => {
        this.topUtilisateurs = data || [];
        this.loadingTopUsers = false;
      },
      error: (error: any) => {
        console.error('Erreur top utilisateurs:', error);
        this.loadingTopUsers = false;
      }
    });
  }

  loadTauxCompletion(): void {
    this.loadingTaux = true;
    this.reponsesService.getTauxCompletionGlobal(this.currentUserId).subscribe({
      next: (data: any) => {
        this.tauxCompletion = data || { taux: 0, repondants: 0, total: 0 };
        this.loadingTaux = false;
      },
      error: (error: any) => {
        console.error('Erreur taux completion:', error);
        this.loadingTaux = false;
      }
    });
  }

  loadParticipationParPeriode(): void {
    this.loadingParticipation = true;
    this.reponsesService.getParticipationParPeriode(this.currentUserId, this.periode).subscribe({
      next: (data: any) => {
        this.participationPeriode = data || [];
        this.loadingParticipation = false;
        setTimeout(() => this.updateParticipationChart(), 100);
      },
      error: (error: any) => {
        console.error('Erreur participation période:', error);
        this.loadingParticipation = false;
      }
    });
  }

  calculerStatsGlobales(): void {
    this.statsGlobales.totalEnquetes = this.statsEnquetes.length;
    this.statsGlobales.totalReponses = this.statsEnquetes.reduce((sum, e) => sum + (e.totalReponses || 0), 0);
    const totalTaux = this.statsEnquetes.reduce((sum, e) => sum + (e.tauxCompletude || 0), 0);
    this.statsGlobales.tauxMoyenCompletion = this.statsEnquetes.length > 0 ? Math.round(totalTaux / this.statsEnquetes.length) : 0;
    this.statsGlobales.enquetesPubliees = this.statsEnquetes.filter(e => e.statut === 'Publiée').length;
    this.statsGlobales.enquetesBrouillon = this.statsEnquetes.filter(e => e.statut === 'Brouillon').length;
    this.statsGlobales.enquetesFermees = this.statsEnquetes.filter(e => e.statut === 'Fermée').length;
  }

  calculerStatistiquesAvancees(): void {
    if (this.statsEnquetes.length === 0) return;
    
    // Meilleur et pire taux
    let meilleurTaux = 0;
    let meilleureEnquete = null;
    let pireTaux = 100;
    let pireEnquete = null;
    let enquetePlusPopulaire = null;
    let maxReponses = 0;
    
    for (const enquete of this.statsEnquetes) {
      if (enquete.tauxCompletude > meilleurTaux) {
        meilleurTaux = enquete.tauxCompletude;
        meilleureEnquete = enquete;
      }
      if (enquete.tauxCompletude < pireTaux) {
        pireTaux = enquete.tauxCompletude;
        pireEnquete = enquete;
      }
      if (enquete.totalReponses > maxReponses) {
        maxReponses = enquete.totalReponses;
        enquetePlusPopulaire = enquete;
      }
    }
    
    this.statistiquesAvancees = {
      meilleurTaux,
      meilleureEnquete,
      pireTaux,
      pireEnquete,
      moyenneReponsesParEnquete: Math.round(this.statsGlobales.totalReponses / this.statsEnquetes.length),
      enquetePlusPopulaire,
      totalParticipants: this.topUtilisateurs.reduce((sum, u) => sum + (u.nombre_reponses || 0), 0)
    };
  }

  // ==================== GRAPHIQUES ====================
  updateParticipationChart(): void {
    if (!this.participationChartRef?.nativeElement || this.participationPeriode.length === 0) return;
    
    if (this.participationChart) {
      this.participationChart.destroy();
    }
    
    const labels = this.participationPeriode.map(item => {
      if (this.periode === 'semaine') {
        const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        return jours[item.periode] || item.periode;
      }
      return `Jour ${item.periode}`;
    });
    
    const data = this.participationPeriode.map(item => item.nombre);
    
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Participations',
          data: data,
          borderColor: '#9D50BB',
          backgroundColor: 'rgba(157, 80, 187, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#9D50BB',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#9D50BB'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { size: 12 } } },
          tooltip: { 
            callbacks: { 
              label: (ctx) => `${ctx.raw} participations`,
              title: (ctx) => `${ctx[0].label}`
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            title: { display: true, text: 'Nombre de participations', font: { weight: 'bold' } },
            grid: { color: '#eef2f6' }
          },
          x: { 
            title: { display: true, text: this.periode === 'semaine' ? 'Jour de la semaine' : 'Jour du mois', font: { weight: 'bold' } },
            grid: { display: false }
          }
        }
      }
    };
    
    this.participationChart = new Chart(this.participationChartRef.nativeElement, config);
  }

  // ==================== FILTRAGE ET TRI ====================
  getFilteredEnquetes(): any[] {
    let filtered = [...this.statsEnquetes];
    
    // Filtre recherche
    if (this.searchTerm) {
      filtered = filtered.filter(e => 
        e.titre?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        e.description?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    
    // Filtre statut
    if (this.selectedStatut !== 'Tous') {
      filtered = filtered.filter(e => e.statut === this.selectedStatut);
    }
    
    // Filtre type participation
    if (this.typeParticipationFilter !== 'TOUS') {
      filtered = filtered.filter(e => e.typeParticipation === this.typeParticipationFilter);
    }
    
    // Filtre dates
    if (this.dateDebut) {
      filtered = filtered.filter(e => !e.dateFin || new Date(e.dateFin) >= new Date(this.dateDebut));
    }
    if (this.dateFin) {
      filtered = filtered.filter(e => !e.dateFin || new Date(e.dateFin) <= new Date(this.dateFin));
    }
    
    // Tri
    filtered.sort((a, b) => {
      let valA = a[this.triColonne];
      let valB = b[this.triColonne];
      
      if (this.triColonne === 'titre') {
        valA = valA?.toLowerCase() || '';
        valB = valB?.toLowerCase() || '';
      }
      
      if (this.triOrdre === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
    
    return filtered;
  }

  getPaginatedEnquetes(): any[] {
    const filtered = this.getFilteredEnquetes();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  }

  getTotalPages(): number {
    return Math.ceil(this.getFilteredEnquetes().length / this.itemsPerPage) || 1;
  }

  getPagesArray(): number[] {
    const total = this.getTotalPages();
    const pages: number[] = [];
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(total, start + 4);
    if (end - start + 1 < 5) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  changeItemsPerPage(limit: number): void {
    this.itemsPerPage = limit;
    this.currentPage = 1;
    this.showToastMessage(`${limit} éléments par page`, 'info');
  }

  trierPar(colonne: string): void {
    if (this.triColonne === colonne) {
      this.triOrdre = this.triOrdre === 'asc' ? 'desc' : 'asc';
    } else {
      this.triColonne = colonne;
      this.triOrdre = 'asc';
    }
    this.showToastMessage(`Tri par ${colonne} (${this.triOrdre === 'asc' ? 'croissant' : 'décroissant'})`, 'info');
  }

  // ==================== ACTIONS ====================
  viewDetails(enqueteId: number): void {
    const enquete = this.statsEnquetes.find(e => e.id === enqueteId);
    if (enquete) {
      this.selectedEnquete = enquete;
      this.showDetailsModal = true;
      this.loadEnqueteDetails(enqueteId);
    }
  }

  loadEnqueteDetails(enqueteId: number): void {
    this.isLoadingDetails = true;
    this.reponsesService.getDetaillesReponseByid(enqueteId).subscribe({
      next: (data: any) => { 
        this.detailsEnquete = data.data || data;
        this.isLoadingDetails = false;
      },
      error: (error: any) => { 
        console.error('Erreur détails:', error);
        this.isLoadingDetails = false;
        this.showToastMessage('Erreur chargement détails', 'error');
      }
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedEnquete = null;
    this.detailsEnquete = null;
  }

  exportEnquete(enqueteId: number, format: string): void {
    this.showToastMessage(`Export ${format.toUpperCase()} en cours...`, 'info');
    
    if (format === 'excel') {
      this.reponsesService.exportAllReponsesExcel(this.currentUserId).subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(blob, `enquete_${enqueteId}.xlsx`);
          this.showToastMessage('Export Excel réussi', 'success');
        },
        error: () => this.showToastMessage('Erreur export Excel', 'error')
      });
    } else if (format === 'pdf') {
      this.reponsesService.exportAllReponsesPdf(this.currentUserId).subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(blob, `enquete_${enqueteId}.pdf`);
          this.showToastMessage('Export PDF réussi', 'success');
        },
        error: () => this.showToastMessage('Erreur export PDF', 'error')
      });
    } else if (format === 'csv') {
      this.reponsesService.exportReponsesCsv(this.currentUserId).subscribe({
        next: (blob: Blob) => {
          this.downloadBlob(blob, `enquete_${enqueteId}.csv`);
          this.showToastMessage('Export CSV réussi', 'success');
        },
        error: () => this.showToastMessage('Erreur export CSV', 'error')
      });
    }
  }

  showChart(enqueteId: number): void {
    this.viewDetails(enqueteId);
  }

  // ==================== EXPORTS GLOBAUX ====================
  exportExcel(): void {
    this.showToastMessage('Export Excel en cours...', 'info');
    this.reponsesService.exportAllReponsesExcel(this.currentUserId).subscribe({
      next: (blob: Blob) => { 
        this.downloadBlob(blob, `rapport_analyse_${new Date().toISOString().split('T')[0]}.xlsx`); 
        this.showToastMessage('Export Excel réussi', 'success'); 
      },
      error: () => this.showToastMessage('Erreur export Excel', 'error')
    });
  }

  exportPDF(): void {
    this.showToastMessage('Export PDF en cours...', 'info');
    this.reponsesService.exportAllReponsesPdf(this.currentUserId).subscribe({
      next: (blob: Blob) => { 
        this.downloadBlob(blob, `rapport_analyse_${new Date().toISOString().split('T')[0]}.pdf`); 
        this.showToastMessage('Export PDF réussi', 'success'); 
      },
      error: () => this.showToastMessage('Erreur export PDF', 'error')
    });
  }

  exportCSV(): void {
    this.showToastMessage('Export CSV en cours...', 'info');
    this.reponsesService.exportReponsesCsv(this.currentUserId).subscribe({
      next: (blob: Blob) => { 
        this.downloadBlob(blob, `rapport_analyse_${new Date().toISOString().split('T')[0]}.csv`); 
        this.showToastMessage('Export CSV réussi', 'success'); 
      },
      error: () => this.showToastMessage('Erreur export CSV', 'error')
    });
  }

  exportAll(): void {
    this.showToastMessage('Export de tous les formats en cours...', 'info');
    this.exportExcel();
    setTimeout(() => this.exportPDF(), 1000);
    setTimeout(() => this.exportCSV(), 2000);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  toggleExportDropdown(): void {
    this.exportDropdownVisible = !this.exportDropdownVisible;
    setTimeout(() => {
      if (this.exportDropdownVisible) {
        document.addEventListener('click', this.closeExportDropdown);
      } else {
        document.removeEventListener('click', this.closeExportDropdown);
      }
    }, 100);
  }

  closeExportDropdown = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (!target.closest('.export-dropdown')) {
      this.exportDropdownVisible = false;
      document.removeEventListener('click', this.closeExportDropdown);
    }
  };

  // ==================== UTILITAIRES ====================
  getTauxColor(taux: number): string {
    if (taux >= 75) return 'success';
    if (taux >= 50) return 'warning';
    return 'danger';
  }

  getStatutBadge(statut: string): string {
    const map: any = { 'Publiée': 'published', 'Brouillon': 'draft', 'Fermée': 'closed' };
    return map[statut] || 'published';
  }

  getStatutIcon(statut: string): string {
    switch(statut) {
      case 'Publiée': return 'fas fa-check-circle';
      case 'Brouillon': return 'fas fa-pencil-alt';
      case 'Fermée': return 'fas fa-lock';
      default: return 'fas fa-circle';
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

  formatDateTime(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR');
  }

  getTendanceIcon(): string {
    if (this.participationPeriode.length < 2) return 'fas fa-minus-circle';
    const dernier = this.participationPeriode[this.participationPeriode.length - 1]?.nombre || 0;
    const avantDernier = this.participationPeriode[this.participationPeriode.length - 2]?.nombre || 0;
    if (dernier > avantDernier) return 'fas fa-arrow-up';
    if (dernier < avantDernier) return 'fas fa-arrow-down';
    return 'fas fa-minus';
  }

  getTendanceClasse(): string {
    if (this.participationPeriode.length < 2) return 'stable';
    const dernier = this.participationPeriode[this.participationPeriode.length - 1]?.nombre || 0;
    const avantDernier = this.participationPeriode[this.participationPeriode.length - 2]?.nombre || 0;
    if (dernier > avantDernier) return 'up';
    if (dernier < avantDernier) return 'down';
    return 'stable';
  }

  getTendanceValeur(): number {
    if (this.participationPeriode.length < 2) return 0;
    const dernier = this.participationPeriode[this.participationPeriode.length - 1]?.nombre || 0;
    const avantDernier = this.participationPeriode[this.participationPeriode.length - 2]?.nombre || 0;
    return Math.abs(dernier - avantDernier);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatut = 'Tous';
    this.typeParticipationFilter = 'TOUS';
    this.dateDebut = '';
    this.dateFin = '';
    this.currentPage = 1;
    this.triColonne = 'titre';
    this.triOrdre = 'asc';
    this.showToastMessage('Filtres réinitialisés', 'success');
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.showToastMessage('Filtres appliqués', 'success');
  }

  changePeriode(periode: string): void {
    this.periode = periode;
    this.loadParticipationParPeriode();
  }

  refreshData(): void {
    this.showToastMessage('Actualisation des données...', 'info');
    this.loadAllData();
    setTimeout(() => {
      this.showToastMessage('Données actualisées', 'success');
    }, 1000);
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    this.showToastMessage(`Actualisation automatique ${this.autoRefresh ? 'activée' : 'désactivée'}`, 'info');
  }

  toggleFiltresAvances(): void {
    this.showFiltresAvances = !this.showFiltresAvances;
  }

  showToastMessage(message: string, type: string): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  // ==================== STATISTIQUES AVANCÉES ====================
  getPourcentageCompletude(): number {
    if (!this.tauxCompletion.total) return 0;
    return Math.round((this.tauxCompletion.repondants / this.tauxCompletion.total) * 100);
  }

  getMeilleureEnquete(): any {
    return this.statistiquesAvancees.meilleureEnquete;
  }

  getPireEnquete(): any {
    return this.statistiquesAvancees.pireEnquete;
  }

  getEnquetePlusPopulaire(): any {
    return this.statistiquesAvancees.enquetePlusPopulaire;
  }
}