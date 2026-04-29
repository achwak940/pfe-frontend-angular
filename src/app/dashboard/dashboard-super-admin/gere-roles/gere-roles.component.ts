// gere-roles.component.ts
import { Component, OnInit } from '@angular/core';

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  status: 'active' | 'inactive';
  isSystemRole: boolean;
  createdAt: Date;
  lastModified: Date;
  color: string;
}

@Component({
  selector: 'app-gere-roles',
  templateUrl: './gere-roles.component.html',
  styleUrls: ['./gere-roles.component.css']
})
export class GereRolesComponent implements OnInit {
  Math = Math;

  // ==================== ROLES DATA ====================
  roles: Role[] = [
    {
      id: 1,
      name: 'Super Administrateur',
      description: 'Accès complet à toutes les fonctionnalités du système',
      permissions: ['Gestion totale', 'Configuration système', 'Audit logs', 'Backup/Restore', 'Gestion utilisateurs'],
      userCount: 2,
      status: 'active',
      isSystemRole: true,
      createdAt: new Date('2024-01-15'),
      lastModified: new Date('2025-03-10'),
      color: '#9D50BB'
    },
    {
      id: 2,
      name: 'Gestionnaire',
      description: 'Gestion des sondages, questions et contenus IA',
      permissions: ['Créer/Modifier sondages', 'Modérer IA', 'Analyser résultats', 'Gérer utilisateurs'],
      userCount: 5,
      status: 'active',
      isSystemRole: false,
      createdAt: new Date('2024-02-20'),
      lastModified: new Date('2025-03-05'),
      color: '#3b82f6'
    },
    {
      id: 3,
      name: 'Éditeur',
      description: 'Création et validation de contenu éditorial',
      permissions: ['Créer', 'Modifier', 'Publier', 'Valider'],
      userCount: 8,
      status: 'active',
      isSystemRole: false,
      createdAt: new Date('2024-03-10'),
      lastModified: new Date('2025-02-28'),
      color: '#10b981'
    },
    {
      id: 4,
      name: 'Observateur',
      description: 'Visualisation uniquement des données et rapports',
      permissions: ['Lecture seule', 'Exporter rapports'],
      userCount: 12,
      status: 'active',
      isSystemRole: false,
      createdAt: new Date('2024-04-01'),
      lastModified: new Date('2025-01-20'),
      color: '#f59e0b'
    },
    {
      id: 5,
      name: 'Rôle Système',
      description: 'Rôle système intégré - Ne peut être modifié',
      permissions: ['Accès système', 'Maintenance', 'Monitoring'],
      userCount: 1,
      status: 'inactive',
      isSystemRole: true,
      createdAt: new Date('2024-01-01'),
      lastModified: new Date('2024-12-15'),
      color: '#ef4444'
    },
    {
      id: 6,
      name: 'Modérateur IA',
      description: 'Modération des réponses générées par l\'IA',
      permissions: ['Voir questions', 'Modérer réponses', 'Signaler contenu'],
      userCount: 3,
      status: 'active',
      isSystemRole: false,
      createdAt: new Date('2024-05-15'),
      lastModified: new Date('2025-03-01'),
      color: '#8b5cf6'
    },
    {
      id: 7,
      name: 'Support Client',
      description: 'Support et assistance utilisateurs',
      permissions: ['Voir utilisateurs', 'Répondre tickets', 'Base connaissance'],
      userCount: 4,
      status: 'inactive',
      isSystemRole: false,
      createdAt: new Date('2024-06-10'),
      lastModified: new Date('2025-02-10'),
      color: '#ec4899'
    },
    {
      id: 8,
      name: 'Analyste',
      description: 'Analyse avancée des données et reporting',
      permissions: ['Tous rapports', 'Export avancé', 'Dashboard personnalisé'],
      userCount: 3,
      status: 'active',
      isSystemRole: false,
      createdAt: new Date('2024-07-20'),
      lastModified: new Date('2025-03-12'),
      color: '#06b6d4'
    }
  ];

  // ==================== FILTERS & PAGINATION ====================
  searchTerm: string = '';
  statusFilter: string = 'all';
  typeFilter: string = 'all';
  selectedRole: Role | null = null;
  
  currentPage: number = 1;
  itemsPerPage: number = 6;
  viewMode: 'grid' | 'list' = 'grid';
  
  // Modals
  showRoleModal: boolean = false;
  modalMode: 'create' | 'edit' | 'view' = 'view';
  
  // Form data
  editRoleData: Partial<Role> = {};
  newRole: Partial<Role> = {
    name: '',
    description: '',
    permissions: [],
    status: 'active',
    isSystemRole: false,
    color: '#9D50BB'
  };
  
  // Bulk selection
  selectedRoles: Set<number> = new Set();
  
  // Available permissions
  availablePermissions: string[] = [
    'Lecture seule', 'Créer', 'Modifier', 'Supprimer', 'Publier', 'Valider',
    'Configuration système', 'Gestion utilisateurs', 'Export données', 'Audit logs',
    'Backup/Restore', 'Monitoring', 'Modérer IA', 'Analyser résultats', 'Gérer tickets'
  ];
  
  availableColors: string[] = [
    '#9D50BB', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'
  ];
  
  notification: { show: boolean; type: string; message: string } = {
    show: false,
    type: 'success',
    message: ''
  };

  constructor() { }

  ngOnInit(): void { }

