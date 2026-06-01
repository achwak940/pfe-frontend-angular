import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { EnqueteService } from '../enquete.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gestion-enquetes',
  templateUrl: './gestion-enquetes.component.html',
  styleUrls: ['./gestion-enquetes.component.css']
})
export class GestionEnquetesComponent implements OnInit, OnDestroy {
  currentUser!: any;
  userID!: number;
  enquetes: any[] = [];
  filteredEnquetes: any[] = [];
  stats = {
    fermes: 0,
    publiees: 0,
    brouillons: 0,
    archivees: 0
  };

  searchText: string = '';
  selectedFilter: string = 'Toutes';
  selectedTypeParticipation: string = 'TOUS';
  dateDebut: string = '';
  dateFin: string = '';

  globalStats: any = {
    totalReponses: 0,
    tauxReponseGlobal: 0,
    reponsesParJour: [],
    participationParType: {
      anonyme: 0,
      connecte: 0,
      total: 0,
      anonymePercentage: 0,
      connectePercentage: 0
    },
    reponsesParType: {
      anonyme: 0,
      connecte: 0,
      total: 0
    },
    evolutionParMois: []
  };

  loadingStats: boolean = false;
  showToast = false;
  toastMessage = '';
  toastType = 'success';

  private subscriptions: Subscription[] = [];

  constructor(private service: EnqueteService, private router: Router) { }

  ngOnInit(): void {
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
      this.userID = this.currentUser.id;
    }
    this.loadEnquetes();
    this.loadGlobalStats();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadEnquetes(): void {
    this.service.getAllEnquete(this.userID).subscribe(
      (res: any[]) => {
        this.enquetes = res;
        this.updateStats();
        this.applyFilters();
      },
      (err) => {
        console.error("Erreur de récupération des enquêtes", err);
        this.showToastMessage('Erreur de chargement des enquêtes', 'error');
      }
    );
  }

  async loadGlobalStats(): Promise<void> {
    this.loadingStats = true;
    
    try {
      const [taux, participants, evolution, participationType] = await Promise.all([
        this.service.getTauxReponseAdmin(this.userID).toPromise(),
        this.service.getNombreParticipants(this.userID).toPromise(),
        this.service.getEvolutionReponsesAdmin(this.userID).toPromise(),
        this.service.getParticipationTypeStats(this.userID).toPromise()
      ]);

      this.globalStats.tauxReponseGlobal = taux?.taux_reponse || 0;
      this.globalStats.totalReponses = participants?.totalusers || 0;
      this.globalStats.reponsesParJour = evolution || [];
      
      if (participationType) {
        this.globalStats.participationParType = {
          anonyme: participationType.enquetes?.anonyme || 0,
          connecte: participationType.enquetes?.connecte || 0,
          total: participationType.enquetes?.total || 0,
          anonymePercentage: participationType.enquetes?.anonymePercentage || 0,
          connectePercentage: participationType.enquetes?.connectePercentage || 0
        };
        this.globalStats.reponsesParType = {
          anonyme: participationType.reponses?.anonyme || 0,
          connecte: participationType.reponses?.connecte || 0,
          total: participationType.reponses?.total || 0
        };
      } else {
        this.calculateLocalParticipationStats();
      }

      this.prepareEvolutionData();
    } catch (err) {
      console.error('Erreur chargement stats globales', err);
      this.showToastMessage('Erreur de chargement des statistiques', 'error');
      this.calculateLocalParticipationStats();
    } finally {
      this.loadingStats = false;
    }
  }

  private calculateLocalParticipationStats(): void {
    const total = this.enquetes.length;
    const anonymeCount = this.enquetes.filter(e => e.typeParticipation === 'ANONYME').length;
    const connecteCount = this.enquetes.filter(e => e.typeParticipation === 'CONNECTE' || !e.typeParticipation).length;
    this.globalStats.participationParType = {
      anonyme: anonymeCount,
      connecte: connecteCount,
      total: total,
      anonymePercentage: total ? (anonymeCount / total) * 100 : 0,
      connectePercentage: total ? (connecteCount / total) * 100 : 0
    };
  }

