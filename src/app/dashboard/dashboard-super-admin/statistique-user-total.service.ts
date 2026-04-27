import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface Utilisateur {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  photo_profil?: string;
  role: string;
  statut: string;
  est_verifie: boolean;
  date_creation: Date;
  date_modification?: Date;
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
  providedIn: 'root'
})
export class StatistiqueUserTotalService {
  private apiUrl = 'http://localhost:3000/utilisateur';

  constructor(private http: HttpClient) { }

  // ========== STATISTIQUES ==========
  getNombreAllUsers(): Observable<{ nombreUsersTotal: number }> {
    return this.http.get<{ nombreUsersTotal: number }>(`${this.apiUrl}/NombreUsers`);
  }

  getNombreAllUsersActifs(): Observable<{ NombreUsersActifs: number }> {
    return this.http.get<{ NombreUsersActifs: number }>(`${this.apiUrl}/NombreUsers/actifs`);
  }

  getNombreAllUsersInactifs(): Observable<{ NombreUsersInActifs: number }> {
    return this.http.get<{ NombreUsersInActifs: number }>(`${this.apiUrl}/NombreUsers/Inactifs`);
  }

  getNombreAllAdmins(): Observable<{ NombreAdmins: number }> {
    return this.http.get<{ NombreAdmins: number }>(`${this.apiUrl}/Nombre/Admins`);
  }

  // ========== GESTION DES UTILISATEURS ==========
  getAllUsers(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/get/all`).pipe(
      tap(users => {
        console.log('📊 Utilisateurs reçus:', users.length);
        console.log('🎭 Rôles disponibles:', [...new Set(users.map(u => u.role))]);
        console.log('🟢 Statuts disponibles:', [...new Set(users.map(u => u.statut))]);
      })
    );
  }

  getUserById(id: number): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.apiUrl}/${id}`);
  }

  createUser(userData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  updateUser(id: number, userData: Partial<Utilisateur>): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${id}`, userData);
  }

  updateUserStatus(id: number, statut: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${id}/statuts`, { statut });
  }

  updateUserRole(id: number, role: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${id}/role`, { role });
  }

  deleteUser(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }

  // ========== PROFIL UTILISATEUR ==========
  getProfil(userId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/profil/${userId}`);
  }

  updateProfil(userId: number, userData: FormData): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/profil/${userId}`, userData);
  }

  // ========== STATISTIQUES UTILISATEUR ==========
  getUserEnquetesCount(userId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/enquetes/count/${userId}`);
  }

  getUserEnquetes(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/enquetes/${userId}`);
  }

  getUserEnqueteDetails(userId: number, enqueteId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/enquetes/${userId}/${enqueteId}`);
  }

  // ========== EXPORTS ==========
  exportUsersToCSV(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export-csv`, { responseType: 'blob' });
  }

  exportUsersToExcel(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export-connecte`, { responseType: 'blob' });
  }

  exportUsersToPDF(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exportPdf-connecte`, { responseType: 'blob' });
  }

  // ========== RECHERCHE ==========
  searchUsers(query: string): Observable<Utilisateur[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/search`, { params });
  }
}