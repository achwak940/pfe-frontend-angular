import { Component, OnInit, HostBinding, Renderer2, HostListener } from '@angular/core';
import { Router } from '@angular/router';

interface User {
  id?: number;
  nom: string;
  email: string;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';
  statut: 'actif' | 'inactif';
  department?: string;
  createdAt?: Date;
  initials?: string;
}

interface Notification {
  icon: string;
  message: string;
  time: string;
  read: boolean;
  type?: 'success' | 'warning' | 'info' | 'danger';
}

@Component({
  selector: 'app-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.css']
})
export class UsersManagementComponent implements OnInit {
  @HostBinding('class.dark-theme') isDarkTheme = false;

  // Propriétés du sidebar
  sidebarCollapsed = false;
  mobileMenuOpen = false;
  isMobile = window.innerWidth <= 768;

  // Utilisateur courant
  currentUser: User | null = null;
  profileImage: string = 'https://ui-avatars.com/api/?name=Super+Admin&background=9D50BB&color=fff&size=32';

  // États des dropdowns
  showNotifications = false;
  showProfileMenu = false;
  hasNotifications = true;

  // États des modals
  showAddModal = false;
  showEditModal = false;
  showDetailsModal = false;
  showConfirmModal = false;

  // Données des utilisateurs
  users: User[] = [
    { 
      id: 1,
      nom: 'Anya Malik', 
      email: 'anya.malik@email.com', 
      role: 'admin', 
      statut: 'actif',
      department: 'Marketing',
      createdAt: new Date('2024-01-15')
    },
    { 
      id: 2,
      nom: 'Ben Carter', 
      email: 'ben.carter@email.com', 
      role: 'admin', 
      statut: 'actif',
      department: 'IT',
      createdAt: new Date('2024-02-20')
    },
    { 
      id: 3,
      nom: 'Chloe Diaz', 
      email: 'chloe.diaz@email.com', 
      role: 'editor', 
      statut: 'actif',
      department: 'Design',
      createdAt: new Date('2024-03-10')
    },
    { 
      id: 4,
      nom: 'ABC', 
      email: 'abc@email.com', 
      role: 'viewer', 
      statut: 'inactif',
      department: 'Sales',
      createdAt: new Date('2024-01-05')
    },
    { 
      id: 5,
      nom: 'User Test', 
      email: 'user.test@email.com', 
      role: 'viewer', 
      statut: 'actif',
      department: 'Support',
      createdAt: new Date('2024-02-28')
    },
    { 
      id: 6,
      nom: 'Calplin Doe', 
      email: 'calplin.doe@email.com', 
      role: 'editor', 
      statut: 'inactif',
      department: 'HR',
      createdAt: new Date('2024-03-01')
    }
  ];

  // Données filtrées
  filteredUsers: User[] = [];
  
  // Filtres
  searchTerm: string = '';
  roleFilter: string = '';
  statusFilter: string = '';

  // Statistiques
  totalUsers: number = 0;
  activeUsers: number = 0;
  inactiveUsers: number = 0;
  adminCount: number = 0;
  newUsersThisMonth: number = 0;
  
  activePercentage: number = 0;
  inactivePercentage: number = 0;
  adminPercentage: number = 0;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 1;

  // Données pour les modals
  newUser: Partial<User> = {
    nom: '',
    email: '',
    role: 'viewer',
    statut: 'actif',
    department: ''
  };

  editingUser: User | null = null;
  selectedUser: User | null = null;
  confirmUser: User | null = null;
  confirmAction: 'block' | 'unblock' = 'block';

  // Notifications
  notifications: Notification[] = [
    {
      icon: 'fa-user-plus',
      message: 'Nouvel utilisateur inscrit',
      time: 'il y a 5 min',
      read: false,
      type: 'success'
    },
    {
      icon: 'fa-user-check',
      message: 'Anya Malik a été activé',
      time: 'il y a 15 min',
      read: false,
      type: 'info'
    },
    {
      icon: 'fa-user-edit',
      message: 'Rôle de Ben Carter modifié',
      time: 'il y a 1 heure',
      read: true,
      type: 'warning'
    },
    {
      icon: 'fa-user-lock',
      message: 'Compte de Chloe Diaz bloqué',
      time: 'il y a 2 heures',
      read: true,
      type: 'danger'
    }
  ];

  constructor(
    private router: Router,
    private renderer: Renderer2
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadThemePreference();
    this.calculateStats();
    this.filterUsers();
    this.checkUnreadNotifications();
  }