  prepareEvolutionData(): void {
    if (this.globalStats.reponsesParJour?.length) {
      this.globalStats.evolutionParMois = this.groupByMonth(this.globalStats.reponsesParJour);
    }
  }

  groupByMonth(data: any[]): any[] {
    const months: { [key: string]: number } = {};
    data.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      months[monthKey] = (months[monthKey] || 0) + item.count;
    });
    return Object.keys(months).map(key => ({
      month: key,
      monthName: this.getMonthName(key),
      count: months[key]
    }));
  }

  getMonthName(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  }

  updateStats(): void {
    this.stats.fermes = this.enquetes.filter(e => e.statut === 'Fermee').length;
    this.stats.publiees = this.enquetes.filter(e => e.statut === 'Publiée').length;
    this.stats.brouillons = this.enquetes.filter(e => e.statut === 'Brouillon').length;
    this.stats.archivees = this.enquetes.filter(e => e.statut === 'Archivée').length;
  }

  applyFilters(): void {
    let filtered = [...this.enquetes];

    if (this.selectedFilter !== 'Toutes') {
      const filterMap: Record<string, string> = {
        'Fermee': 'fermee',
        'Publiée': 'publiée',
        'Brouillon': 'brouillon',
        'Archivée': 'archivée'
      };
      const target = filterMap[this.selectedFilter];
      if (target) {
        filtered = filtered.filter(e => e.statut?.toLowerCase() === target);
      }
    }

    if (this.selectedTypeParticipation !== 'TOUS') {
      filtered = filtered.filter(e => e.typeParticipation?.toUpperCase() === this.selectedTypeParticipation);
    }

    if (this.searchText.trim()) {
      const text = this.searchText.toLowerCase();
      filtered = filtered.filter(e =>
        e.titre?.toLowerCase().includes(text) ||
        e.description?.toLowerCase().includes(text) ||
        e.id?.toString().includes(text)
      );
    }

    if (this.dateDebut || this.dateFin) {
      filtered = filtered.filter(e => {
        if (!e.createAt) return true;
        const creation = new Date(e.createAt);
        creation.setHours(0, 0, 0, 0);
        if (this.dateDebut) {
          const debut = new Date(this.dateDebut);
          debut.setHours(0, 0, 0, 0);
          if (creation < debut) return false;
        }
        if (this.dateFin) {
          const fin = new Date(this.dateFin);
          fin.setHours(23, 59, 59, 999);
          if (creation > fin) return false;
        }
        return true;
      });
    }

    this.filteredEnquetes = filtered;
  }

  onStatutFilterChange(statut: string): void {
    this.selectedFilter = statut;
    this.applyFilters();
  }

  onTypeParticipationChange(type: string): void {
    this.selectedTypeParticipation = type;
    this.applyFilters();
  }

  isFilterActive(): boolean {
    return !!this.searchText.trim() ||
           this.selectedFilter !== 'Toutes' ||
           this.selectedTypeParticipation !== 'TOUS' ||
           !!this.dateDebut ||
           !!this.dateFin;
  }

  clearAllFilters(): void {
    this.searchText = '';
    this.selectedFilter = 'Toutes';
    this.selectedTypeParticipation = 'TOUS';
    this.dateDebut = '';
    this.dateFin = '';
    this.applyFilters();
    this.showToastMessage('Filtres réinitialisés', 'success');
  }

  clearSearch(): void {
    this.searchText = '';
    this.applyFilters();
  }

  applyDateFilter(): void {
    this.applyFilters();
  }

  clearDateFilter(): void {
    this.dateDebut = '';
    this.dateFin = '';
    this.applyFilters();
  }

  onSearchInput(): void {
    this.applyFilters();
  }

  deleteEnquete(id: any): void {
    Swal.fire({
      title: 'Confirmation de suppression',
      text: 'Voulez-vous vraiment supprimer cette enquête ? Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      customClass: {
        popup: 'swal-delete-popup',
        confirmButton: 'swal-delete-confirm'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.removeEnquete(id).subscribe(
          () => {
            this.enquetes = this.enquetes.filter(e => e.id !== id);
            this.updateStats();
            this.applyFilters();
            this.loadGlobalStats();
            this.showToastMessage('Enquête supprimée avec succès', 'success');
          },
          (err) => {
            console.error('Erreur lors de la suppression', err);
            this.showToastMessage('Erreur lors de la suppression', 'error');
          }
        );
      }
    });
  }

  publishEnquete(enquete: any): void {
    Swal.fire({
      title: 'Publier l\'enquête',
      text: `Voulez-vous publier l'enquête "${enquete.titre}" ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#9D50BB',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Oui, publier',
      cancelButtonText: 'Annuler',
      customClass: {
        popup: 'swal-publish-popup',
        confirmButton: 'swal-publish-confirm'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.publishEnquete(enquete.id).subscribe(
          () => {
            enquete.statut = 'Publiée';
            this.updateStats();
            this.applyFilters();
            this.showToastMessage('Enquête publiée avec succès', 'success');
          },
          (err) => {
            console.error('Erreur lors de la publication', err);
            this.showToastMessage('Erreur lors de la publication', 'error');
          }
        );
      }
    });
  }

  viewStats(enquete: any): void {
    Swal.fire({
      title: 'Chargement...',
      text: 'Récupération des statistiques...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      customClass: { popup: 'swal-stats-loading' }
    });

    this.service.getEnqueteStats(enquete.id).subscribe({
      next: (stats: any) => {
        const totalParticipants = stats.totalReponses || 0;
        const tauxReponse = stats.tauxReponse || 0;
        let tempsMoyen = stats.tempsMoyenReponse || 0;
        if (tempsMoyen > 1440) tempsMoyen = 0;
        const questionsStats = stats.questionsStats || [];

        let titreEnquete = this.escapeHtml(enquete.titre);
        if (titreEnquete.length > 60) titreEnquete = titreEnquete.substring(0, 57) + '…';

        let contenuHtml = '';

        if (totalParticipants === 0) {
          contenuHtml = `
            <div class="stats-empty-state">
              <i class="fas fa-envelope-open-text" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
              <p>Aucune participation enregistrée pour cette enquête.</p>
           
            </div>
          `;
        } else {
          contenuHtml = `
            <div class="stats-metrics">
              <div class="stats-metric">
                <div class="stats-metric-icon"><i class="fas fa-user-group"></i></div>
                <div class="stats-metric-value">${totalParticipants}</div>
                <div class="stats-metric-label">Participants</div>
              </div>
              <div class="stats-metric">
                <div class="stats-metric-icon"><i class="fas fa-chart-simple"></i></div>
                <div class="stats-metric-value">${tauxReponse}%</div>
                <div class="stats-metric-label">Taux de réponse</div>
              </div>
              <div class="stats-metric">
                <div class="stats-metric-icon"><i class="fas fa-hourglass-half"></i></div>
                <div class="stats-metric-value">${tempsMoyen}</div>
                <div class="stats-metric-label">min en moyenne</div>
              </div>
            </div>
          `;

          if (questionsStats.length > 0) {
            let questionsHtml = '<div class="stats-questions-header"><i class="fas fa-list-check"></i> <strong>Détail par question</strong></div>';
            questionsStats.forEach((q: any) => {
              const reponsesCount = q.reponsesCount || 0;
              const pourcentage = totalParticipants > 0 ? (reponsesCount / totalParticipants) * 100 : 0;
              let questionTexte = this.escapeHtml(q.questionText);
              if (questionTexte.length > 80) questionTexte = questionTexte.substring(0, 77) + '…';
              questionsHtml += `
                <div class="stats-question-item">
                  <div class="stats-question-text">
                    <span title="${this.escapeHtml(q.questionText)}">${questionTexte}</span>
                    <span class="stats-question-count">${reponsesCount} réponse(s)</span>
                  </div>
                  <div class="stats-progress-bar">
                    <div class="stats-progress-fill" style="width: ${pourcentage}%;"></div>
                  </div>
                </div>
              `;
            });
            contenuHtml += questionsHtml;
          } else {
            contenuHtml += '<div class="stats-empty"><i class="fas fa-chart-pie"></i> Aucune réponse détaillée</div>';
          }
        }

        Swal.fire({
          title: `📊 ${titreEnquete}`,
          html: `<div class="stats-global-container">${contenuHtml}</div>`,
          icon: totalParticipants === 0 ? 'info' : 'success',
          confirmButtonText: 'Fermer',
          confirmButtonColor: '#9D50BB',
          width: '700px',
          customClass: {
            popup: 'swal-stats-popup',
            title: 'swal-stats-title',
            htmlContainer: 'swal-stats-html',
            confirmButton: 'swal-stats-confirm'
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement stats enquête', err);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de charger les statistiques.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  showToastMessage(message: string, type: string): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  calculateTotalResponses(): number {
    return this.globalStats.totalReponses;
  }

  calculateResponseRate(): number {
    return this.globalStats.tauxReponseGlobal;
  }

  getAnonymePercentage(): number {
    return Math.round(this.globalStats.participationParType?.anonymePercentage || 0);
  }

  getConnectePercentage(): number {
    return Math.round(this.globalStats.participationParType?.connectePercentage || 0);
  }

  getAnonymeDashArray(): string {
    const circumference = 2 * Math.PI * 40;
    const percent = this.getAnonymePercentage();
    return `${(percent / 100) * circumference} ${circumference}`;
  }

  getConnecteDashArray(): string {
    const circumference = 2 * Math.PI * 40;
    const percent = this.getConnectePercentage();
    return `${(percent / 100) * circumference} ${circumference}`;
  }

  getConnecteDashOffset(): string {
    const circumference = 2 * Math.PI * 40;
    const anonymePercent = this.getAnonymePercentage();
    return `${- (anonymePercent / 100) * circumference}`;
  }

  getMaxReponses(): number {
    if (!this.globalStats.evolutionParMois?.length) return 100;
    return Math.max(...this.globalStats.evolutionParMois.map((item: any) => item.count), 100);
  }

  getReponsesAnonyme(): number {
    return this.globalStats.reponsesParType?.anonyme || 0;
  }

  getReponsesConnecte(): number {
    return this.globalStats.reponsesParType?.connecte || 0;
  }

  getProgressDashArray(nombreQuestions: number): string {
    if (!nombreQuestions) return '0, 100';
    const circumference = 2 * Math.PI * 20;
    const progress = (nombreQuestions / 100) * circumference;
    return `${progress} ${circumference}`;
  }

  showGlobalStatsInSwal(): void {
    const totalReponses = this.calculateTotalResponses();
    const tauxReponse = this.calculateResponseRate();
    const reponsesAnonyme = this.getReponsesAnonyme();
    const reponsesConnecte = this.getReponsesConnecte();
    const totalEnquetes = this.enquetes.length;
    const enquetesAnonyme = this.globalStats.participationParType?.anonyme || 0;
    const enquetesConnecte = this.globalStats.participationParType?.connecte || 0;
    const pourcentAnonyme = this.getAnonymePercentage();
    const pourcentConnecte = this.getConnectePercentage();

    // CSS inline forcé pour aligner tout à gauche
    const forcedStyles = `
      <style>
        .global-stats-container {
          text-align: left !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 1rem !important;
        }
        .global-stats-section {
          background: #f8f9fe !important;
          border-radius: 16px !important;
          padding: 0.8rem 1.2rem !important;
          border-left: 4px solid #9D50BB !important;
          text-align: left !important;
        }
        .stats-header-icon {
          font-weight: 700 !important;
          margin-bottom: 0.5rem !important;
          color: #9D50BB !important;
          font-size: 0.9rem !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.4rem !important;
          text-align: left !important;
          justify-content: flex-start !important;
          border-bottom: 1px solid rgba(157, 80, 187, 0.2) !important;
          padding-bottom: 0.5rem !important;
        }
        .stats-row {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          padding: 0.5rem 0 !important;
          border-bottom: 1px dashed #eef2f6 !important;
          text-align: left !important;
          width: 100% !important;
        }
        .stats-row:last-child {
          border-bottom: none !important;
        }
        .stats-label {
          color: #4f5b6f !important;
          font-weight: 500 !important;
          font-size: 0.85rem !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.6rem !important;
          text-align: left !important;
          justify-content: flex-start !important;
          flex: 1 !important;
        }
        .stats-label i {
          width: 20px !important;
          color: #9D50BB !important;
          font-size: 0.9rem !important;
        }
        .stats-value {
          font-weight: 700 !important;
          color: #1a1a2c !important;
          background: white !important;
          padding: 0.2rem 0.8rem !important;
          border-radius: 20px !important;
          text-align: right !important;
          font-size: 0.85rem !important;
          min-width: 70px !important;
        }
      </style>
    `;

    Swal.fire({
      title: '📊 Statistiques globales',
      html: forcedStyles + `
        <div class="global-stats-container">
          <div class="global-stats-section">
            <div class="stats-header-icon"><i class="fas fa-chart-pie"></i> Participation</div>
            <div class="stats-row"><span class="stats-label"><i class="fas fa-chart-line"></i> Taux de réponse</span><span class="stats-value">${tauxReponse}%</span></div>
            <div class="stats-row"><span class="stats-label"><i class="fas fa-reply-all"></i> Réponses totales</span><span class="stats-value">${totalReponses}</span></div>
            <div class="stats-row"><span class="stats-label"><i class="fas fa-user-secret"></i> Réponses anonymes</span><span class="stats-value">${reponsesAnonyme}</span></div>
            <div class="stats-row"><span class="stats-label"><i class="fas fa-user-check"></i> Réponses connectées</span><span class="stats-value">${reponsesConnecte}</span></div>
          </div>
          <div class="global-stats-section">
            <div class="stats-header-icon"><i class="fas fa-tasks"></i> Enquêtes</div>
            <div class="stats-row"><span class="stats-label"><i class="fas fa-clipboard-list"></i> Enquêtes créées</span><span class="stats-value">${totalEnquetes}</span></div>
            <div class="stats-row"><span class="stats-label"><i class="fas fa-user-secret"></i> Anonymes</span><span class="stats-value">${enquetesAnonyme} (${pourcentAnonyme}%)</span></div>
            <div class="stats-row"><span class="stats-label"><i class="fas fa-user-check"></i> Connectées</span><span class="stats-value">${enquetesConnecte} (${pourcentConnecte}%)</span></div>
          </div>
          <div class="global-stats-section">
            <div class="stats-header-icon"><i class="fas fa-tag"></i> Statuts</div>
            <div class="stats-row"><span class="stats-label"><i class="fas fa-pen-fancy"></i> Brouillons</span><span class="stats-value">${this.stats.brouillons}</span></div>
            <div class="stats-row"><span class="stats-label"><i class="fas fa-share-alt"></i> Publiées</span><span class="stats-value">${this.stats.publiees}</span></div>
            <div class="stats-row"><span class="stats-label"><i class="fas fa-lock"></i> Fermées</span><span class="stats-value">${this.stats.fermes}</span></div>
            <div class="stats-row"><span class="stats-label"><i class="fas fa-box-archive"></i> Archivées</span><span class="stats-value">${this.stats.archivees}</span></div>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Fermer',
      confirmButtonColor: '#9D50BB',
      width: '650px',
      customClass: {
        popup: 'swal-global-stats-popup',
        title: 'swal-global-title',
        htmlContainer: 'swal-global-html',
        confirmButton: 'swal-global-confirm'
      }
    });
  }
}