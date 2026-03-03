import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

interface Enquete {
  titre: string;
  participants: number;
  dateFin: string;
  statut: 'active' | 'brouillon' | 'terminee';
  icon?: string;
}

interface Activity {
  type: 'creation' | 'modification' | 'publication' | 'participation' | 'reclamation';
  message: string;
  time: string;
  icon: string;
  color: string;
  isNew?: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  sidebarCollapsed = false;
  mobileMenuOpen = false;
  currentPageTitle = 'Dashboard Admin';
  isMobile = false;
  
  // Rendre router public pour l'utiliser dans le template
  public router: Router;
  
  // Données pour le dashboard d'accueil
  currentDate: Date = new Date();
  
  // Statistiques du dashboard
  stats = {
    enquetesActives: 24,
    participants: 1284,
    tauxReponse: 68,
    noteMoyenne: 4.8
  };
  
  participationData = [
    { label: 'Satisfaction client', value: 85, color: '#9D50BB' },
    { label: 'Support NPS', value: 60, color: '#f39c12' },
    { label: 'Application mobile', value: 45, color: '#2ecc71' },
    { label: 'Formation', value: 92, color: '#3498db' },
    { label: 'Événement', value: 30, color: '#e74c3c' }
  ];

  recentEnquetes: Enquete[] = [
    {
      titre: 'Satisfaction clients 2025',
      participants: 145,
      dateFin: '30 avr 2025',
      statut: 'active',
      icon: 'fa-poll'
    },
    {
      titre: 'Support client NPS',
      participants: 0,
      dateFin: '15 mai 2025',
      statut: 'brouillon',
      icon: 'fa-file-alt'
    },
    {
      titre: 'Application mobile v2',
      participants: 57,
      dateFin: '1 avr 2025',
      statut: 'active',
      icon: 'fa-poll'
    },
    {
      titre: 'Évaluation formation',
      participants: 456,
      dateFin: '15 jan 2025',
      statut: 'terminee',
      icon: 'fa-check-circle'
    }
  ];

  // Activités récentes dynamiques
  recentActivities: Activity[] = [];
  
  // Données pour les graphiques
  chartData = {
    labels: ['Actives', 'Brouillons', 'Terminées'],
    values: [50, 20, 30],
    colors: ['#9D50BB', '#f39c12', '#2ecc71']
  };

