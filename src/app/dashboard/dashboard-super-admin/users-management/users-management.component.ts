import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StatistiqueUserTotalService, Utilisateur, ApiResponse } from '../statistique-user-total.service';

@Component({
  selector: 'app-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.css']
})
export class UsersManagementComponent implements OnInit, OnDestroy {
  Math = Math;
  
  // Données principales
  nombreUsersTotal: number = 0;
  nombreUsersTotalActifs: number = 0;
  nombreUsersTotalInActifs: number = 0;
  nombreAdmins: number = 0;
  users: Utilisateur[] = [];
  filteredUsers: Utilisateur[] = [];
  
  // Sélection
  selectedUsers: Set<number> = new Set();
  selectAll: boolean = false;
  
  // Filtres
  searchTerm: string = '';
  selectedRole: string = '';
  selectedStatus: string = '';
  selectedDepartment: string = '';
  selectedDate: string = '';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 1;
  
  // États
  loading: boolean = false;
  bulkActionInProgress: boolean = false;
  
  // Modals
  showViewModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedUser: Utilisateur | null = null;
  userToDelete: Utilisateur | null = null;
  
  // Messagerie - Variable séparée
  selectedUserForMessage: Utilisateur | null = null;
  
  // Formulaires
  editForm: FormGroup;
  deleteConfirmText: string = '';
  
  // Notifications
  notification: { type: string; message: string; show: boolean } = {
    type: 'success',
    message: '',
    show: false
  };
  
  private notificationTimeout: any;

