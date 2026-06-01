import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { BackendRole, RoleService, Utilisateur } from '../role.service';
import { Router } from '@angular/router';

export interface Role {
  id: number;
  name: string;
  description: string;
  color: string;
  status: 'active' | 'inactive';
  isSystemRole: boolean;
  isSuperAdmin: boolean;
  userCount: number;
  createdAt: Date;
  users?: Utilisateur[];
}

@Component({
  selector: 'app-gere-roles',
  templateUrl: './gere-roles.component.html',
  styleUrls: ['./gere-roles.component.css'],
})
export class GereRolesComponent implements OnInit {
  roles: Role[] = [];
  filteredRoles: Role[] = [];
  paginatedRoles: Role[] = [];

  viewMode: 'grid' | 'list' = 'grid';
  searchTerm = '';
  statusFilter = 'all';
  typeFilter = 'all';
  currentPage = 1;
  itemsPerPage = 9;

  selectedRoles = new Set<number>();

  showRoleModal = false;
  modalMode: 'create' | 'edit' | 'view' = 'create';
  selectedRole: Role | null = null;
  editRoleData: Role | null = null;
  newRole: Partial<Role> = {
    name: '',
    description: '',
    color: '#9D50BB',
    status: 'active',
    isSystemRole: false,
    isSuperAdmin: false,
    userCount: 0,
  };

  showAssignModal = false;
  currentAssignRole: Role | null = null;
  allUsers: Utilisateur[] = [];
  selectedUserIds: number[] = [];

  availableColors = [
    '#9D50BB', '#10b981', '#3b82f6', '#f59e0b',
    '#ef4444', '#8b5cf6', '#ec489a', '#06b6d4',
  ];
  notification = { show: false, type: 'success', message: '' };
  loading = false;
  loadingUsers = false;
  togglingId: number | null = null;  // spinner par rôle pendant le toggle
  Math = Math;

