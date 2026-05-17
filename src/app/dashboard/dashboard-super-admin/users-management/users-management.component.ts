// users-management.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  StatistiqueUserTotalService,
  Utilisateur,
  ApiResponse,
  RoleObject,
} from '../statistique-user-total.service';

@Component({
  selector: 'app-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.css'],
})
export class UsersManagementComponent implements OnInit, OnDestroy {
  Math = Math;

  // ── Données ────────────────────────────────────────────────────────
  nombreUsersTotal: number = 0;
  nombreUsersTotalActifs: number = 0;
  nombreUsersTotalInActifs: number = 0;
  nombreAdmins: number = 0;
  users: Utilisateur[] = [];
  filteredUsers: Utilisateur[] = [];
  availableRoles: string[] = [];
  allRoles: string[] = [];

  // ── Sélection ──────────────────────────────────────────────────────
  selectedUsers: Set<number> = new Set();
  selectAll: boolean = false;

  // ── Filtres ────────────────────────────────────────────────────────
  searchTerm: string = '';
  selectedRole: string = '';
  selectedStatus: string = '';
  selectedDepartment: string = '';
  selectedDate: string = '';
  activeQuickFilter: string = 'all';

  // ── Pagination ─────────────────────────────────────────────────────
  currentPage: number = 1;
  itemsPerPage: number = 9;
  totalPages: number = 1;

  // ── États ──────────────────────────────────────────────────────────
  loading: boolean = false;
  bulkActionInProgress: boolean = false;

  // ── Modals ─────────────────────────────────────────────────────────
  showViewModal: boolean = false;
  showEditModal: boolean = false;
  showDeleteModal: boolean = false;
  showAddModal: boolean = false;
  selectedUser: Utilisateur | null = null;
  userToDelete: Utilisateur | null = null;
  selectedUserForMessage: Utilisateur | null = null;

  // ── Formulaires ────────────────────────────────────────────────────
  editForm: FormGroup;
  addForm: FormGroup;
  deleteConfirmText: string = '';

  // ── Upload photo ───────────────────────────────────────────────────
  selectedPhotoFile: File | null = null;
  removePhotoFlag: boolean = false;
  addPhotoFile: File | null = null;

  // ── Notifications ──────────────────────────────────────────────────
  notification: { type: string; message: string; show: boolean } = {
    type: 'success',
    message: '',
    show: false,
  };
  private notificationTimeout: any;