  constructor(
    private service: StatistiqueUserTotalService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.pattern(/^[0-9+\-\s]{8,20}$/)]],
      role: ['', Validators.required],
      statut: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy(): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }

  // ========== CHARGEMENT DES DONNÉES ==========
  loadAllData(): void {
    this.loading = true;
    Promise.all([
      this.loadNombreTotalUsers(),
      this.loadNombreUsersActifs(),
      this.loadNombreUsersInactifs(),
      this.loadNombreAdmins(),
      this.loadAllUsers()
    ]).finally(() => {
      this.loading = false;
    });
  }

  private loadNombreTotalUsers(): Promise<void> {
    return new Promise((resolve) => {
      this.service.getNombreAllUsers().subscribe({
        next: (res) => { this.nombreUsersTotal = res.nombreUsersTotal; resolve(); },
        error: (err) => { console.error('Erreur total users:', err); resolve(); }
      });
    });
  }

  private loadNombreUsersActifs(): Promise<void> {
    return new Promise((resolve) => {
      this.service.getNombreAllUsersActifs().subscribe({
        next: (res) => { this.nombreUsersTotalActifs = res.NombreUsersActifs; resolve(); },
        error: (err) => { console.error('Erreur users actifs:', err); resolve(); }
      });
    });
  }

  private loadNombreUsersInactifs(): Promise<void> {
    return new Promise((resolve) => {
      this.service.getNombreAllUsersInactifs().subscribe({
        next: (res) => { this.nombreUsersTotalInActifs = res.NombreUsersInActifs; resolve(); },
        error: (err) => { console.error('Erreur users inactifs:', err); resolve(); }
      });
    });
  }

  private loadNombreAdmins(): Promise<void> {
    return new Promise((resolve) => {
      this.service.getNombreAllAdmins().subscribe({
        next: (res) => { this.nombreAdmins = res.NombreAdmins; resolve(); },
        error: (err) => { console.error('Erreur admins:', err); resolve(); }
      });
    });
  }

  private loadAllUsers(): Promise<void> {
    return new Promise((resolve) => {
      this.service.getAllUsers().subscribe({
        next: (users: Utilisateur[]) => {
          this.users = users.map(user => ({
            ...user,
            derniereConnexion: this.calculateLastLogin(user.date_creation),
            localisation: this.getRandomLocation(),
            activite: this.calculateActivityLevel(user),
            enquetesCount: 0,
            reponsesCount: 0
          }));
          this.applyFilters();
          
          this.users.forEach(user => {
            this.loadUserStats(user.id);
          });
          resolve();
        },
        error: (err) => {
          console.error('Erreur chargement users:', err);
          resolve();
        }
      });
    });
  }

  private loadUserStats(userId: number): void {
    this.service.getUserEnquetesCount(userId).subscribe({
      next: (count: number) => {
        const user = this.users.find(u => u.id === userId);
        if (user) { user.enquetesCount = count; }
      },
      error: (err) => console.error(`Erreur chargement stats user ${userId}:`, err)
    });
  }

  // ========== CALCULS ET HELPER ==========
  private calculateLastLogin(creationDate: Date | string): string {
    const created = new Date(creationDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) { return "Aujourd'hui"; }
    if (diffDays === 1) { return "Hier"; }
    if (diffDays < 7) { return `Il y a ${diffDays} jours`; }
    if (diffDays < 30) { return `Il y a ${Math.floor(diffDays / 7)} semaines`; }
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  }

  private calculateActivityLevel(user: Utilisateur): number {
    const created = new Date(user.date_creation);
    const now = new Date();
    const daysSinceCreation = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    let baseActivity = 50;
    if (user.statut === 'ACTIF') { baseActivity += 30; }
    if (user.est_verifie) { baseActivity += 20; }
    if (daysSinceCreation > 30) { baseActivity += 10; }
    if (daysSinceCreation > 90) { baseActivity += 10; }
    
    return Math.min(baseActivity, 100);
  }

  private getRandomLocation(): string {
    const locations = ['Paris, France', 'Lyon, France', 'Marseille, France', 
                       'Toulouse, France', 'Nice, France', 'Bordeaux, France'];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  // ========== FILTRES ==========
  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm || 
        user.prenom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      let matchesRole = true;
      if (this.selectedRole) {
        matchesRole = user.role === this.selectedRole;
      }
      
      let matchesStatus = true;
      if (this.selectedStatus) {
        matchesStatus = user.statut === this.selectedStatus;
      }
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    
    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updateSelectAllState();
  }

  onSearchChange(event: any): void {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  onRoleChange(event: any): void {
    this.selectedRole = event.target.value;
    this.applyFilters();
  }

  onStatusChange(event: any): void {
    this.selectedStatus = event.target.value;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.selectedDepartment = '';
    this.selectedDate = '';
    this.applyFilters();
  }

  // ========== PAGINATION ==========
  getPaginatedUsers(): Utilisateur[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredUsers.slice(start, end);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ========== SÉLECTION ==========
  toggleUserSelection(userId: number): void {
    if (this.selectedUsers.has(userId)) {
      this.selectedUsers.delete(userId);
    } else {
      this.selectedUsers.add(userId);
    }
    this.updateSelectAllState();
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.getPaginatedUsers().forEach(user => this.selectedUsers.add(user.id));
    } else {
      this.selectedUsers.clear();
    }
  }

  private updateSelectAllState(): void {
    const paginatedUsers = this.getPaginatedUsers();
    this.selectAll = paginatedUsers.length > 0 && 
                     paginatedUsers.every(user => this.selectedUsers.has(user.id));
  }

  // ========== MODAL - VIEW ==========
  viewUser(userId: number): void {
    this.loading = true;
    this.service.getUserById(userId).subscribe({
      next: (user: Utilisateur) => {
        this.selectedUser = user;
        this.showViewModal = true;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement utilisateur:', err);
        this.showNotification('error', 'Erreur lors du chargement des détails');
        this.loading = false;
      }
    });
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedUser = null;
  }

  // ========== MODAL - EDIT ==========
  editUser(userId: number): void {
    this.loading = true;
    this.service.getUserById(userId).subscribe({
      next: (user: Utilisateur) => {
        this.selectedUser = user;
        this.editForm.patchValue({
          prenom: user.prenom,
          nom: user.nom,
          email: user.email,
          telephone: user.telephone || '',
          role: user.role,
          statut: user.statut
        });
        this.showEditModal = true;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement utilisateur:', err);
        this.showNotification('error', 'Erreur lors du chargement des données');
        this.loading = false;
      }
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedUser = null;
    this.editForm.reset();
  }

  onSubmitEdit(): void {
    if (this.editForm.invalid || !this.selectedUser) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const updatedData = this.editForm.value;
    
    this.service.updateUser(this.selectedUser.id, updatedData).subscribe({
      next: (response: ApiResponse) => {
        const index = this.users.findIndex(u => u.id === this.selectedUser!.id);
        if (index !== -1) {
          this.users[index] = { ...this.users[index], ...updatedData };
        }
        this.applyFilters();
        this.closeEditModal();
        this.showNotification('success', response.message || 'Utilisateur modifié avec succès');
        this.loadNombreTotalUsers();
        this.loadNombreUsersActifs();
        this.loadNombreUsersInactifs();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur modification:', err);
        this.showNotification('error', 'Erreur lors de la modification');
        this.loading = false;
      }
    });
  }

  // ========== MODAL - DELETE ==========
  openDeleteModal(user: Utilisateur): void {
    this.userToDelete = user;
    this.deleteConfirmText = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
    this.deleteConfirmText = '';
  }

  confirmDelete(): void {
    if (!this.userToDelete || this.deleteConfirmText !== 'SUPPRIMER') {
      this.showNotification('error', 'Veuillez taper SUPPRIMER pour confirmer');
      return;
    }

    this.loading = true;
    this.service.deleteUser(this.userToDelete.id).subscribe({
      next: (response: ApiResponse) => {
        this.users = this.users.filter(u => u.id !== this.userToDelete!.id);
        this.selectedUsers.delete(this.userToDelete!.id);
        this.applyFilters();
        this.closeDeleteModal();
        this.showNotification('success', response.message || 'Utilisateur supprimé avec succès');
        this.loadNombreTotalUsers();
        this.loadNombreUsersActifs();
        this.loadNombreUsersInactifs();
        this.loadNombreAdmins();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        this.loading = false;
        this.showNotification('error', 'Erreur lors de la suppression');
      }
    });
  }

  // ========== MESSAGERIE ==========
  openMessaging(user: Utilisateur): void {
    this.selectedUserForMessage = user;
  }

  closeMessenger(): void {
    this.selectedUserForMessage = null;
  }

  // ========== ACTIONS RAPIDES ==========
  blockUser(userId: number): void {
    if (confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) {
      this.loading = true;
      this.service.updateUserStatus(userId, 'INACTIF').subscribe({
        next: () => {
          const user = this.users.find(u => u.id === userId);
          if (user) {
            user.statut = 'INACTIF';
            user.activite = this.calculateActivityLevel(user);
          }
          this.applyFilters();
          this.showNotification('success', 'Utilisateur désactivé avec succès');
          this.loadNombreUsersActifs();
          this.loadNombreUsersInactifs();
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur blocage:', err);
          this.showNotification('error', 'Erreur lors de la désactivation');
          this.loading = false;
        }
      });
    }
  }

  activateUser(userId: number): void {
    this.loading = true;
    this.service.updateUserStatus(userId, 'ACTIF').subscribe({
      next: () => {
        const user = this.users.find(u => u.id === userId);
        if (user) {
          user.statut = 'ACTIF';
          user.activite = this.calculateActivityLevel(user);
        }
        this.applyFilters();
        this.showNotification('success', 'Utilisateur activé avec succès');
        this.loadNombreUsersActifs();
        this.loadNombreUsersInactifs();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur activation:', err);
        this.showNotification('error', 'Erreur lors de l\'activation');
        this.loading = false;
      }
    });
  }

  changeRole(userId: number, newRole: string): void {
    this.loading = true;
    this.service.updateUserRole(userId, newRole).subscribe({
      next: () => {
        const user = this.users.find(u => u.id === userId);
        if (user) { user.role = newRole; }
        this.applyFilters();
        this.showNotification('success', `Rôle changé en ${newRole}`);
        this.loadNombreAdmins();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur changement rôle:', err);
        this.showNotification('error', 'Erreur lors du changement de rôle');
        this.loading = false;
      }
    });
  }

  // ========== ACTIONS GROUPÉES ==========
  bulkDelete(): void {
    const count = this.selectedUsers.size;
    if (confirm(`Supprimer définitivement ${count} utilisateur(s) ? Cette action est irréversible.`)) {
      this.bulkActionInProgress = true;
      const promises = Array.from(this.selectedUsers).map(id => 
        this.service.deleteUser(id).toPromise()
      );
      
      Promise.all(promises).then(() => {
        this.users = this.users.filter(u => !this.selectedUsers.has(u.id));
        this.selectedUsers.clear();
        this.selectAll = false;
        this.applyFilters();
        this.showNotification('success', `${count} utilisateur(s) supprimés`);
        this.loadNombreTotalUsers();
        this.loadNombreUsersActifs();
        this.loadNombreUsersInactifs();
        this.loadNombreAdmins();
        this.bulkActionInProgress = false;
      }).catch(err => {
        console.error('Erreur suppression groupée:', err);
        this.showNotification('error', 'Erreur lors de la suppression groupée');
        this.bulkActionInProgress = false;
      });
    }
  }

  bulkChangeRole(newRole: string): void {
    const count = this.selectedUsers.size;
    if (confirm(`Changer le rôle de ${count} utilisateur(s) vers ${newRole} ?`)) {
      this.bulkActionInProgress = true;
      const promises = Array.from(this.selectedUsers).map(id => 
        this.service.updateUserRole(id, newRole).toPromise()
      );
      
      Promise.all(promises).then(() => {
        this.users.forEach(user => {
          if (this.selectedUsers.has(user.id)) {
            user.role = newRole;
          }
        });
        this.applyFilters();
        this.showNotification('success', `Rôle changé pour ${count} utilisateur(s)`);
        this.loadNombreAdmins();
        this.bulkActionInProgress = false;
      }).catch(err => {
        console.error('Erreur changement rôle groupé:', err);
        this.showNotification('error', 'Erreur lors du changement de rôle');
        this.bulkActionInProgress = false;
      });
    }
  }

  bulkActivate(): void {
    const count = this.selectedUsers.size;
    if (confirm(`Activer ${count} utilisateur(s) ?`)) {
      this.bulkActionInProgress = true;
      const promises = Array.from(this.selectedUsers).map(id => 
        this.service.updateUserStatus(id, 'ACTIF').toPromise()
      );
      
      Promise.all(promises).then(() => {
        this.users.forEach(user => {
          if (this.selectedUsers.has(user.id)) {
            user.statut = 'ACTIF';
          }
        });
        this.applyFilters();
        this.showNotification('success', `${count} utilisateur(s) activés`);
        this.loadNombreUsersActifs();
        this.loadNombreUsersInactifs();
        this.bulkActionInProgress = false;
      }).catch(err => {
        console.error('Erreur activation groupée:', err);
        this.showNotification('error', 'Erreur lors de l\'activation');
        this.bulkActionInProgress = false;
      });
    }
  }

  bulkDeactivate(): void {
    const count = this.selectedUsers.size;
    if (confirm(`Désactiver ${count} utilisateur(s) ?`)) {
      this.bulkActionInProgress = true;
      const promises = Array.from(this.selectedUsers).map(id => 
        this.service.updateUserStatus(id, 'INACTIF').toPromise()
      );
      
      Promise.all(promises).then(() => {
        this.users.forEach(user => {
          if (this.selectedUsers.has(user.id)) {
            user.statut = 'INACTIF';
          }
        });
        this.applyFilters();
        this.showNotification('success', `${count} utilisateur(s) désactivés`);
        this.loadNombreUsersActifs();
        this.loadNombreUsersInactifs();
        this.bulkActionInProgress = false;
      }).catch(err => {
        console.error('Erreur désactivation groupée:', err);
        this.showNotification('error', 'Erreur lors de la désactivation');
        this.bulkActionInProgress = false;
      });
    }
  }

  // ========== EXPORTS ==========
  exportCSV(): void {
    this.loading = true;
    this.service.exportUsersToCSV().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showNotification('success', 'Export CSV réussi');
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur export CSV:', err);
        this.showNotification('error', 'Erreur lors de l\'export CSV');
        this.loading = false;
      }
    });
  }

  exportExcel(): void {
    this.loading = true;
    this.service.exportUsersToExcel().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showNotification('success', 'Export Excel réussi');
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur export Excel:', err);
        this.showNotification('error', 'Erreur lors de l\'export Excel');
        this.loading = false;
      }
    });
  }

  exportPDF(): void {
    this.loading = true;
    this.service.exportUsersToPDF().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.showNotification('success', 'Export PDF réussi');
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur export PDF:', err);
        this.showNotification('error', 'Erreur lors de l\'export PDF');
        this.loading = false;
      }
    });
  }

  printUsers(): void {
    window.print();
  }

  // ========== NOTIFICATIONS ==========
  private showNotification(type: string, message: string): void {
    this.notification = { type, message, show: true };
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    this.notificationTimeout = setTimeout(() => {
      this.notification.show = false;
    }, 4000);
  }

  closeNotification(): void {
    this.notification.show = false;
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }

  // ========== UTILITAIRES ==========
  getRoleIcon(role: string): string {
    const icons: { [key: string]: string } = {
      'ADMIN': 'fa-user-shield',
      'USER_CONNECTE': 'fa-user',
      'SUPER_ADMIN': 'fa-crown'
    };
    return icons[role] || 'fa-user';
  }

  getStatusClass(statut: string): string {
    return statut === 'ACTIF' ? 'status-active' : 'status-inactive';
  }

  getImageUrl(photoProfil: string): string {
    if (photoProfil && photoProfil !== 'default' && photoProfil !== '') {
      return `http://localhost:3000/${photoProfil}`;
    }
    return '';
  }

  onImageError(user: any): void {
    user.photo_profil = '';
  }

  getUniqueRoles(): string[] {
    return [...new Set(this.users.map(u => u.role))];
  }
  
}