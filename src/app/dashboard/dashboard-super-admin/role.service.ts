import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  photo_profil?: string | null;
  statut?: string;
}

export interface BackendRole {
  id: number;
  nom: string;
  description?: string;
  couleur: string;
  actif: boolean;
  createdAt: string;
  utilisateurs?: Utilisateur[];
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private apiUrl = 'http://localhost:3000/roles';
  private usersUrl = 'http://localhost:3000/utilisateur/get/all';

  constructor(private http: HttpClient) {}

  getAll(): Observable<BackendRole[]> {
    return this.http.get<BackendRole[]>(this.apiUrl);
  }

  getOne(id: number): Observable<BackendRole> {
    return this.http.get<BackendRole>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<BackendRole>): Observable<BackendRole> {
    return this.http.post<BackendRole>(this.apiUrl, data);
  }

  update(id: number, data: Partial<BackendRole>): Observable<BackendRole> {
    return this.http.put<BackendRole>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Toggle actif/inactif côté serveur.
   * Le backend notifie et emaile automatiquement les utilisateurs concernés.
   */
  toggleStatut(id: number): Observable<BackendRole> {
    return this.http.patch<BackendRole>(`${this.apiUrl}/${id}/toggle-statut`, {});
  }

  assignRoleToUser(roleId: number, userId: number): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(
      `${this.apiUrl}/${roleId}/assign/${userId}`,
      {},
    );
  }

  assignRoleToUsers(
    roleId: number,
    userIds: number[],
  ): Observable<{ message: string; updated: number }> {
    return this.http.post<{ message: string; updated: number }>(
      `${this.apiUrl}/${roleId}/assign-bulk`,
      { userIds },
    );
  }

  unassignRole(userId: number): Observable<Utilisateur> {
    return this.http.delete<Utilisateur>(`${this.apiUrl}/unassign/${userId}`);
  }

  getAllUsers(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(this.usersUrl);
  }
}