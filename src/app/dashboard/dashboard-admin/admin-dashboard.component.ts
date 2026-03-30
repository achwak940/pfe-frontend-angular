import { Component, HostListener, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { StatistiquesService } from './statistiques.service';
import Chart from 'chart.js/auto';

interface Enquete {
  titre: string;
  participants: number;
  dateFin: string;
  statut: string;
  icon?: string;
}

interface TopEnquete {
  nom: string;
  valeur: string;
}

interface Activity {
  type: string;
  message: string;
  time: string;
  icon: string;
  background: string;
  isNew?: boolean;
}

interface SatisfactionData {
  precedent: number;
  actuel: number;
  avis: number;
}

interface EvolutionData {
  totalReponses: number;
  tauxReponse: number;
}

interface SurveyStatusData {
  actives: number;
  brouillons: number;
  terminees: number;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  sidebarCollapsed = false;
  mobileMenuOpen = false;
  currentPageTitle = 'Dashboard Admin';
  isMobile = false;
  currentUser: any = null;
  userId: number = 0;
  public router: Router;
  currentDate: Date = new Date();
  selectedPeriod: string = 'week';

  // Données du dashboard
  nombreEnquete: number = 0;
  nombreParticicant: number = 0;
  tauxReponse: number = 0;

  satisfactionData: SatisfactionData = {
    precedent: 0,
    actuel: 0,
    avis: 0
  };

  evolutionData: EvolutionData = {
    totalReponses: 0,
    tauxReponse: 0
  };

  surveyStatusData: SurveyStatusData = {
    actives: 0,
    brouillons: 0,
    terminees: 0
  };

  topEnquetes: TopEnquete[] = [];
  weekDays: { name: string, value: number }[] = [];
  participationData: { label: string, value: number, color: string }[] = [];
  recentEnquetes: Enquete[] = [];
  recentActivities: Activity[] = [];

  // Loading states
  isLoading: boolean = true;
  private loadingStates = {
    basic: false,
    evolution: false,
    surveyStatus: false,
    participation: false,
    topEnquetes: false,
    recentEnquetes: false,
    recentActivities: false
  };

  // Chart instances
  private responsesChart: any;
  private surveyStatusChart: any;
  private refreshInterval: any;

  constructor(
    router: Router, 
    private service: StatistiquesService,
    private cdr: ChangeDetectorRef
  ) {
    this.router = router;
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updatePageTitle();
        if (this.isMobile) {
          this.mobileMenuOpen = false;
        }
      });
  }

  ngOnInit(): void {
    this.getUserData();
    this.checkScreenSize();
    
    // Rafraîchir les données toutes les 30 secondes
    this.refreshInterval = setInterval(() => {
      this.refreshAllData();
    }, 30000);

    // Mettre à jour la date toutes les minutes
    setInterval(() => {
      this.currentDate = new Date();
      this.cdr.detectChanges();
    }, 60000);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeCharts();
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.responsesChart) {
      this.responsesChart.destroy();
    }
    if (this.surveyStatusChart) {
      this.surveyStatusChart.destroy();
    }
  }

  // ========== MÉTHODES DE CHARGEMENT DES DONNÉES ==========

  getUserData(): void {
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
      this.userId = this.currentUser.id;
    }
    
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading = true;
    this.loadBasicStats();
    this.loadDataForPeriod(this.selectedPeriod);
  }

  refreshAllData(): void {
    this.loadBasicStats();
    this.loadEvolutionData();
    this.loadSurveyStatus();
    this.loadParticipationData();
    this.loadTopEnquetes();
    this.loadRecentEnquetes();
    this.loadRecentActivities();
  }

  loadBasicStats(): void {
    this.loadingStates.basic = true;
    
    // Charger le nombre d'enquêtes
    this.service.getNombreEnqueteByUser(this.userId).subscribe({
      next: (res: any) => {
        this.nombreEnquete = typeof res === 'number' ? res : (res.count || 0);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur chargement enquêtes:", err);
        this.nombreEnquete = 0;
      }
    });

    // Charger le nombre de participants
    this.service.getNombreParticipantsByUser(this.userId).subscribe({
      next: (res: any) => {
        this.nombreParticicant = res.totalusers || res.total || 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur chargement participants:", err);
        this.nombreParticicant = 0;
      }
    });

    // Charger le taux de réponse
    this.service.getTauxReponseTotal(this.userId).subscribe({
      next: (res: any) => {
        this.tauxReponse = res.taux_reponse || res.taux || 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur chargement taux réponse:", err);
        this.tauxReponse = 0;
      },
      complete: () => {
        this.loadingStates.basic = false;
        this.checkLoadingComplete();
      }
    });
  }

  loadDataForPeriod(period: string): void {
    this.loadEvolutionData();
    this.loadSurveyStatus();
    this.loadParticipationData();
    this.loadTopEnquetes();
    this.loadRecentEnquetes();
    this.loadRecentActivities();
  }

  loadEvolutionData(): void {
    this.loadingStates.evolution = true;
    this.service.getEvolutionReponses(this.userId, this.selectedPeriod).subscribe({
      next: (res: any) => {
        this.evolutionData = {
          totalReponses: res.totalReponses || 0,
          tauxReponse: res.tauxReponse || 0
        };
        this.updateWeekDaysData(res.evolution || []);
        this.updateCharts();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur chargement évolution:", err);
        this.setDefaultEvolutionData();
      },
      complete: () => {
        this.loadingStates.evolution = false;
        this.checkLoadingComplete();
      }
    });
  }

  loadSurveyStatus(): void {
    this.loadingStates.surveyStatus = true;
    this.service.getSurveyStatusStats(this.userId).subscribe({
      next: (res: any) => {
        this.surveyStatusData = {
          actives: res.actives || 0,
          brouillons: res.brouillons || 0,
          terminees: res.terminees || 0
        };
        this.updateSurveyStatusChart();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur chargement statut enquêtes:", err);
        this.setDefaultSurveyStatusData();
      },
      complete: () => {
        this.loadingStates.surveyStatus = false;
        this.checkLoadingComplete();
      }
    });
  }

  loadParticipationData(): void {
    this.loadingStates.participation = true;
    this.service.getParticipationParEnquete(this.userId).subscribe({
      next: (res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          this.participationData = res;
        } else {
          this.setDefaultParticipationData();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur chargement participation:", err);
        this.setDefaultParticipationData();
      },
      complete: () => {
        this.loadingStates.participation = false;
        this.checkLoadingComplete();
      }
    });
  }

  loadTopEnquetes(): void {
    this.loadingStates.topEnquetes = true;
    this.service.getTopEnquetes(this.userId, this.selectedPeriod, 5).subscribe({
      next: (res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          this.topEnquetes = res;
        } else {
          this.setDefaultTopEnquetes();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur chargement top enquêtes:", err);
        this.setDefaultTopEnquetes();
      },
      complete: () => {
        this.loadingStates.topEnquetes = false;
        this.checkLoadingComplete();
      }
    });
  }

  loadRecentEnquetes(): void {
    this.loadingStates.recentEnquetes = true;
    this.service.getRecentEnquetes(this.userId, 3).subscribe({
      next: (res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          this.recentEnquetes = res;
        } else {
          this.setDefaultRecentEnquetes();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur chargement enquêtes récentes:", err);
        this.setDefaultRecentEnquetes();
      },
      complete: () => {
        this.loadingStates.recentEnquetes = false;
        this.checkLoadingComplete();
      }
    });
  }

  loadRecentActivities(): void {
    this.loadingStates.recentActivities = true;
    this.service.getRecentActivities(this.userId, 5).subscribe({
      next: (res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          this.recentActivities = res;
        } else {
          this.setDefaultRecentActivities();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur chargement activités récentes:", err);
        this.setDefaultRecentActivities();
      },
      complete: () => {
        this.loadingStates.recentActivities = false;
        this.checkLoadingComplete();
      }
    });
  }

  checkLoadingComplete(): void {
    const allLoaded = !this.loadingStates.basic && 
                      !this.loadingStates.evolution && 
                      !this.loadingStates.surveyStatus &&
                      !this.loadingStates.participation &&
                      !this.loadingStates.topEnquetes &&
                      !this.loadingStates.recentEnquetes &&
                      !this.loadingStates.recentActivities;
    
    if (allLoaded) {
      this.isLoading = false;
    }
  }

  // ========== MÉTHODES DE DONNÉES PAR DÉFAUT ==========

  setDefaultEvolutionData(): void {
    this.evolutionData = {
      totalReponses: 0,
      tauxReponse: 0
    };
    this.weekDays = [
      { name: 'Lun', value: 0 }, { name: 'Mar', value: 0 },
      { name: 'Mer', value: 0 }, { name: 'Jeu', value: 0 },
      { name: 'Ven', value: 0 }, { name: 'Sam', value: 0 },
      { name: 'Dim', value: 0 }
    ];
  }

  setDefaultSurveyStatusData(): void {
    this.surveyStatusData = {
      actives: 0,
      brouillons: 0,
      terminees: 0
    };
  }

  setDefaultParticipationData(): void {
    this.participationData = [];
  }

  setDefaultTopEnquetes(): void {
    this.topEnquetes = [];
  }

  setDefaultRecentEnquetes(): void {
    this.recentEnquetes = [];
  }

  setDefaultRecentActivities(): void {
    this.recentActivities = [];
  }

  updateWeekDaysData(evolution: any[]): void {
    if (!evolution || evolution.length === 0) {
      this.weekDays = [
        { name: 'Lun', value: 0 }, { name: 'Mar', value: 0 },
        { name: 'Mer', value: 0 }, { name: 'Jeu', value: 0 },
        { name: 'Ven', value: 0 }, { name: 'Sam', value: 0 },
        { name: 'Dim', value: 0 }
      ];
      return;
    }

    const weekDayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    this.weekDays = weekDayNames.map((name, index) => {
      const item = evolution.find((e: any) => parseInt(e.periode) === index + 1);
      return {
        name: name,
        value: item ? parseInt(item.nombre) : 0
      };
    });
  }

  // ========== MÉTHODES D'INITIALISATION DES GRAPHIQUES ==========

  initializeCharts(): void {
    this.createResponsesChart();
    this.createSurveyStatusChart();
  }

  createResponsesChart(): void {
    const ctx = document.getElementById('responsesChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.responsesChart) {
      this.responsesChart.destroy();
    }

    const data = this.weekDays.map(day => day.value);
    const labels = this.weekDays.map(day => day.name);

    this.responsesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Réponses',
          data: data,
          borderColor: '#9D50BB',
          backgroundColor: 'rgba(157, 80, 187, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#9D50BB',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'white',
            titleColor: '#1a1a2c',
            bodyColor: '#4f5b6b',
            borderColor: '#eef2f6',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0, 0, 0, 0.05)' },
            ticks: { color: '#7c8a9a' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#7c8a9a' }
          }
        }
      }
    });
  }

  createSurveyStatusChart(): void {
    const ctx = document.getElementById('surveyStatusChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.surveyStatusChart) {
      this.surveyStatusChart.destroy();
    }

    this.surveyStatusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Actives', 'Brouillons', 'Terminées'],
        datasets: [{
          data: [this.surveyStatusData.actives, this.surveyStatusData.brouillons, this.surveyStatusData.terminees],
          backgroundColor: ['#9D50BB', '#f39c12', '#2ecc71'],
          borderWidth: 0,
          borderRadius: 10,
          hoverOffset: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.raw}%`
            }
          }
        }
      }
    });
  }

  updateCharts(): void {
    if (this.responsesChart) {
      this.responsesChart.data.datasets[0].data = this.weekDays.map(day => day.value);
      this.responsesChart.update();
    }
  }

  updateSurveyStatusChart(): void {
    if (this.surveyStatusChart) {
      this.surveyStatusChart.data.datasets[0].data = [
        this.surveyStatusData.actives,
        this.surveyStatusData.brouillons,
        this.surveyStatusData.terminees
      ];
      this.surveyStatusChart.update();
    }
  }

  // ========== MÉTHODES UI ==========

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile && !this.mobileMenuOpen) {
      this.sidebarCollapsed = true;
    }
  }

  toggleSidebar(): void {
    if (!this.isMobile) {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (this.mobileMenuOpen) {
      this.sidebarCollapsed = false;
    } else {
      this.sidebarCollapsed = true;
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    if (this.isMobile) {
      this.sidebarCollapsed = true;
    }
  }

  updatePageTitle(): void {
    const url = this.router.url;
    if (url.includes('gestionEnquete')) {
      this.currentPageTitle = 'Gestion des enquêtes';
    } else if (url.includes('gestionQuestions')) {
      this.currentPageTitle = 'Gestion des questions';
    } else if (url.includes('gestionReclamation')) {
      this.currentPageTitle = 'Gestion des réclamations';
    } else if (url.includes('AnalyseReporting')) {
      this.currentPageTitle = 'Analyse & Reporting';
    } else if (url.includes('feedback')) {
      this.currentPageTitle = 'Feedback & Support';
    } else if (url.includes('QuestionIA')) {
      this.currentPageTitle = 'Gestion IA';
    } else if (url.includes('userReponses')) {
      this.currentPageTitle = 'Réponses';
    } else if (url.includes('admin-dashboard') || url === '/admin-dashboard' || url === '/') {
      this.currentPageTitle = 'Dashboard Admin';
    } else {
      this.currentPageTitle = 'Dashboard';
    }
  }

  getPageTitle(): string {
    return this.currentPageTitle;
  }

  getPeriodLabel(): string {
    switch(this.selectedPeriod) {
      case 'today': return "Aujourd'hui";
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois';
      case 'year': return 'Cette année';
      default: return 'Cette semaine';
    }
  }

  getAdminName(): string {
    if (this.currentUser) {
      if (this.currentUser.prenom && this.currentUser.nom) {
        return `${this.currentUser.prenom} ${this.currentUser.nom}`;
      }
      return this.currentUser.nom || this.currentUser.email || 'Administrateur';
    }
    return 'Administrateur';
  }

  getPhotoProfil(): string | null {
    return this.currentUser?.photo_profil || null;
  }

  getDashboardSummary(): string {
    const totalEnquetes = this.nombreEnquete || 0;
    const totalParticipants = this.nombreParticicant || 0;

    if (totalEnquetes === 0 && totalParticipants === 0) {
      return 'Bienvenue sur votre tableau de bord';
    }
    if (totalEnquetes > 0 && totalParticipants === 0) {
      return `${totalEnquetes} enquête${totalEnquetes > 1 ? 's' : ''} créée${totalEnquetes > 1 ? 's' : ''}`;
    }
    if (totalParticipants > 0) {
      return `${totalParticipants} participant${totalParticipants > 1 ? 's' : ''} ont répondu à ${totalEnquetes} enquête${totalEnquetes > 1 ? 's' : ''}`;
    }
    return 'Aucune activité récente';
  }

  getNotificationCount(): number {
    return this.recentActivities.filter(a => a.time.includes('min') || a.time.includes("l'instant")).length;
  }

  getActivityIcon(activity: Activity): string {
    return activity.icon || 'fa-bell';
  }

  getActivityBackground(activity: Activity): string {
    return activity.background || '#f3e5f5';
  }

  changePeriod(period: string): void {
    this.selectedPeriod = period;
    this.loadDataForPeriod(period);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    if (this.isMobile) {
      this.closeMobileMenu();
    }
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  confirmLogout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      this.router.navigate(['/login']);
    }
  }

  onSearch(event: any): void {
    const searchTerm = event.target.value;
    if (searchTerm && searchTerm.length > 2) {
      console.log('Recherche:', searchTerm);
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }
}