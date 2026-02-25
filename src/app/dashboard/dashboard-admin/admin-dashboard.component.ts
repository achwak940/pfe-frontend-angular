import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

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
  
  participationData = [
    { label: 'Satisfaction client', value: 85, color: '#9D50BB' },
    { label: 'Support NPS', value: 60, color: '#f39c12' },
    { label: 'Application mobile', value: 45, color: '#2ecc71' },
    { label: 'Formation', value: 92, color: '#3498db' },
    { label: 'Événement', value: 30, color: '#e74c3c' }
  ];

  recentEnquetes = [
    {
      titre: 'Satisfaction clients 2025',
      participants: 145,
      dateFin: '30 avr 2025',
      statut: 'active'
    },
    {
      titre: 'Support client NPS',
      participants: 0,
      dateFin: '15 mai 2025',
      statut: 'brouillon'
    },
    {
      titre: 'Application mobile v2',
      participants: 57,
      dateFin: '1 avr 2025',
      statut: 'active'
    },
    {
      titre: 'Évaluation formation',
      participants: 456,
      dateFin: '15 jan 2025',
      statut: 'terminee'
    }
  ];

  recentActivities = [
    {
      type: 'publication',
      message: 'Enquête "Satisfaction client" publiée',
      time: 'Il y a 5 minutes'
    },
    {
      type: 'participation',
      message: 'Nouvelle participation à "NPS Support"',
      time: 'Il y a 15 minutes'
    },
    {
      type: 'creation',
      message: 'Enquête "Formation en ligne" créée',
      time: 'Il y a 2 heures'
    },
    {
      type: 'modification',
      message: 'Questions modifiées dans "Mobile App"',
      time: 'Il y a 3 heures'
    }
  ];

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
}