  // ── Couleurs avatars ───────────────────────────────────────────────
  private avatarColors = [
    'av-violet', 'av-teal', 'av-rose', 'av-amber', 'av-sky', 'av-green',
  ];

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
      statut: ['', Validators.required],
    });

    this.addForm = this.fb.group({
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.pattern(/^[0-9+\-\s]{8,20}$/)]],
      mot_de_passe: ['', [Validators.required, Validators.minLength(8)]],
      role: ['USER_CONNECTE', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadAllData();
    this.loadAllRoles();
  }

  private loadAllRoles(): void {
    this.service.getAllRoles().subscribe({
      next: (roles: RoleObject[]) => {
        this.allRoles = roles.map((role) => role.nom);
      },
      error: () => {
        this.allRoles = this.availableRoles;
      },
    });
  }

  ngOnDestroy(): void {
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
  }

  // ════════════════════════════════════════════════════════════════
  // HELPERS ROLE & IMAGE
  // ════════════════════════════════════════════════════════════════

  getRoleNom(role: RoleObject | string | null | undefined): string {
    return this.service.getRoleNom(role);
  }

  hasValidImage(photoProfil: string | null | undefined): boolean {
    return !!(photoProfil && photoProfil.trim() !== '' && photoProfil !== 'default');
  }

  getImageUrl(photoProfil: string | null | undefined): string {
    return this.service.buildImageUrl(photoProfil);
  }

  onImageError(event: Event, user: Utilisateur): void {
    (event.target as HTMLImageElement).style.display = 'none';
    user.photo_profil = '';
  }

  getRoleIcon(role: RoleObject | string | null): string {
    const nom = this.getRoleNom(role);
    const icons: { [key: string]: string } = {
      ADMIN: 'fa-user-shield',
      USER_CONNECTE: 'fa-user',
      SUPER_ADMIN: 'fa-crown',
    };
    return icons[nom] || 'fa-user';
  }

  getRoleLabel(role: RoleObject | string | null): string {
    const nom = this.getRoleNom(role);
    const labels: { [key: string]: string } = {
      ADMIN: '⬡ Admin',
      USER_CONNECTE: '◎ Utilisateur',
      SUPER_ADMIN: '✦ Super Admin',
    };
    return labels[nom] || nom;
  }

  getRoleClass(role: RoleObject | string | null): string {
    const nom = this.getRoleNom(role);
    const classes: { [key: string]: string } = {
      ADMIN: 'role-admin',
      USER_CONNECTE: 'role-user',
      SUPER_ADMIN: 'role-super',
    };
    return classes[nom] || 'role-user';
  }

  getAvatarClass(user: Utilisateur): string {
    const idx = user.id % this.avatarColors.length;
    return this.avatarColors[idx];
  }

  getInitials(user: Utilisateur): string {
    const p = user.prenom?.charAt(0)?.toUpperCase() || '';
    const n = user.nom?.charAt(0)?.toUpperCase() || '';
    return p + n;
  }

  getStatusClass(statut: string): string {
    return statut === 'ACTIF' ? 'status-active' : 'status-inactive';
  }

  getUniqueRoles(): string[] {
    return this.availableRoles;
  }

  // ════════════════════════════════════════════════════════════════
  // CHARGEMENT
  // ════════════════════════════════════════════════════════════════

  loadAllData(): void {
    this.loading = true;
    Promise.all([
      this.loadNombreTotalUsers(),
      this.loadNombreUsersActifs(),
      this.loadNombreUsersInactifs(),
      this.loadNombreAdmins(),
      this.loadAllUsers(),
    ]).finally(() => {
      this.loading = false;
    });
  }

  private loadNombreTotalUsers(): Promise<void> {
    return new Promise((resolve) => {
      this.service.getNombreAllUsers().subscribe({
        next: (res) => { this.nombreUsersTotal = res.nombreUsersTotal; resolve(); },
        error: () => resolve(),
      });
    });
  }

  private loadNombreUsersActifs(): Promise<void> {
    return new Promise((resolve) => {
      this.service.getNombreAllUsersActifs().subscribe({
        next: (res) => { this.nombreUsersTotalActifs = res.NombreUsersActifs; resolve(); },
        error: () => resolve(),
      });
    });
  }

  private loadNombreUsersInactifs(): Promise<void> {
    return new Promise((resolve) => {
      this.service.getNombreAllUsersInactifs().subscribe({
        next: (res) => { this.nombreUsersTotalInActifs = res.NombreUsersInActifs; resolve(); },
        error: () => resolve(),
      });
    });
  }

  private loadNombreAdmins(): Promise<void> {
    return new Promise((resolve) => {
      this.service.getNombreAllAdmins().subscribe({
        next: (res) => { this.nombreAdmins = res.NombreAdmins; resolve(); },
        error: () => resolve(),
      });
    });
  }

  private loadAllUsers(): Promise<void> {
    return new Promise((resolve) => {
      this.service.getAllUsers().subscribe({
        next: (users: Utilisateur[]) => {
          this.users = users.map((user) => ({
            ...user,
            derniereConnexion: this.calculateLastLogin(user.date_creation),
            localisation: this.getRandomLocation(),
            activite: this.calculateActivityLevel(user),
            enquetesCount: 0,
            reponsesCount: 0,
          }));

          const rolesSet = new Set<string>();
          this.users.forEach((u) => {
            const nom = this.getRoleNom(u.role);
            if (nom) rolesSet.add(nom);
          });
          this.availableRoles = Array.from(rolesSet);
          this.applyFilters();
          this.users.forEach((user) => this.loadUserStats(user.id));
          resolve();
        },
        error: (err) => {
          console.error('Erreur chargement users:', err);
          resolve();
        },
      });
    });
  }

  private loadUserStats(userId: number): void {
    this.service.getUserEnquetesCount(userId).subscribe({
      next: (count: number) => {
        const user = this.users.find((u) => u.id === userId);
        if (user) user.enquetesCount = count;
      },
      error: () => {},
    });
  }

  // ════════════════════════════════════════════════════════════════
  // CALCULS
  // ════════════════════════════════════════════════════════════════

  private calculateLastLogin(creationDate: Date | string): string {
    const created = new Date(creationDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  }

  private calculateActivityLevel(user: Utilisateur): number {
    const days = Math.floor(
      (new Date().getTime() - new Date(user.date_creation).getTime()) / (1000 * 60 * 60 * 24)
    );
    let base = 30;
    if (user.statut === 'ACTIF') base += 30;
    if (user.est_verifie) base += 20;
    if (days > 30) base += 10;
    if (days > 90) base += 10;
    return Math.min(base, 100);
  }

  private getRandomLocation(): string {
    const locs = [
      'Paris, France', 'Lyon, France', 'Marseille, France',
      'Toulouse, France', 'Nice, France', 'Bordeaux, France',
    ];
    return locs[Math.floor(Math.random() * locs.length)];
  }

  // ════════════════════════════════════════════════════════════════
  // FILTRES
  // ════════════════════════════════════════════════════════════════

  applyFilters(): void {
    this.filteredUsers = this.users.filter((user) => {
      const matchesSearch =
        !this.searchTerm ||
        user.prenom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const userRoleNom = this.getRoleNom(user.role);
      const matchesRole = !this.selectedRole || userRoleNom === this.selectedRole;
      const matchesStatus = !this.selectedStatus || user.statut === this.selectedStatus;

      // Quick filter
      let matchesQuick = true;
      if (this.activeQuickFilter === 'actif') matchesQuick = user.statut === 'ACTIF';
      else if (this.activeQuickFilter === 'inactif') matchesQuick = user.statut === 'INACTIF';
      else if (this.activeQuickFilter === 'admin')
        matchesQuick = userRoleNom === 'ADMIN' || userRoleNom === 'SUPER_ADMIN';

      return matchesSearch && matchesRole && matchesStatus && matchesQuick;
    });

    this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updateSelectAllState();
  }

  setQuickFilter(filter: string): void {
    this.activeQuickFilter = filter;
    this.applyFilters();
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
    this.activeQuickFilter = 'all';
    this.applyFilters();
  }

  // ════════════════════════════════════════════════════════════════
  // PAGINATION
  // ════════════════════════════════════════════════════════════════

  getPaginatedUsers(): Utilisateur[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUsers.slice(start, start + this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  // ════════════════════════════════════════════════════════════════
  // SÉLECTION
  // ════════════════════════════════════════════════════════════════

  toggleUserSelection(userId: number): void {
    this.selectedUsers.has(userId)
      ? this.selectedUsers.delete(userId)
      : this.selectedUsers.add(userId);
    this.updateSelectAllState();
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.getPaginatedUsers().forEach((u) => this.selectedUsers.add(u.id));
    } else {
      this.selectedUsers.clear();
    }
  }

  private updateSelectAllState(): void {
    const paginated = this.getPaginatedUsers();
    this.selectAll =
      paginated.length > 0 && paginated.every((u) => this.selectedUsers.has(u.id));
  }

  // ════════════════════════════════════════════════════════════════
  // MODAL VIEW
  // ════════════════════════════════════════════════════════════════

  viewUser(userId: number): void {
    this.loading = true;
    this.service.getUserById(userId).subscribe({
      next: (user: Utilisateur) => {
        this.selectedUser = user;
        this.showViewModal = true;
        this.loading = false;
      },
      error: () => {
        this.showNotification('error', 'Erreur lors du chargement des détails');
        this.loading = false;
      },
    });
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedUser = null;
  }

  // ════════════════════════════════════════════════════════════════
  // MODAL EDIT
  // ════════════════════════════════════════════════════════════════

  editUser(userId: number): void {
    this.loading = true;
    this.service.getUserById(userId).subscribe({
      next: (user: Utilisateur) => {
        this.selectedUser = user;
        const roleNom = this.getRoleNom(user.role);
        this.editForm.patchValue({
          prenom: user.prenom,
          nom: user.nom,
          email: user.email,
          telephone: user.telephone || '',
          role: roleNom,
          statut: user.statut,
        });
        this.selectedPhotoFile = null;
        this.removePhotoFlag = false;
        this.showEditModal = true;
        this.loading = false;
      },
      error: () => {
        this.showNotification('error', 'Erreur lors du chargement des données');
        this.loading = false;
      },
    });
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedUser = null;
    this.editForm.reset();
    this.selectedPhotoFile = null;
    this.removePhotoFlag = false;
  }

  onPhotoSelected(event: any): void {
    this.selectedPhotoFile = event.target.files[0];
    this.removePhotoFlag = false;
  }

  removePhoto(): void {
    this.removePhotoFlag = true;
    this.selectedPhotoFile = null;
  }

  onSubmitEdit(): void {
    if (this.editForm.invalid || !this.selectedUser) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.editForm.value;
    const userId = this.selectedUser.id;
    const currentRoleNom = this.getRoleNom(this.selectedUser.role);
    const currentStatut = this.selectedUser.statut;
    const hasPhotoAction = this.selectedPhotoFile !== null || this.removePhotoFlag;

    if (hasPhotoAction) {
      const formData = new FormData();
      formData.append('prenom', formValue.prenom);
      formData.append('nom', formValue.nom);
      formData.append('email', formValue.email);
      if (formValue.telephone) formData.append('telephone', formValue.telephone);
      if (this.selectedPhotoFile) formData.append('photo_profil', this.selectedPhotoFile);
      if (this.removePhotoFlag) formData.append('remove_photo', 'true');

      this.service.updateUserWithPhoto(userId, formData).subscribe({
        next: () => {
          this.handleRoleAndStatusUpdate(userId, formValue, currentRoleNom, currentStatut);
        },
        error: () => {
          this.showNotification('error', 'Erreur lors de la mise à jour avec photo');
          this.loading = false;
        },
      });
    } else {
      const updateData = {
        prenom: formValue.prenom,
        nom: formValue.nom,
        email: formValue.email,
        telephone: formValue.telephone || undefined,
      };
      this.service.updateUser(userId, updateData).subscribe({
        next: (_res: ApiResponse) => {
          this.handleRoleAndStatusUpdate(userId, formValue, currentRoleNom, currentStatut);
        },
        error: () => {
          this.showNotification('error', 'Erreur lors de la modification');
          this.loading = false;
        },
      });
    }
  }

  private handleRoleAndStatusUpdate(
    userId: number, formValue: any, currentRoleNom: string, currentStatut: string
  ): void {
    const roleChanged = formValue.role && formValue.role !== currentRoleNom;
    const statutChanged = formValue.statut && formValue.statut !== currentStatut;

    const updateRole$ = roleChanged
      ? this.service.updateUserRole(userId, formValue.role).toPromise()
      : Promise.resolve(null);

    const updateStatut$ = statutChanged
      ? this.service.updateUserStatus(userId, formValue.statut).toPromise()
      : Promise.resolve(null);

    Promise.all([updateRole$, updateStatut$])
      .then(() => {
        const index = this.users.findIndex((u) => u.id === userId);
        if (index !== -1) {
          this.users[index] = {
            ...this.users[index],
            prenom: formValue.prenom,
            nom: formValue.nom,
            email: formValue.email,
            telephone: formValue.telephone,
            role: formValue.role,
            statut: formValue.statut,
          };
        }
        this.applyFilters();
        this.closeEditModal();
        this.showNotification('success', 'Utilisateur modifié avec succès');
        this.loadNombreUsersActifs();
        this.loadNombreUsersInactifs();
        this.loadNombreAdmins();
        this.loading = false;
      })
      .catch(() => {
        this.showNotification('error', 'Erreur partielle lors de la modification');
        this.loading = false;
      });
  }

  // ════════════════════════════════════════════════════════════════
  // MODAL DELETE
  // ════════════════════════════════════════════════════════════════

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
        this.users = this.users.filter((u) => u.id !== this.userToDelete!.id);
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
      error: () => {
        this.showNotification('error', 'Erreur lors de la suppression');
        this.loading = false;
      },
    });
  }

  // ════════════════════════════════════════════════════════════════
  // ADD USER
  // ════════════════════════════════════════════════════════════════

  openAddModal(): void {
    this.addForm.reset({ role: 'USER_CONNECTE' });
    this.addPhotoFile = null;
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.addForm.reset();
    this.addPhotoFile = null;
  }

  onAddPhotoSelected(event: any): void {
    this.addPhotoFile = event.target.files[0];
  }

  onSubmitAdd(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formData = new FormData();
    const formValue = this.addForm.value;
    formData.append('prenom', formValue.prenom);
    formData.append('nom', formValue.nom);
    formData.append('email', formValue.email);
    if (formValue.telephone) formData.append('telephone', formValue.telephone);
    formData.append('mot_de_passe', formValue.mot_de_passe);
    formData.append('role', formValue.role);
    if (this.addPhotoFile) formData.append('photo_profil', this.addPhotoFile);

    this.service.createUser(formData).subscribe({
      next: () => {
        this.showNotification('success', 'Utilisateur créé avec succès');
        this.loadAllData();
        this.closeAddModal();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.showNotification('error', "Erreur lors de la création de l'utilisateur");
        this.loading = false;
      },
    });
  }

  // ════════════════════════════════════════════════════════════════
  // MESSAGERIE
  // ════════════════════════════════════════════════════════════════

  openMessaging(user: Utilisateur): void {
    this.selectedUserForMessage = user;
  }

  closeMessenger(): void {
    this.selectedUserForMessage = null;
  }

  // ════════════════════════════════════════════════════════════════
  // ACTIONS RAPIDES
  // ════════════════════════════════════════════════════════════════

  blockUser(userId: number): void {
    if (!confirm('Désactiver cet utilisateur ?')) return;
    this.loading = true;
    this.service.updateUserStatus(userId, 'INACTIF').subscribe({
      next: () => {
        const user = this.users.find((u) => u.id === userId);
        if (user) { user.statut = 'INACTIF'; user.activite = this.calculateActivityLevel(user); }
        this.applyFilters();
        this.showNotification('success', 'Utilisateur désactivé');
        this.loadNombreUsersActifs();
        this.loadNombreUsersInactifs();
        this.loading = false;
      },
      error: () => {
        this.showNotification('error', 'Erreur lors de la désactivation');
        this.loading = false;
      },
    });
  }

  activateUser(userId: number): void {
    this.loading = true;
    this.service.updateUserStatus(userId, 'ACTIF').subscribe({
      next: () => {
        const user = this.users.find((u) => u.id === userId);
        if (user) { user.statut = 'ACTIF'; user.activite = this.calculateActivityLevel(user); }
        this.applyFilters();
        this.showNotification('success', 'Utilisateur activé');
        this.loadNombreUsersActifs();
        this.loadNombreUsersInactifs();
        this.loading = false;
      },
      error: () => {
        this.showNotification('error', "Erreur lors de l'activation");
        this.loading = false;
      },
    });
  }

  changeRole(userId: number, newRole: string): void {
    this.loading = true;
    this.service.updateUserRole(userId, newRole).subscribe({
      next: () => {
        const user = this.users.find((u) => u.id === userId);
        if (user) user.role = newRole;
        this.applyFilters();
        this.showNotification('success', `Rôle changé en ${newRole}`);
        this.loadNombreAdmins();
        this.loading = false;
      },
      error: () => {
        this.showNotification('error', 'Erreur lors du changement de rôle');
        this.loading = false;
      },
    });
  }

  // ════════════════════════════════════════════════════════════════
  // ACTIONS GROUPÉES
  // ════════════════════════════════════════════════════════════════

  bulkDelete(): void {
    const count = this.selectedUsers.size;
    if (!confirm(`Supprimer ${count} utilisateur(s) définitivement ?`)) return;
    this.bulkActionInProgress = true;
    Promise.all(Array.from(this.selectedUsers).map((id) => this.service.deleteUser(id).toPromise()))
      .then(() => {
        this.users = this.users.filter((u) => !this.selectedUsers.has(u.id));
        this.selectedUsers.clear();
        this.selectAll = false;
        this.applyFilters();
        this.showNotification('success', `${count} utilisateur(s) supprimés`);
        this.loadNombreTotalUsers();
        this.loadNombreUsersActifs();
        this.loadNombreUsersInactifs();
        this.loadNombreAdmins();
        this.bulkActionInProgress = false;
      })
      .catch(() => {
        this.showNotification('error', 'Erreur lors de la suppression groupée');
        this.bulkActionInProgress = false;
      });
  }

  bulkChangeRole(newRole: string): void {
    const count = this.selectedUsers.size;
    if (!confirm(`Changer le rôle de ${count} utilisateur(s) vers ${newRole} ?`)) return;
    this.bulkActionInProgress = true;
    Promise.all(Array.from(this.selectedUsers).map((id) => this.service.updateUserRole(id, newRole).toPromise()))
      .then(() => {
        this.users.forEach((u) => { if (this.selectedUsers.has(u.id)) u.role = newRole; });
        this.applyFilters();
        this.showNotification('success', `Rôle changé pour ${count} utilisateur(s)`);
        this.loadNombreAdmins();
        this.bulkActionInProgress = false;
      })
      .catch(() => {
        this.showNotification('error', 'Erreur lors du changement de rôle');
        this.bulkActionInProgress = false;
      });
  }

  bulkActivate(): void {
    const count = this.selectedUsers.size;
    if (!confirm(`Activer ${count} utilisateur(s) ?`)) return;
    this.bulkActionInProgress = true;
    Promise.all(Array.from(this.selectedUsers).map((id) => this.service.updateUserStatus(id, 'ACTIF').toPromise()))
      .then(() => {
        this.users.forEach((u) => { if (this.selectedUsers.has(u.id)) u.statut = 'ACTIF'; });
        this.applyFilters();
        this.showNotification('success', `${count} utilisateur(s) activés`);
        this.loadNombreUsersActifs();
        this.loadNombreUsersInactifs();
        this.bulkActionInProgress = false;
      })
      .catch(() => {
        this.showNotification('error', "Erreur lors de l'activation");
        this.bulkActionInProgress = false;
      });
  }

  bulkDeactivate(): void {
    const count = this.selectedUsers.size;
    if (!confirm(`Désactiver ${count} utilisateur(s) ?`)) return;
    this.bulkActionInProgress = true;
    Promise.all(Array.from(this.selectedUsers).map((id) => this.service.updateUserStatus(id, 'INACTIF').toPromise()))
      .then(() => {
        this.users.forEach((u) => { if (this.selectedUsers.has(u.id)) u.statut = 'INACTIF'; });
        this.applyFilters();
        this.showNotification('success', `${count} utilisateur(s) désactivés`);
        this.loadNombreUsersActifs();
        this.loadNombreUsersInactifs();
        this.bulkActionInProgress = false;
      })
      .catch(() => {
        this.showNotification('error', 'Erreur lors de la désactivation');
        this.bulkActionInProgress = false;
      });
  }

  // ════════════════════════════════════════════════════════════════
  // EXPORTS
  // ════════════════════════════════════════════════════════════════

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  exportCSV(): void {
    this.loading = true;
    this.service.exportUsersToCSV().subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `utilisateurs_${this.getDateStr()}.csv`);
        this.showNotification('success', 'Export CSV réussi');
        this.loading = false;
      },
      error: () => {
        this.showNotification('error', "Erreur lors de l'export CSV");
        this.loading = false;
      },
    });
  }

  exportExcel(): void {
    this.loading = true;
    this.service.exportUsersToExcel().subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `utilisateurs_${this.getDateStr()}.xlsx`);
        this.showNotification('success', 'Export Excel réussi');
        this.loading = false;
      },
      error: () => {
        this.showNotification('error', "Erreur lors de l'export Excel");
        this.loading = false;
      },
    });
  }

  exportPDF(): void {
    this.loading = true;
    this.service.exportUsersToPDF().subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `utilisateurs_${this.getDateStr()}.pdf`);
        this.showNotification('success', 'Export PDF réussi');
        this.loading = false;
      },
      error: () => {
        this.showNotification('error', "Erreur lors de l'export PDF");
        this.loading = false;
      },
    });
  }

  printUsers(): void {
    window.print();
  }

  private getDateStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ════════════════════════════════════════════════════════════════

  showNotification(type: string, message: string): void {
    this.notification = { type, message, show: true };
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(() => {
      this.notification.show = false;
    }, 4000);
  }

  closeNotification(): void {
    this.notification.show = false;
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
  }
}