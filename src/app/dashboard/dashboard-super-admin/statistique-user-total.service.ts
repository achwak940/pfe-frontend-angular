// statistique-user-total.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

// ✅ Interface Role objet (retourné par le backend avec relations)
export interface RoleObject {
  id: number;
  nom: string;
  couleur?: string;
  actif?: boolean;
}

export interface Utilisateur {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  photo_profil?: string;
  // ✅ role peut être un objet OU un string selon l'endpoint
  role: RoleObject | string | null;
  statut: string;
  est_verifie: boolean;
  date_creation: Date;
  date_modification?: Date;
  // Champs calculés côté frontend
  derniereConnexion?: string;
  localisation?: string;
  activite?: number;
  enquetesCount?: number;
  reponsesCount?: number;
}

export interface ApiResponse {
  success?: boolean;
  message: string;
  data?: any;
  profil?: Utilisateur;
  erreur?: string;
  utilisateur?: Utilisateur;
}

@Injectable({
  providedIn: 'root',
})
export class StatistiqueUserTotalService {
  private apiUrl = 'http://localhost:3000/utilisateur';
  readonly baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // ──────────────────────────────────────────────────────────────────
  // HELPER : Extraire le nom du rôle (objet ou string)
  // ──────────────────────────────────────────────────────────────────
  getRoleNom(role: RoleObject | string | null | undefined): string {
    if (!role) return '';
    if (typeof role === 'string') return role;
    if (typeof role === 'object' && role.nom) return role.nom;
    return '';
  }

  // ──────────────────────────────────────────────────────────────────
  // HELPER : Construire URL image complète
  // ──────────────────────────────────────────────────────────────────
  buildImageUrl(photoProfil: string | null | undefined): string {
    if (!photoProfil || photoProfil.trim() === '' || photoProfil === 'default') {
      return '';
    }
    if (photoProfil.startsWith('http')) return photoProfil;
    // photoProfil = '/uploads/profiles/xxxx.jpg'
    const clean = photoProfil.startsWith('/') ? photoProfil : `/${photoProfil}`;
    return `${this.baseUrl}${clean}`;
  }

  // ──────────────────────────────────────────────────────────────────
  // STATISTIQUES
  // ──────────────────────────────────────────────────────────────────
  getNombreAllUsers(): Observable<{ nombreUsersTotal: number }> {
    return this.http.get<{ nombreUsersTotal: number }>(
      `${this.apiUrl}/NombreUsers`
    );
  }

  getNombreAllUsersActifs(): Observable<{ NombreUsersActifs: number }> {
    return this.http.get<{ NombreUsersActifs: number }>(
      `${this.apiUrl}/NombreUsers/actifs`
    );
  }

  getNombreAllUsersInactifs(): Observable<{ NombreUsersInActifs: number }> {
    return this.http.get<{ NombreUsersInActifs: number }>(
      `${this.apiUrl}/NombreUsers/Inactifs`
    );
  }

  getNombreAllAdmins(): Observable<{ NombreAdmins: number }> {
    return this.http.get<{ NombreAdmins: number }>(
      `${this.apiUrl}/Nombre/Admins`
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // GESTION UTILISATEURS
  // ──────────────────────────────────────────────────────────────────
  getAllUsers(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/get/all`).pipe(
      tap((users) => {
        console.log('📊 Users reçus:', users.length);
        console.log(
          '🎭 Exemple role:',
          users[0]?.role,
          '→ type:',
          typeof users[0]?.role
        );
      })
    );
  }

  getUserById(id: number): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.apiUrl}/${id}`);
  }

  createUser(userData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  updateUser(id: number, userData: Partial<any>): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${id}`, userData);
  }

  updateUserStatus(id: number, statut: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${id}/statuts`, {
      statut,
    });
  }

  // ✅ Envoie le nom du rôle (string) au backend
  updateUserRole(id: number, roleNom: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${id}/role`, {
      role: roleNom,
    });
  }

  deleteUser(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }

  // ──────────────────────────────────────────────────────────────────
  // PROFIL
  // ──────────────────────────────────────────────────────────────────
  getProfil(userId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/profil/${userId}`);
  }

  updateProfil(userId: number, userData: FormData): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(
      `${this.apiUrl}/profil/${userId}`,
      userData
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // ENQUETES
  // ──────────────────────────────────────────────────────────────────
  getUserEnquetesCount(userId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/enquetes/count/${userId}`);
  }

  getUserEnquetes(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/enquetes/${userId}`);
  }

  getUserEnqueteDetails(userId: number, enqueteId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/enquetes/${userId}/${enqueteId}`);
  }

  // ──────────────────────────────────────────────────────────────────
  // EXPORTS
  // ──────────────────────────────────────────────────────────────────
  exportUsersToCSV(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export-csv`, {
      responseType: 'blob',
    });
  }

  exportUsersToExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export-connecte`, {
      responseType: 'blob',
    });
  }

  exportUsersToPDF(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exportPdf-connecte`, {
      responseType: 'blob',
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // RECHERCHE
  // ──────────────────────────────────────────────────────────────────
  searchUsers(query: string): Observable<Utilisateur[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/search`, { params });
  }
  updateUserWithPhoto(id: number, formData: FormData): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${id}/with-photo`, formData);
  }

 // Récupère tous les rôles disponibles
getAllRoles(): Observable<RoleObject[]> {
  return this.http.get<RoleObject[]>('http://localhost:3000/roles');
}
 
}