  /**
   * Vérifie la taille de l'écran pour le mode mobile
   */
  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.mobileMenuOpen = false;
    }
  }

  /**
   * Charge l'utilisateur courant
   */
  private loadCurrentUser(): void {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        if (this.currentUser?.nom) {
          this.profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.nom)}&background=9D50BB&color=fff&size=32`;
        }
      } else {
        this.currentUser = {
          id: 1,
          nom: 'Super Admin',
          email: 'admin@nebula.com',
          role: 'super_admin',
          statut: 'actif'
        };
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
    }
  }

  /**
   * Charge la préférence de thème
   */
  private loadThemePreference(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkTheme = savedTheme === 'dark';
    
    if (this.isDarkTheme) {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }
  }

  /**
   * Calcule les statistiques
   */
  private calculateStats(): void {
    this.totalUsers = this.users.length;
    this.activeUsers = this.users.filter(u => u.statut === 'actif').length;
    this.inactiveUsers = this.users.filter(u => u.statut === 'inactif').length;
    this.adminCount = this.users.filter(u => u.role === 'admin' || u.role === 'super_admin').length;
    
    this.activePercentage = this.totalUsers > 0 ? Math.round((this.activeUsers / this.totalUsers) * 100) : 0;
    this.inactivePercentage = this.totalUsers > 0 ? Math.round((this.inactiveUsers / this.totalUsers) * 100) : 0;
    this.adminPercentage = this.totalUsers > 0 ? Math.round((this.adminCount / this.totalUsers) * 100) : 0;
    
    // Calcul des nouveaux utilisateurs du mois
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.newUsersThisMonth = this.users.filter(u => u.createdAt && u.createdAt >= firstDayOfMonth).length;
  }

  /**
   * Vérifie les notifications non lues
   */
  private checkUnreadNotifications(): void {
    this.hasNotifications = this.notifications.some(n => !n.read);
  }

  /**
   * Bascule le thème
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
  }

  /**
   * Bascule la sidebar
   */
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  /**
   * Bascule le menu mobile
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (this.mobileMenuOpen) {
      this.showNotifications = false;
      this.showProfileMenu = false;
    }
  }

  /**
   * Ferme le menu mobile
   */
  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  /**
   * Bascule les notifications
   */
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showProfileMenu = false;
      this.mobileMenuOpen = false;
    }
  }

  /**
   * Ferme les notifications
   */
  closeNotifications(): void {
    this.showNotifications = false;
  }

  /**
   * Bascule le menu profil
   */
  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
    if (this.showProfileMenu) {
      this.showNotifications = false;
      this.mobileMenuOpen = false;
    }
  }

  /**
   * Ferme le menu profil
   */
  closeProfileMenu(): void {
    this.showProfileMenu = false;
  }

  /**
   * Ferme tous les modals
   */
  closeModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDetailsModal = false;
    this.showConfirmModal = false;
    this.editingUser = null;
    this.selectedUser = null;
    this.confirmUser = null;
  }

  /**
   * Recherche
   */
  onSearch(event: any): void {
    this.searchTerm = event.target.value;
    this.filterUsers();
  }

  /**
   * Filtre les utilisateurs
   */
  filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      // Filtre par recherche
      const matchesSearch = this.searchTerm === '' || 
        user.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Filtre par rôle
      const matchesRole = this.roleFilter === '' || user.role === this.roleFilter;

      // Filtre par statut
      const matchesStatus = this.statusFilter === '' || user.statut === this.statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });

    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  /**
   * Efface les filtres
   */
  clearFilters(): void {
    this.searchTerm = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.filterUsers();
  }

  /**
   * Vérifie si des filtres sont actifs
   */
  get hasActiveFilters(): boolean {
    return this.searchTerm !== '' || this.roleFilter !== '' || this.statusFilter !== '';
  }

  /**
   * Obtient les utilisateurs pour la page courante
   */
  getPaginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUsers.slice(startIndex, startIndex + this.itemsPerPage);
  }

  /**
   * Obtient les initiales d'un nom
   */
  getInitials(name: string): string {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  /**
   * Obtient une couleur d'avatar basée sur le nom
   */
 
  /**
   * Formate le rôle pour l'affichage
   */
  formatRole(role: string): string {
    const roles: { [key: string]: string } = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'editor': 'Éditeur',
      'viewer': 'Viewer'
    };
    return roles[role] || role;
  }

  /**
   * Obtient l'icône du rôle
   */
  getRoleIcon(role: string): string {
    const icons: { [key: string]: string } = {
      'super_admin': 'fa-crown',
      'admin': 'fa-shield-alt',
      'editor': 'fa-edit',
      'viewer': 'fa-eye'
    };
    return icons[role] || 'fa-user';
  }

  /**
   * Ouvre le modal d'ajout
   */
  openAddUserModal(): void {
    this.newUser = {
      nom: '',
      email: '',
      role: 'viewer',
      statut: 'actif',
      department: ''
    };
    this.showAddModal = true;
  }

  /**
   * Ouvre le modal d'édition
   */
  openEditUserModal(user: User): void {
    this.editingUser = { ...user };
    this.showEditModal = true;
  }

  /**
   * Ouvre le modal d'édition depuis les détails
   */
  openEditUserModalFromDetails(): void {
    if (this.selectedUser) {
      this.openEditUserModal(this.selectedUser);
      this.showDetailsModal = false;
    }
  }

  /**
   * Ouvre le modal de détails
   */
  viewUserDetails(user: User): void {
    this.selectedUser = user;
    this.showDetailsModal = true;
  }

  /**
   * Ouvre le modal de confirmation pour changer le statut
   */
  toggleUserStatus(user: User): void {
    this.confirmUser = user;
    this.confirmAction = user.statut === 'actif' ? 'block' : 'unblock';
    this.showConfirmModal = true;
  }

  /**
   * Confirme le changement de statut
   */
  confirmStatusChange(): void {
    if (this.confirmUser) {
      this.confirmUser.statut = this.confirmAction === 'block' ? 'inactif' : 'actif';
      this.calculateStats();
      this.filterUsers();
      this.closeModals();
    }
  }

  /**
   * Ajoute un utilisateur
   */
  addUser(): void {
    if (this.isValidUser()) {
      const newUser: User = {
        id: this.users.length + 1,
        nom: this.newUser.nom!,
        email: this.newUser.email!,
        role: this.newUser.role as any,
        statut: this.newUser.statut as any,
        department: this.newUser.department,
        createdAt: new Date()
      };
      
      this.users.push(newUser);
      this.calculateStats();
      this.filterUsers();
      this.closeModals();
    }
  }

  /**
   * Met à jour un utilisateur
   */
  updateUser(): void {
    if (this.editingUser && this.editingUser.id) {
      const index = this.users.findIndex(u => u.id === this.editingUser!.id);
      if (index !== -1) {
        this.users[index] = { ...this.editingUser };
        this.calculateStats();
        this.filterUsers();
        this.closeModals();
      }
    }
  }

  /**
   * Vérifie si l'utilisateur est valide
   */
  isValidUser(): boolean {
    return !!(this.newUser.nom && this.newUser.nom.trim() !== '' && 
              this.newUser.email && this.newUser.email.trim() !== '' &&
              this.newUser.email.includes('@'));
  }

  /**
   * Vérifie si l'utilisateur en édition est valide
   */
  isEditingUserValid(): boolean {
    return !!(this.editingUser && 
              this.editingUser.nom && this.editingUser.nom.trim() !== '' && 
              this.editingUser.email && this.editingUser.email.trim() !== '' &&
              this.editingUser.email.includes('@'));
  }

  /**
   * Change de page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Obtient les numéros de page pour la pagination
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(this.totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
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

  /**
   * Navigation
   */
  navigateTo(path: string): void {
    this.router.navigate([path]);
    this.showNotifications = false;
    this.showProfileMenu = false;
    this.mobileMenuOpen = false;
  }

  /**
   * Déconnexion
   */
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
  /**
 * Obtient une couleur d'avatar basée sur le nom avec dégradé light purple
 */
getAvatarColor(name: string): string {
  // Dégradés light purple
  const gradients = [
    'linear-gradient(135deg, #9D50BB, #b87fd6)',  // Purple principal
    'linear-gradient(135deg, #b87fd6, #d4b0ec)',  // Light purple
    'linear-gradient(135deg, #a879c9, #c7a0e3)',  // Medium purple
    'linear-gradient(135deg, #8e6ab3, #b896d9)',  // Violet doux
    'linear-gradient(135deg, #c49bdc, #e0c0f5)',  // Très light purple
    'linear-gradient(135deg, #9b7bba, #c2a4e0)',  // Purple grisé
    'linear-gradient(135deg, #b28ad9, #d9baf2)',  // Lavande
    'linear-gradient(135deg, #a56bc2, #caa0e8)'   // Purple medium
  ];
  
  // Calculer un index basé sur le nom pour avoir une couleur cohérente
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
  return gradients[index];
}
}