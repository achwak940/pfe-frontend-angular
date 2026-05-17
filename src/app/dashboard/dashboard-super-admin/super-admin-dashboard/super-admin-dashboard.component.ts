import { Component, OnInit, HostBinding, Renderer2, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';

interface User { id: number; nom: string; email: string; role: string; }
interface StatCard { icon: string; label: string; value: string; trend: number; trendText: string; bgColor: string; }
interface Activity { user: string; userAvatar: string; action: string; survey: string; status: 'actif' | 'inactif' | 'terminé' | 'archivé'; time: string; }
interface Notification { icon: string; bgColor: string; message: string; time: string; read: boolean; }
interface Survey { title: string; participants: number; completion: number; status: string; duration: string; icon: string; color: string; }
interface Complaint { user: string; message: string; date: Date; status: string; statusColor: string; }
interface IAQuestion { text: string; category: string; difficulty: string; usageCount: number; }

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
  
  private activityChart: Chart | null = null;
  private surveysChart: Chart | null = null;
  private chartPeriod: string = 'week';
  
  totalSurveys = 6;
  
  // Statistiques Cards avec valeurs personnalisées
  statsCards: StatCard[] = [
    { icon: 'fa-users', label: 'Utilisateurs', value: '5', trend: 0, trendText: 'stable', bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { icon: 'fa-poll', label: 'Enquêtes', value: '6', trend: 20, trendText: '+20%', bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { icon: 'fa-percent', label: 'Participation', value: '76%', trend: 5, trendText: '+5%', bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { icon: 'fa-brain', label: 'Questions IA', value: '10', trend: 42, trendText: '+42%', bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
  ];
  
  // Catégories pour le graphique des enquêtes
  surveyCategories = [
    { label: 'Satisfaction', count: 2, color: '#9D50BB', percentage: 33 },
    { label: 'Feedback Produit', count: 2, color: '#F5576C', percentage: 33 },
    { label: 'Tendances', count: 1, color: '#4FACFE', percentage: 17 },
    { label: 'RH & Bien-être', count: 1, color: '#43E97B', percentage: 17 }
  ];
  
  // Enquêtes actives (6 enquêtes)
  activeSurveys: Survey[] = [
    { title: 'Satisfaction Client 2025', participants: 1247, completion: 78, status: 'en cours', duration: '15 jours restants', icon: 'fa-smile', color: '#9D50BB' },
    { title: 'Feedback Produit Premium', participants: 892, completion: 45, status: 'en cours', duration: '22 jours restants', icon: 'fa-star', color: '#F5576C' },
    { title: 'Tendances Télétravail', participants: 2341, completion: 92, status: 'terminé', duration: 'Terminé', icon: 'fa-home', color: '#4FACFE' },
    { title: 'Outils IA & Productivité', participants: 567, completion: 34, status: 'en cours', duration: '25 jours restants', icon: 'fa-robot', color: '#43E97B' },
    { title: 'Bien-être au travail', participants: 756, completion: 67, status: 'en cours', duration: '18 jours restants', icon: 'fa-heart', color: '#FA709A' },
    { title: 'Innovation digitale', participants: 432, completion: 23, status: 'en cours', duration: '30 jours restants', icon: 'fa-lightbulb', color: '#FEE140' }
  ];
  
  // Statistiques réclamations
  totalComplaints = 142;
  complaintStats = [
    { label: 'En attente', count: 45, percent: 32, color: '#F59E0B' },
    { label: 'En traitement', count: 23, percent: 16, color: '#3B82F6' },
    { label: 'Résolues', count: 74, percent: 52, color: '#10B981' }
  ];
  
  // Réclamations récentes
  recentComplaints: Complaint[] = [
    { user: 'Marie Lambert', message: 'Problème d\'accès aux résultats des enquêtes', date: new Date('2025-05-11'), status: 'En attente', statusColor: '#F59E0B' },
    { user: 'Thomas Bernard', message: 'Données de sondage non visibles dans le dashboard', date: new Date('2025-05-10'), status: 'En traitement', statusColor: '#3B82F6' },
    { user: 'Sophie Martin', message: 'Retard dans la génération des rapports IA', date: new Date('2025-05-09'), status: 'Résolue', statusColor: '#10B981' },
    { user: 'Lucas Dubois', message: 'Erreur lors de l\'export des données', date: new Date('2025-05-08'), status: 'En attente', statusColor: '#F59E0B' }
  ];
  
  // Activités récentes
  recentActivities: Activity[] = [
    { user: 'Alexandre Chen', userAvatar: 'https://ui-avatars.com/api/?name=Alex+C&background=9D50BB&color=fff&size=40', action: 'a terminé', survey: 'Satisfaction Client 2025', status: 'terminé', time: 'il y a 2 minutes' },
    { user: 'Maya Rivera', userAvatar: 'https://ui-avatars.com/api/?name=Maya+R&background=9D50BB&color=fff&size=40', action: 'a commencé', survey: 'Tendances Télétravail', status: 'actif', time: 'il y a 15 minutes' },
    { user: 'Jacques Lee', userAvatar: 'https://ui-avatars.com/api/?name=James+L&background=9D50BB&color=fff&size=40', action: 'a répondu à', survey: 'Feedback Produit Premium', status: 'actif', time: 'il y a 1 heure' },
    { user: 'Sofia Grant', userAvatar: 'https://ui-avatars.com/api/?name=Sofia+G&background=9D50BB&color=fff&size=40', action: 'a partagé', survey: 'Outils IA & Productivité', status: 'terminé', time: 'il y a 3 heures' }
  ];
  
  // Notifications
  notifications: Notification[] = [
    { icon: 'fa-user-plus', bgColor: '#9D50BB', message: 'Nouvel utilisateur inscrit', time: 'il y a 5 min', read: false },
    { icon: 'fa-poll', bgColor: '#F5576C', message: 'Enquête "Satisfaction Client" terminée', time: 'il y a 15 min', read: false },
    { icon: 'fa-robot', bgColor: '#43E97B', message: 'IA a généré 3 nouvelles questions', time: 'il y a 1 heure', read: true },
    { icon: 'fa-file-export', bgColor: '#4FACFE', message: 'Export hebdomadaire disponible', time: 'il y a 2 heures', read: true }
  ];
  
  // Questions IA (10 questions)
  iaQuestions: IAQuestion[] = [
    { text: 'Quelle est votre principale source d\'information professionnelle ?', category: 'Comportement', difficulty: 'Facile', usageCount: 234 },
    { text: 'Comment évaluez-vous l\'impact de l\'IA sur votre productivité quotidienne ?', category: 'Technologie', difficulty: 'Moyen', usageCount: 189 },
    { text: 'Quels aspects de notre service recommanderiez-vous à un collègue ?', category: 'Satisfaction', difficulty: 'Facile', usageCount: 312 },
    { text: 'Quelles fonctionnalités aimeriez-vous voir ajoutées dans les 6 prochains mois ?', category: 'Innovation', difficulty: 'Difficile', usageCount: 145 },
    { text: 'À quelle fréquence utilisez-vous les outils collaboratifs ?', category: 'Habitudes', difficulty: 'Facile', usageCount: 278 },
    { text: 'Quel est votre plus grand défi en matière de gestion d\'équipe à distance ?', category: 'Management', difficulty: 'Moyen', usageCount: 167 },
    { text: 'Comment l\'IA pourrait-elle améliorer votre workflow actuel ?', category: 'Technologie', difficulty: 'Difficile', usageCount: 98 },
    { text: 'Quel niveau de priorité donnez-vous à la formation continue ?', category: 'Développement', difficulty: 'Facile', usageCount: 203 },
    { text: 'Quels indicateurs utilisez-vous pour mesurer le succès de vos projets ?', category: 'Analyse', difficulty: 'Moyen', usageCount: 156 },
    { text: 'Comment percevez-vous l\'équilibre entre automatisation et intervention humaine ?', category: 'Philosophie', difficulty: 'Difficile', usageCount: 87 }
  ];
  
  profileImage: string = 'https://ui-avatars.com/api/?name=Super+Admin&background=9D50BB&color=fff&size=48';

  constructor(private router: Router, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadThemePreference();
    this.checkUnreadNotifications();
  }

  ngAfterViewInit(): void {
    this.initActivityChart();
    this.initSurveysChart();
  }

  ngOnDestroy(): void {
    if (this.activityChart) this.activityChart.destroy();
    if (this.surveysChart) this.surveysChart.destroy();
  }

  private loadCurrentUser(): void {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        if (this.currentUser?.nom) {
          this.profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.nom)}&background=9D50BB&color=fff&size=48`;
        }
      } else {
        this.currentUser = { id: 1, nom: 'Super Admin', email: 'admin@nebula.com', role: 'super_admin' };
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  private loadThemePreference(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkTheme = savedTheme === 'dark';
    if (this.isDarkTheme) this.renderer.addClass(document.body, 'dark-theme');
  }

  private checkUnreadNotifications(): void {
    this.hasNotifications = this.notifications.some(n => !n.read);
  }

  private initActivityChart(): void {
    const canvas = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.activityChart) this.activityChart.destroy();

    const chartData = this.getChartDataByPeriod();
    
    this.activityChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: 'Activité',
          data: chartData.data,
          borderColor: '#9D50BB',
          backgroundColor: 'rgba(157, 80, 187, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#9D50BB',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: this.isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private initSurveysChart(): void {
    const canvas = document.getElementById('surveysChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.surveysChart) this.surveysChart.destroy();

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
          legend: { display: false }
        },
        cutout: '65%'
      }
    });
  }

  private getChartDataByPeriod(): { labels: string[], data: number[] } {
    switch(this.chartPeriod) {
      case 'week': return { labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], data: [45, 52, 68, 71, 63, 48, 32] };
      case 'month': return { labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], data: [245, 278, 312, 298] };
      case 'year': return { labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'], data: [245, 278, 312, 298, 345, 378] };
      default: return { labels: [], data: [] };
    }
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
    this.initActivityChart();
    this.initSurveysChart();
  }

  toggleNotifications(): void { this.showNotifications = !this.showNotifications; this.showProfileMenu = false; }
  toggleProfileMenu(): void { this.showProfileMenu = !this.showProfileMenu; this.showNotifications = false; }
  closeAllDropdowns(): void { this.showNotifications = false; this.showProfileMenu = false; }
  closeNotifications(): void { this.showNotifications = false; }
  closeProfileMenu(): void { this.showProfileMenu = false; }

  onSearch(event: Event): void { console.log('Recherche:', (event.target as HTMLInputElement).value); }
  changeChartPeriod(event: Event): void { this.chartPeriod = (event.target as HTMLSelectElement).value; this.initActivityChart(); }
  
  generateNewQuestions(): void {
    const newQuestions = [
      { text: 'Quelle innovation technologique attendiez-vous avec le plus d\'impatience ?', category: 'Innovation', difficulty: 'Moyen', usageCount: 0 },
      { text: 'Comment décririez-vous l\'ambiance dans votre équipe actuellement ?', category: 'RH', difficulty: 'Facile', usageCount: 0 }
    ];
    this.iaQuestions = [...newQuestions, ...this.iaQuestions];
    this.statsCards[3].value = this.iaQuestions.length.toString();
  }

  createNewSurvey(): void { console.log('Nouvelle enquête'); }
  viewAllComplaints(): void { console.log('Voir réclamations'); }
  refreshActivities(): void { console.log('Rafraîchir'); }
  
  exportActivity(): void {
    const csvData = this.recentActivities.map(a => `${a.user},${a.action},${a.survey},${a.status},${a.time}`).join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activites_${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  logout(): void { localStorage.clear(); this.router.navigate(['/login']); }
  getCurrentUserName(): string { return this.currentUser?.nom || 'Super Admin'; }
  getCurrentUserEmail(): string { return this.currentUser?.email || 'admin@nebula.com'; }
}