  constructor(private roleService: RoleService,  private router: Router,) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadAllUsers();
  }

  // ---- Chargement ----

  loadRoles(): void {
    this.loading = true;
    this.roleService
      .getAll()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => {
          this.roles = data.map((r) => this.mapBackendToFrontend(r));
          this.applyFilters();
        },
        error: () => this.showNotification('Erreur chargement rôles', 'error'),
      });
  }

  loadAllUsers(): void {
    this.loadingUsers = true;
    this.roleService
      .getAllUsers()
      .pipe(finalize(() => (this.loadingUsers = false)))
      .subscribe({
        next: (data) => (this.allUsers = data),
        error: () =>
          this.showNotification('Erreur chargement utilisateurs', 'error'),
      });
  }

  // ---- Mapping ----

  mapBackendToFrontend(backend: BackendRole): Role {
    const systemNames = ['Administrateur', 'Utilisateur connecté'];
    return {
      id: backend.id,
      name: backend.nom,
      description: backend.description || '',
      color: backend.couleur,
      status: backend.actif ? 'active' : 'inactive',
      isSystemRole: systemNames.includes(backend.nom),
      isSuperAdmin: backend.nom === 'SUPER_ADMIN',
      userCount: backend.utilisateurs?.length ?? 0,
      createdAt: new Date(backend.createdAt),
      users: backend.utilisateurs,
    };
  }

  mapFrontendToBackend(role: Partial<Role>): Partial<BackendRole> {
    return {
      nom: role.name,
      description: role.description,
      couleur: role.color,
      actif: role.status === 'active',
    };
  }

  // ---- Toggle statut (appel dédié → backend notifie + emaile) ----

  toggleRoleStatus(role: Role): void {
    if (role.isSuperAdmin) {
      this.showNotification(
        'Le rôle SUPER_ADMIN ne peut pas être modifié',
        'warning',
      );
      return;
    }

    this.togglingId = role.id;

    this.roleService
      .toggleStatut(role.id)
      .pipe(finalize(() => (this.togglingId = null)))
      .subscribe({
        next: (updated) => {
          const refreshed = this.mapBackendToFrontend(updated);
          const idx = this.roles.findIndex((r) => r.id === refreshed.id);
          if (idx !== -1) this.roles[idx] = refreshed;
          this.applyFilters();
          const etat = refreshed.status === 'active' ? 'activé' : 'désactivé';
          this.showNotification(
            `Rôle "${refreshed.name}" ${etat} — utilisateurs notifiés`,
            'success',
          );
        },
        error: () =>
          this.showNotification('Erreur lors du changement de statut', 'error'),
      });
  }

  // ---- Assignation ----

  openAssignModal(role: Role): void {
    this.currentAssignRole = role;
    this.selectedUserIds = [];
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.currentAssignRole = null;
    this.selectedUserIds = [];
  }

  toggleUserSelection(userId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.selectedUserIds.includes(userId))
        this.selectedUserIds.push(userId);
    } else {
      this.selectedUserIds = this.selectedUserIds.filter((id) => id !== userId);
    }
  }

  submitAssign(): void {
    if (!this.currentAssignRole) return;
    if (this.selectedUserIds.length === 0) {
      this.showNotification('Sélectionnez au moins un utilisateur', 'warning');
      return;
    }
    this.roleService
      .assignRoleToUsers(this.currentAssignRole.id, this.selectedUserIds)
      .subscribe({
        next: (res) => {
          this.showNotification(
            `${res.updated} utilisateur(s) assignés au rôle "${this.currentAssignRole?.name}" — emails envoyés`,
            'success',
          );
          this.loadRoles();
          this.closeAssignModal();
        },
        error: () =>
          this.showNotification("Erreur lors de l'assignation", 'error'),
      });
  }

  // ---- Filtres & pagination ----

  applyFilters(): void {
    let filtered = [...this.roles];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term),
      );
    }
    if (this.statusFilter !== 'all')
      filtered = filtered.filter((r) => r.status === this.statusFilter);
    if (this.typeFilter !== 'all')
      filtered = filtered.filter((r) =>
        this.typeFilter === 'system' ? r.isSystemRole : !r.isSystemRole,
      );
    this.filteredRoles = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedRoles = this.filteredRoles.slice(
      start,
      start + this.itemsPerPage,
    );
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredRoles.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.getTotalPages()) return;
    this.currentPage = page;
    this.updatePagination();
  }

  getPaginatedRoles(): Role[] { return this.paginatedRoles; }
  getFilteredRoles(): Role[]  { return this.filteredRoles; }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.typeFilter = 'all';
    this.applyFilters();
    this.showNotification('Filtres réinitialisés', 'info');
  }

  getActiveFilterCount(): number {
    return (
      (this.searchTerm ? 1 : 0) +
      (this.statusFilter !== 'all' ? 1 : 0) +
      (this.typeFilter !== 'all' ? 1 : 0)
    );
  }

  getTotalRoles():  number { return this.roles.length; }
  getActiveRoles(): number { return this.roles.filter((r) => r.status === 'active').length; }
  getSystemRoles(): number { return this.roles.filter((r) => r.isSystemRole).length; }
  getCustomRoles(): number { return this.roles.filter((r) => !r.isSystemRole).length; }

  // ---- Sélection multiple ----

  toggleSelectRole(id: number): void {
    this.selectedRoles.has(id)
      ? this.selectedRoles.delete(id)
      : this.selectedRoles.add(id);
  }

  toggleSelectAllRoles(): void {
    this.isAllRolesSelected()
      ? this.selectedRoles.clear()
      : this.filteredRoles.forEach((r) => this.selectedRoles.add(r.id));
  }

  isAllRolesSelected(): boolean {
    return (
      this.filteredRoles.length > 0 &&
      this.filteredRoles.every((r) => this.selectedRoles.has(r.id))
    );
  }

  clearSelection(): void {
    this.selectedRoles.clear();
    this.showNotification('Sélection annulée', 'info');
  }

  bulkDeleteRoles(): void {
    if (this.selectedRoles.size === 0) return;
    const ids = Array.from(this.selectedRoles);
    const superAdminRole = this.roles.find(
      (r) => ids.includes(r.id) && r.isSuperAdmin,
    );
    if (superAdminRole) {
      this.showNotification(
        'Le rôle SUPER_ADMIN ne peut pas être supprimé',
        'warning',
      );
      return;
    }
    let completed = 0;
    ids.forEach((id) => {
      this.roleService.delete(id).subscribe({
        next: () => {
          completed++;
          if (completed === ids.length) {
            this.loadRoles();
            this.selectedRoles.clear();
            this.showNotification(`${ids.length} rôle(s) supprimé(s)`, 'success');
          }
        },
        error: () =>
          this.showNotification('Erreur suppression groupée', 'error'),
      });
    });
  }

  // ---- CRUD modales ----

  viewRole(role: Role): void {
    this.selectedRole = role;
    this.modalMode = 'view';
    this.showRoleModal = true;
  }

  editRole(role: Role): void {
    this.editRoleData = { ...role };
    this.modalMode = 'edit';
    this.showRoleModal = true;
  }

  saveEditRole(): void {
    if (!this.editRoleData) return;
    if (this.editRoleData.isSuperAdmin) {
      this.showNotification(
        'Le rôle SUPER_ADMIN ne peut pas être modifié',
        'warning',
      );
      return;
    }
    this.roleService
      .update(this.editRoleData.id, this.mapFrontendToBackend(this.editRoleData))
      .subscribe({
        next: (updated) => {
          const edited = this.mapBackendToFrontend(updated);
          const idx = this.roles.findIndex((r) => r.id === edited.id);
          if (idx !== -1) this.roles[idx] = edited;
          this.applyFilters();
          this.showNotification(`Rôle "${edited.name}" modifié`, 'success');
          this.closeRoleModal();
        },
        error: () => this.showNotification('Erreur modification', 'error'),
      });
  }

  deleteRole(role: Role): void {
    if (role.isSuperAdmin) {
      this.showNotification(
        'Le rôle SUPER_ADMIN ne peut pas être supprimé',
        'warning',
      );
      return;
    }
    if (confirm(`Supprimer "${role.name}" ?`)) {
      this.roleService.delete(role.id).subscribe({
        next: () => {
          this.roles = this.roles.filter((r) => r.id !== role.id);
          this.selectedRoles.delete(role.id);
          this.applyFilters();
          this.showNotification(`Rôle "${role.name}" supprimé`, 'success');
        },
        error: () => this.showNotification('Erreur suppression', 'error'),
      });
    }
  }

  createRole(): void {
    if (!this.newRole.name || !this.newRole.description) return;
    this.roleService
      .create(this.mapFrontendToBackend(this.newRole))
      .subscribe({
        next: (created) => {
          const newRole = this.mapBackendToFrontend(created);
          this.roles.push(newRole);
          this.applyFilters();
          this.showNotification(`Rôle "${newRole.name}" créé`, 'success');
          this.closeRoleModal();
        },
        error: () => this.showNotification('Erreur création', 'error'),
      });
  }

  resetNewRole(): void {
    this.newRole = {
      name: '',
      description: '',
      color: '#9D50BB',
      status: 'active',
      isSystemRole: false,
      isSuperAdmin: false,
      userCount: 0,
    };
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
    this.selectedRole = null;
    this.editRoleData = null;
    this.resetNewRole();
  }

  // ---- Export CSV ----

  exportToCSV(): void {
    const fields = [
      'id', 'name', 'description', 'status',
      'isSystemRole', 'userCount', 'createdAt',
    ];
    const data = this.roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      status: r.status,
      isSystemRole: r.isSystemRole ? 'Système' : 'Personnalisé',
      userCount: r.userCount,
      createdAt: this.formatDate(r.createdAt),
    }));
    const csvRows = [fields.map((f) => `"${f}"`).join(',')];
    data.forEach((row) => {
      const values = fields.map(
        (f) => `"${String((row as any)[f]).replace(/"/g, '""')}"`,
      );
      csvRows.push(values.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'roles_export.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    this.showNotification('Export CSV réussi', 'success');
  }

  // ---- Utilitaires ----

  showNotification(message: string, type: string): void {
    this.notification = { show: true, type, message };
    setTimeout(() => (this.notification.show = false), 4000);
  }

  closeNotification(): void {
    this.notification.show = false;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
  goBackToUsers(): void {
  // Option 1: Navigation avec Router vers la route des utilisateurs
  this.router.navigate(['/admin/gere-users']); // Ajustez le chemin selon votre route
  
  // Option 2: Navigation avec retour en arrière (si vous venez de la page users)
  // this.location.back();
  
  // Option 3: Émettre un événement vers le parent
  // this.goBack.emit();
}
}