  // ==================== STATISTICS ====================
  getTotalRoles(): number { return this.roles.length; }
  getActiveRoles(): number { return this.roles.filter(r => r.status === 'active').length; }
  getInactiveRoles(): number { return this.roles.filter(r => r.status === 'inactive').length; }
  getSystemRoles(): number { return this.roles.filter(r => r.isSystemRole).length; }
  getCustomRoles(): number { return this.roles.filter(r => !r.isSystemRole).length; }

  // ==================== FILTERED ROLES ====================
  getFilteredRoles(): Role[] {
    let filtered = this.roles;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r => r.name.toLowerCase().includes(term) || r.description.toLowerCase().includes(term));
    }
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === this.statusFilter);
    }
    if (this.typeFilter !== 'all') {
      filtered = filtered.filter(r => this.typeFilter === 'system' ? r.isSystemRole : !r.isSystemRole);
    }
    return filtered;
  }

  getPaginatedRoles(): Role[] {
    const filtered = this.getFilteredRoles();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  }

  getTotalPages(): number {
    return Math.ceil(this.getFilteredRoles().length / this.itemsPerPage);
  }

  // ==================== ROLE ACTIONS ====================
  viewRole(role: Role): void {
    this.selectedRole = role;
    this.modalMode = 'view';
    this.showRoleModal = true;
  }

  editRole(role: Role): void {
    this.selectedRole = role;
    this.editRoleData = { ...role };
    this.modalMode = 'edit';
    this.showRoleModal = true;
  }

  saveEditRole(): void {
    if (this.selectedRole && this.editRoleData) {
      const index = this.roles.findIndex(r => r.id === this.selectedRole!.id);
      if (index !== -1) {
        this.roles[index] = { ...this.roles[index], ...this.editRoleData, lastModified: new Date() } as Role;
        this.showNotification('success', 'Rôle modifié avec succès');
      }
    }
    this.closeRoleModal();
  }

  deleteRole(role: Role): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${role.name}" ?`)) {
      this.roles = this.roles.filter(r => r.id !== role.id);
      this.showNotification('success', 'Rôle supprimé avec succès');
    }
  }

  toggleRoleStatus(role: Role): void {
    role.status = role.status === 'active' ? 'inactive' : 'active';
    this.showNotification('success', `Rôle ${role.status === 'active' ? 'activé' : 'désactivé'} avec succès`);
  }

  createRole(): void {
    if (this.newRole.name && this.newRole.description) {
      const newId = Math.max(...this.roles.map(r => r.id), 0) + 1;
      const roleToAdd: Role = {
        id: newId,
        name: this.newRole.name,
        description: this.newRole.description,
        permissions: this.newRole.permissions || [],
        userCount: 0,
        status: (this.newRole.status as 'active' | 'inactive') || 'active',
        isSystemRole: this.newRole.isSystemRole || false,
        createdAt: new Date(),
        lastModified: new Date(),
        color: this.newRole.color || '#9D50BB'
      };
      this.roles.unshift(roleToAdd);
      this.newRole = { name: '', description: '', permissions: [], status: 'active', isSystemRole: false, color: '#9D50BB' };
      this.showNotification('success', 'Rôle créé avec succès');
      this.closeRoleModal();
    }
  }

  // ==================== BULK ACTIONS ====================
  toggleSelectRole(roleId: number): void {
    if (this.selectedRoles.has(roleId)) this.selectedRoles.delete(roleId);
    else this.selectedRoles.add(roleId);
  }

  toggleSelectAllRoles(): void {
    const currentRoles = this.getPaginatedRoles();
    if (this.selectedRoles.size === currentRoles.length) this.selectedRoles.clear();
    else currentRoles.forEach(r => this.selectedRoles.add(r.id));
  }

  isAllRolesSelected(): boolean {
    const currentRoles = this.getPaginatedRoles();
    return currentRoles.length > 0 && this.selectedRoles.size === currentRoles.length;
  }

  bulkDeleteRoles(): void {
    if (confirm(`Supprimer ${this.selectedRoles.size} rôle(s) ?`)) {
      this.roles = this.roles.filter(r => !this.selectedRoles.has(r.id));
      this.selectedRoles.clear();
      this.showNotification('success', 'Rôles supprimés avec succès');
    }
  }

  // ==================== FILTERS & PAGINATION ====================
  changePage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.typeFilter = 'all';
    this.currentPage = 1;
    this.showNotification('info', 'Filtres réinitialisés');
  }

  // ==================== UTILITIES ====================
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.searchTerm) count++;
    if (this.statusFilter !== 'all') count++;
    if (this.typeFilter !== 'all') count++;
    return count;
  }

  showNotification(type: string, message: string): void {
    this.notification = { show: true, type, message };
    setTimeout(() => { this.notification.show = false; }, 3000);
  }

  closeNotification(): void { this.notification.show = false; }
  closeRoleModal(): void { this.showRoleModal = false; this.selectedRole = null; this.editRoleData = {}; }

  exportToCSV(): void {
    const data = this.getFilteredRoles();
    const headers = ['Nom', 'Description', 'Permissions', 'Utilisateurs', 'Statut', 'Type', 'Créé le'];
    
    const csvData = data.map(role => [
      role.name, role.description, role.permissions.join('; '), 
      role.userCount, role.status, role.isSystemRole ? 'Système' : 'Personnalisé', 
      this.formatDate(role.createdAt)
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roles_export_${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.showNotification('success', 'Export CSV effectué');
  }
}