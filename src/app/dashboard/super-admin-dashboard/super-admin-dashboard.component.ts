import { Component, OnInit, HostBinding, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';

interface User {
  id: number;
  nom: string;
  email: string;
  role: string;
  avatar?: string;
}

interface StatCard {
  icon: string;
  label: string;
  value: string;
  trend: number;
  trendText: string;
}

interface RecentActivity {
  user: string;
  userAvatar: string;
  action: string;
  survey: string;
  status: 'actif' | 'inactif' | 'archivé';
  time: string;
}

interface Notification {
  icon: string;
  message: string;
  time: string;
  read: boolean;
}

// Service de thème simulé (ou vous pouvez l'importer)
class ThemeService {
  currentTheme$: Observable<'light' | 'dark'> = of('light');
}

@Component({
  selector: 'app-super-admin-dashboard',
  templateUrl: './super-admin-dashboard.component.html',
  styleUrls: ['./super-admin-dashboard.component.css']
})
export class SuperAdminDashboardComponent implements OnInit {
  @HostBinding('class.dark-theme') isDarkTheme = false;
  
  currentUser: User | null = null;
  hasNotifications = true;
  showNotifications = false;
  showProfileMenu = false;
  
  selectedRole: string = 'all';
  searchId: string = 'usr_124';
  
  // Service de thème simulé
  themeService = {
    currentTheme$: of(this.isDarkTheme ? 'dark' : 'light')
  };
  
  // Données des cartes statistiques
  statsCards: StatCard[] = [
    { icon: 'fa-user-circle', label: 'Utilisateurs totaux', value: '248.3k', trend: 12, trendText: '+12%' },
    { icon: 'fa-poll', label: 'Sondages totaux', value: '1,423', trend: 8, trendText: '+8%' },
    { icon: 'fa-percent', label: 'Taux de participation', value: '76%', trend: 0, trendText: 'stable' },
    { icon: 'fa-brain', label: 'Questions IA', value: '9.2k', trend: 23, trendText: '+23%' }
  ];
  
  // Données des graphiques
  chartBars: number[] = [70, 110, 85, 130, 95, 60, 115];
  
  // Activités récentes
  recentActivities: RecentActivity[] = [
    {
      user: 'Alexandre Chen',
      userAvatar: 'https://ui-avatars.com/api/?name=Alex+C&background=9D50BB&color=fff&size=24',
      action: 'terminé',
      survey: 'Feedback Produit 2025',
      status: 'actif',
      time: 'il y a 2 min'
    },
    {
      user: 'Maya Rivera',
      userAvatar: 'https://ui-avatars.com/api/?name=Maya+R&background=9D50BB&color=fff&size=24',
      action: 'commencé',
      survey: 'Tendances télétravail',
      status: 'actif',
      time: 'il y a 15 min'
    },
    {
      user: 'Jacques Lee',
      userAvatar: 'https://ui-avatars.com/api/?name=James+L&background=9D50BB&color=fff&size=24',
      action: 'abandonné',
      survey: 'Santé & Bien-être',
      status: 'inactif',
      time: 'il y a 1 heure'
    },
    {
      user: 'Sofia Grant',
      userAvatar: 'https://ui-avatars.com/api/?name=Sofia+G&background=9D50BB&color=fff&size=24',
      action: 'terminé',
      survey: 'Sondage outils IA',
      status: 'actif',
      time: 'il y a 3 heures'
    },
    {
      user: 'Omar Farooq',
      userAvatar: 'https://ui-avatars.com/api/?name=Omar+F&background=9D50BB&color=fff&size=24',
      action: 'exporté',
      survey: 'Engagement annuel',
      status: 'archivé',
      time: 'il y a 5 heures'
    }
  ];
  
  // Notifications
  notifications: Notification[] = [
    {
      icon: 'fa-user-plus',
      message: 'Nouvel utilisateur inscrit',
      time: 'il y a 5 min',
      read: false
    },
    {
      icon: 'fa-poll',
      message: 'Sondage "Feedback 2025" terminé',
      time: 'il y a 15 min',
      read: false
    },
    {
      icon: 'fa-robot',
      message: 'IA a généré 50 nouvelles questions',
      time: 'il y a 1 heure',
      read: true
    },
    {
      icon: 'fa-file-export',
      message: 'Export hebdomadaire disponible',
      time: 'il y a 2 heures',
      read: true
    }
  ];
  
  // Image de profil
  profileImage: string = 'https://ui-avatars.com/api/?name=Super+Admin&background=9D50BB&color=fff&size=32';

  constructor(
    private router: Router,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadThemePreference();
    this.checkUnreadNotifications();
  }

  /**
   * Charge l'utilisateur courant depuis le localStorage
   */
  private loadCurrentUser(): void {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        this.currentUser = JSON.parse(userStr) as User;
        // Mettre à jour l'avatar avec le nom de l'utilisateur
        if (this.currentUser?.nom) {
          this.profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.nom)}&background=9D50BB&color=fff&size=32`;
        }
      } else {
        // Utilisateur par défaut si aucun n'est connecté
        this.currentUser = {
          id: 1,
          nom: 'Super Admin',
          email: 'admin@nebula.com',
          role: 'super_admin'
        };
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
      this.currentUser = null;
    }
  }

  /**
   * Charge la préférence de thème depuis le localStorage
   */
  private loadThemePreference(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkTheme = savedTheme === 'dark';
    
    if (this.isDarkTheme) {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }
    
    // Mettre à jour le service de thème
    this.themeService.currentTheme$ = of(this.isDarkTheme ? 'dark' : 'light');
  }

  /**
   * Vérifie s'il y a des notifications non lues
   */
  private checkUnreadNotifications(): void {
    this.hasNotifications = this.notifications.some(n => !n.read);
  }

  /**
   * Bascule entre thème clair et sombre
   */
  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    
    if (this.isDarkTheme) {
      this.renderer.addClass(document.body, 'dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
      localStorage.setItem('theme', 'light');
    }
    
    // Mettre à jour le service de thème
    this.themeService.currentTheme$ = of(this.isDarkTheme ? 'dark' : 'light');
  }

  /**
   * Affiche/masque le panneau des notifications
   */
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showProfileMenu = false;
      // Marquer toutes les notifications comme lues
      this.notifications.forEach(n => n.read = true);
      this.hasNotifications = false;
    }
  }

  /**
   * Ferme le panneau des notifications
   */
  closeNotifications(): void {
    this.showNotifications = false;
  }

  /**
   * Affiche/masque le menu du profil
   */
  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
    if (this.showProfileMenu) {
      this.showNotifications = false;
    }
  }

  /**
   * Ferme le menu du profil
   */
  closeProfileMenu(): void {
    this.showProfileMenu = false;
  }

  /**
   * Applique les filtres IA
   */
  applyAIFilters(): void {
    console.log('Filtres appliqués:', {
      role: this.selectedRole,
      id: this.searchId
    });
    // Logique pour appliquer les filtres
  }

  /**
   * Crée un nouveau sondage
   */
  createNewSurvey(): void {
    console.log('Création d\'un nouveau sondage');
    this.router.navigate(['/surveys/new']);
  }

  /**
   * Synchronise les données
   */
  syncData(): void {
    console.log('Synchronisation des données...');
    // Logique de synchronisation
  }

  /**
   * Exporte l'activité récente
   */
  exportActivity(): void {
    console.log('Export de l\'activité récente');
    // Logique d'export
  }

  /**
   * Déconnecte l'utilisateur
   */
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  /**
   * Obtient le nom de l'utilisateur courant
   */
  getCurrentUserName(): string {
    return this.currentUser?.nom || 'Super Admin';
  }

  /**
   * Obtient l'email de l'utilisateur courant
   */
  getCurrentUserEmail(): string {
    return this.currentUser?.email || 'admin@nebula.com';
  }
}