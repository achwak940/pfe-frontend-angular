import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

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

  constructor(private router: Router) {
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
  }
   @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) {
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
    this.sidebarCollapsed = this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    this.sidebarCollapsed = true;
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
    } else if (url.includes('admin-dashboard')) {
      this.currentPageTitle = 'Dashboard Admin';
    } else if (url.includes('super-admin-dashboard')) {
      this.currentPageTitle = 'Dashboard Super Admin';
    } else if (url.includes('users')) {
      this.currentPageTitle = 'Gestion des utilisateurs';
    } else {
      this.currentPageTitle = 'Dashboard';
    }
  }
  getPageTitle(): string {
    return this.currentPageTitle;
  }

  logout(): void {
    this.router.navigate(['/login']);
  }

}