  constructor(router: Router) {
    this.router = router;
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePageTitle();
      if (this.isMobile) {
        this.mobileMenuOpen = false;
      }
    });
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadRecentActivities();
    
    // Rafraîchir les activités toutes les 30 secondes
    setInterval(() => {
      this.loadRecentActivities();
    }, 30000);
    
    // Mettre à jour la date toutes les minutes
    setInterval(() => {
      this.currentDate = new Date();
    }, 60000);
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
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
    } else if (url.includes('admin-dashboard') || url === '/admin-dashboard' || url === '/') {
      this.currentPageTitle = 'Dashboard Admin';
    } else if (url.includes('super-admin-dashboard')) {
      this.currentPageTitle = 'Dashboard Super Admin';
    } else if (url.includes('users')) {
      this.currentPageTitle = 'Gestion des utilisateurs';
    } else if (url.includes('parametres')) {
      this.currentPageTitle = 'Paramètres';
    } else if (url.includes('profile')) {
      this.currentPageTitle = 'Mon profil';
    } else if (url.includes('notifications')) {
      this.currentPageTitle = 'Notifications';
    } else {
      this.currentPageTitle = 'Dashboard';
    }
  }

  getPageTitle(): string {
    return this.currentPageTitle;
  }

  logout(): void {
    // Ajouter la logique de déconnexion
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  // Méthode pour la recherche
  onSearch(event: any): void {
    const searchTerm = event.target.value;
    if (searchTerm && searchTerm.length > 2) {
      console.log('Recherche:', searchTerm);
      // Implémenter la logique de recherche
      // Vous pouvez émettre un événement ou appeler un service
    }
  }

  // Navigation vers une route
  navigateTo(route: string): void {
    this.router.navigate([route]);
    if (this.isMobile) {
      this.closeMobileMenu();
    }
  }

  // Vérifier si une route est active
  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  // Vérifier si on est sur la page d'accueil du dashboard
  isDashboardHome(): boolean {
    return this.router.url === '/admin-dashboard' || this.router.url === '/';
  }

  // Confirmation de déconnexion
  confirmLogout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.logout();
    }
  }

  /**
   * Charge les activités récentes dynamiquement
   */
  loadRecentActivities(): void {
    // Simuler le chargement depuis une API
    // Dans un cas réel, vous feriez un appel HTTP ici
    this.recentActivities = this.generateMockActivities();
  }

  /**
   * Génère des activités mockées pour la démonstration
   */
  private generateMockActivities(): Activity[] {
    const now = new Date();
    const activities: Activity[] = [];

    // Nouvelles participations
    activities.push({
      type: 'participation',
      message: 'Nouvelle participation à l\'enquête "Satisfaction client"',
      time: this.getTimeAgo(new Date(now.getTime() - 3 * 60000)), // 3 min
      icon: 'fa-user',
      color: '#9D50BB',
      isNew: true
    });

    // Nouvelles réclamations
    activities.push({
      type: 'reclamation',
      message: 'Nouvelle réclamation concernant le service client',
      time: this.getTimeAgo(new Date(now.getTime() - 12 * 60000)), // 12 min
      icon: 'fa-exclamation-triangle',
      color: '#e74c3c',
      isNew: true
    });

    activities.push({
      type: 'reclamation',
      message: 'Réclamation #1234 traitée avec succès',
      time: this.getTimeAgo(new Date(now.getTime() - 35 * 60000)), // 35 min
      icon: 'fa-check-circle',
      color: '#2ecc71',
      isNew: false
    });

    // Modifications de réponses
    activities.push({
      type: 'modification',
      message: '3 réponses modifiées dans l\'enquête "Feedback produit"',
      time: this.getTimeAgo(new Date(now.getTime() - 1.5 * 60 * 60000)), // 1.5h
      icon: 'fa-edit',
      color: '#f39c12',
      isNew: false
    });

    // Nouvelles créations d'enquêtes
    activities.push({
      type: 'creation',
      message: 'Nouvelle enquête créée: "Évaluation des performances 2025"',
      time: this.getTimeAgo(new Date(now.getTime() - 2.5 * 60 * 60000)), // 2.5h
      icon: 'fa-plus',
      color: '#3498db',
      isNew: false
    });

    // Publication d'enquête
    activities.push({
      type: 'publication',
      message: 'Enquête "Formation en ligne" publiée',
      time: this.getTimeAgo(new Date(now.getTime() - 4 * 60 * 60000)), // 4h
      icon: 'fa-check',
      color: '#2ecc71',
      isNew: false
    });

    // Nouvelle participation
    activities.push({
      type: 'participation',
      message: '15 nouvelles participations à l\'enquête "NPS Support"',
      time: this.getTimeAgo(new Date(now.getTime() - 5 * 60 * 60000)), // 5h
      icon: 'fa-users',
      color: '#9D50BB',
      isNew: false
    });

    // Nouvelle réclamation urgente
    activities.push({
      type: 'reclamation',
      message: '⚠️ Réclamation urgente: problème technique',
      time: this.getTimeAgo(new Date(now.getTime() - 6 * 60 * 60000)), // 6h
      icon: 'fa-exclamation-circle',
      color: '#e74c3c',
      isNew: false
    });

    // Trier par date (plus récent d'abord)
    return activities.sort((a, b) => {
      const timeA = this.parseTimeAgo(a.time);
      const timeB = this.parseTimeAgo(b.time);
      return timeB - timeA;
    });
  }

  /**
   * Convertit une date en texte relatif (il y a X minutes, etc.)
   */
  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} j`;
  }

  /**
   * Parse le texte relatif pour obtenir un timestamp (pour le tri)
   */
  private parseTimeAgo(timeAgo: string): number {
    const now = new Date().getTime();
    
    if (timeAgo === 'À l\'instant') return now;
    if (timeAgo === 'Hier') return now - 86400000;
    
    const match = timeAgo.match(/(\d+)/);
    if (!match) return 0;
    
    const value = parseInt(match[0]);
    
    if (timeAgo.includes('min')) return now - value * 60000;
    if (timeAgo.includes('h')) return now - value * 3600000;
    if (timeAgo.includes('j')) return now - value * 86400000;
    
    return 0;
  }

  /**
   * Rafraîchit manuellement les activités
   */
  refreshActivities(): void {
    this.loadRecentActivities();
    // Ajouter une animation ou un toast de confirmation
    console.log('Activités rafraîchies');
  }

  /**
   * Obtient l'icône pour une activité
   */
  getActivityIcon(activity: Activity): string {
    switch (activity.type) {
      case 'creation': return 'fa-plus';
      case 'modification': return 'fa-edit';
      case 'publication': return 'fa-check';
      case 'participation': return activity.message.includes('15') ? 'fa-users' : 'fa-user';
      case 'reclamation': 
        return activity.message.includes('urgente') ? 'fa-exclamation-circle' : 
               activity.message.includes('traitée') ? 'fa-check-circle' : 'fa-exclamation-triangle';
      default: return 'fa-bell';
    }
  }

  /**
   * Obtient la couleur de fond pour une activité
   */
  getActivityBackground(activity: Activity): string {
    switch (activity.type) {
      case 'creation': return '#e8f0fe';
      case 'modification': return '#fef5e7';
      case 'publication': return '#d5f5e3';
      case 'participation': return '#f3e5f5';
      case 'reclamation': 
        return activity.message.includes('urgente') ? '#fdedec' : '#fef5e7';
      default: return '#f1f3f6';
    }
  }

  /**
   * Vérifie si une activité est nouvelle (moins de 30 minutes)
   */
  isNewActivity(activity: Activity): boolean {
    return activity.time.includes('À l\'instant') || 
           activity.time.includes('min') && !activity.time.includes('h');
  }

  /**
   * Obtient le nombre de notifications non lues
   */
  getNotificationCount(): number {
    return this.recentActivities.filter(a => this.isNewActivity(a)).length;
  }

  /**
   * Marque toutes les activités comme lues
   */
  markAllAsRead(): void {
    this.recentActivities = this.recentActivities.map(activity => ({
      ...activity,
      isNew: false
    }));
  }
}