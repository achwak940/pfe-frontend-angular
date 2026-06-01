import { Component, OnInit, HostBinding, Renderer2, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';
import { StatistiquesService, UserEvolutionData, Notification, NotificationStats, Activity } from '../statistiques.service';

interface User { id: number; nom: string; email: string; role: string; }
interface StatCard { icon: string; label: string; value: string; trend: number; bgColor: string; class?: string; }
interface ActivityDisplay { 
  user: string; 
  userAvatar?: string;
  action: string; 
  target?: string;
  message?: string;
  details?: string;
  detailIcon?: string;
  status: string;
  statusColor: string;
  icon: string;
  time: string;
}
interface NotificationDisplay { icon: string; bgColor: string; message: string; time: string; read: boolean; id?: number; }

@Component({
  selector: 'app-super-admin-dashboard',
  templateUrl: './super-admin-dashboard.component.html',
  styleUrls: ['./super-admin-dashboard.component.css']
})
export class SuperAdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class.dark-theme') isDarkTheme = false;
  
  currentUser: User | null = null;
  hasNotifications = true;
  showNotifications = false;
  showProfileMenu = false;
  isSidebarCollapsed = false;
  isLoading = true;
  
  private usersChart: Chart | null = null;
  private surveysChart: Chart | null = null;
  private usersChartPeriod: string = 'month';
  private refreshInterval: any;
  
  // Données dynamiques
  totalSurveys = 0;
  totalUsers = 0;
  newUsersThisMonth = 0;
  activeUsersRate = 0;
  totalReclamations = 0;
  tauxParticipation = 76;
  unreadCount = 0;
  
  surveyCategories: Array<{ label: string; count: number; color: string; percentage: number }> = [];
  
  statsCards: StatCard[] = [
    { icon: 'fa-users', label: 'Utilisateurs', value: '0', trend: 0, bgColor: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', class: 'primary' },
    { icon: 'fa-poll', label: 'Enquêtes', value: '0', trend: 0, bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', class: 'secondary' },
    { icon: 'fa-percent', label: 'Participation', value: '0%', trend: 0, bgColor: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', class: 'success' },
    { icon: 'fa-exclamation-triangle', label: 'Réclamations', value: '0', trend: 0, bgColor: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', class: 'warning' }
  ];
  
  recentActivities: ActivityDisplay[] = [];
  notifications: NotificationDisplay[] = [];
  profileImage: string = 'https://ui-avatars.com/api/?name=Super+Admin&background=a855f7&color=fff&size=48';

  constructor(
    private router: Router, 
    private renderer: Renderer2,
    private statsService: StatistiquesService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadThemePreference();
    this.loadAllStats();
    this.loadNotifications();
    this.loadRecentActivities();
    
    // Rafraîchir les données toutes les 30 secondes
    this.refreshInterval = setInterval(() => {
      this.refreshAllData();
    }, 30000);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.surveyCategories.length > 0) {
        this.initSurveysChart();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.usersChart) this.usersChart.destroy();
    if (this.surveysChart) this.surveysChart.destroy();
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  // ==================== CHARGEMENT DES DONNÉES ====================
  
  refreshAllData(): void {
    this.loadAllStats();
    this.loadNotifications();
    this.loadRecentActivities();
  }
  
  loadAllStats(): void {
    this.isLoading = true;
    
    // Charger les stats utilisateurs
    this.statsService.getDashboardUserStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.totalUsers = response.data.totalUsers;
          this.newUsersThisMonth = response.data.newUsersThisMonth;
          this.activeUsersRate = response.data.activeUsersRate;
          this.statsCards[0].value = this.totalUsers.toString();
          this.loadUserEvolutionData(this.usersChartPeriod);
        }
      },
      error: (err) => console.error('Erreur chargement stats utilisateurs:', err)
    });

    // Charger les stats des enquêtes
    this.statsService.getEnqueteDistribution().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.surveyCategories = response.data.categories;
          this.totalSurveys = response.data.total;
          this.statsCards[1].value = this.totalSurveys.toString();
          setTimeout(() => this.initSurveysChart(), 100);
        }
      },
      error: (err) => console.error('Erreur chargement distribution enquêtes:', err)
    });

    // Charger les stats des réclamations
    this.statsService.getReclamationStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.totalReclamations = response.data.total;
          this.statsCards[3].value = this.totalReclamations.toString();
          this.statsCards[3].trend = response.data.taux_resolution;
        }
      },
      error: (err) => console.error('Erreur chargement stats réclamations:', err)
    });
    
    setTimeout(() => { this.isLoading = false; }, 1000);
  }

  loadUserEvolutionData(periode: string): void {
    this.statsService.getUserEvolutionData(periode).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.initUsersChartWithData(response.data);
        }
      },
      error: (err) => console.error('Erreur chargement évolution utilisateurs:', err)
    });
  }

  loadNotifications(): void {
    const userId = this.currentUser?.id || 1;
    
    // Charger le nombre de notifications non lues
    this.statsService.countUnreadNotifications(userId).subscribe({
      next: (count) => {
        this.unreadCount = count;
        this.hasNotifications = count > 0;
      },
      error: (err) => console.error('Erreur chargement compteur notifications:', err)
    });
    
    // Charger les notifications récentes
    this.statsService.getNotifications(userId, 10).subscribe({
      next: (notifications) => {
        this.notifications = notifications.map(notif => ({
          id: notif.id,
          icon: this.statsService.getNotificationIcon(notif.type),
          bgColor: this.statsService.getNotificationColor(notif.type),
          message: notif.titre,
          time: this.statsService.formatTimeAgo(notif.dateCreation),
          read: notif.lu
        }));
      },
      error: (err) => console.error('Erreur chargement notifications:', err)
    });
  }

  loadRecentActivities(): void {
    // Récupérer les activités depuis les notifications
    const userId = this.currentUser?.id || 1;
    
    this.statsService.getRecentNotifications(userId, 10).subscribe({
      next: (notifications) => {
        this.recentActivities = notifications.map(notif => ({
          user: 'Système',
          userAvatar: 'https://ui-avatars.com/api/?name=System&background=a855f7&color=fff&size=40',
          action: this.getActionFromType(notif.type),
          target: notif.titre,
          message: notif.contenu,
          details: notif.type,
          detailIcon: 'fa-info-circle',
          status: notif.lu ? 'lu' : 'non_lu',
          statusColor: this.statsService.getNotificationColor(notif.type),
          icon: this.statsService.getNotificationIcon(notif.type),
          time: this.statsService.formatTimeAgo(notif.dateCreation)
        }));
      },
      error: (err) => console.error('Erreur chargement activités:', err)
    });
  }

  getActionFromType(type: string): string {
    switch (type) {
      case 'ENQUETE': return 'a publié une enquête';
      case 'RECLAMATION': return 'a soumis une réclamation';
      case 'MESSAGE': return 'a envoyé un message';
      case 'REPONSE': return 'a répondu à une enquête';
      default: return 'a envoyé une notification';
    }
  }

  // ==================== ACTIONS NOTIFICATIONS ====================
  
  markNotificationAsRead(id: number): void {
    this.statsService.markNotificationAsRead(id).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  markAllNotificationsAsRead(): void {
    const userId = this.currentUser?.id || 1;
    this.statsService.markAllNotificationsAsRead(userId).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  // ==================== GRAPHIQUES ====================
  
  private initUsersChartWithData(data: UserEvolutionData): void {
    const canvas = document.getElementById('usersChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.usersChart) this.usersChart.destroy();

    this.usersChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Nouveaux utilisateurs',
            data: data.newUsers,
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#a855f7',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          },
          {
            label: 'Utilisateurs actifs',
            data: data.activeUsers,
            borderColor: '#c084fc',
            backgroundColor: 'rgba(192, 132, 252, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#c084fc',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              boxWidth: 10,
              color: this.isDarkTheme ? '#fff' : '#333'
            }
          },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            grid: { color: this.isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
            title: { display: true, text: "Nombre d'utilisateurs", color: this.isDarkTheme ? '#fff' : '#666' }
          },
          x: { 
            grid: { display: false },
            title: { display: true, text: 'Période', color: this.isDarkTheme ? '#fff' : '#666' }
          }
        }
      }
    });
  }

  private initSurveysChart(): void {
    const canvas = document.getElementById('surveysChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.surveysChart) this.surveysChart.destroy();

    if (!this.surveyCategories || this.surveyCategories.length === 0) return;

    this.surveysChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: this.surveyCategories.map(c => c.label),
        datasets: [{
          data: this.surveyCategories.map(c => c.count),
          backgroundColor: this.surveyCategories.map(c => c.color),
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw as number;
                const total = this.surveyCategories.reduce((sum, c) => sum + c.count, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '65%'
      }
    });
  }

  // ==================== ACTIONS UI ====================
  
  changeUsersChartPeriod(event: Event): void {
    this.usersChartPeriod = (event.target as HTMLSelectElement).value;
    this.loadUserEvolutionData(this.usersChartPeriod);
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    
    if (this.isDarkTheme) {
      this.renderer.addClass(document.body, 'dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
      localStorage.setItem('theme', 'light');
    }
    
    setTimeout(() => {
      if (this.surveyCategories.length > 0) {
        this.initSurveysChart();
      }
    }, 50);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleNotifications(): void { 
    this.showNotifications = !this.showNotifications; 
    this.showProfileMenu = false; 
  }
  
  toggleProfileMenu(): void { 
    this.showProfileMenu = !this.showProfileMenu; 
    this.showNotifications = false; 
  }
  
  closeAllDropdowns(): void { 
    this.showNotifications = false; 
    this.showProfileMenu = false; 
  }
  
  closeNotifications(): void { 
    this.showNotifications = false; 
  }
  
  markAllAsRead(): void { 
    this.markAllNotificationsAsRead();
  }

  refreshActivities(): void { 
    this.loadRecentActivities();
  }

  logout(): void { 
    localStorage.clear(); 
    this.router.navigate(['/login']); 
  }
  
  getCurrentUserName(): string { 
    return this.currentUser?.nom || 'Super Admin'; 
  }
  
  getCurrentUserEmail(): string { 
    return this.currentUser?.email || 'admin@nebula.com'; 
  }

  private loadCurrentUser(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    } else {
      this.currentUser = { id: 1, nom: 'Super Admin', email: 'admin@nebula.com', role: 'super_admin' };
    }
  }

  private loadThemePreference(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkTheme = savedTheme === 'dark';
    if (this.isDarkTheme) {
      this.renderer.addClass(document.body, 'dark-theme');
    }
  }
}