// src/app/dashboard/dashboard-admin/reclmations.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Reclamation {
  id: number;
  titre: string;
  description: string;
  typeDommage: string;
  totalSeverite: number;
  dommagesDetectes: number;
  gravite: number;
  confiance: number;
  statut: 'DETECTE' | 'EN_COURS' | 'RESOLU' | 'REJETE';
  imageUrl: string | null;
  imageName: string | null;
  reponseAdmin?: string;
  dateReponse?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: number;
  coutEstime?: number;
  notesExpert?: string;
  user?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    photoProfil: string;
  };
}

export interface CreateReclamationDto {
  titre: string;
  description: string;
  typeDommage: string;
  totalSeverite: number;
  dommagesDetectes: number;
  gravite: number;
  confiance: number;
  statut?: string;
  imageUrl?: string;
  imageName?: string;
  userId?: number;
  coutEstime?: number;
  notesExpert?: string;
}

export interface ReponseReclamationDto {
  message: string;
  priority?: string;
  sendEmail?: boolean;
  sendSMS?: boolean;
}

export interface YoloAnalysisResult {
  title: string;
  description: string;
  category: string;
  damageCount: number;
  averageGravity: number;
  averageConfidence: number;
  totalSeverity: number;
  image_url: string;
  imageName: string;
  damages: Array<{
    label: string;
    confidence: number;
    severity: number;
  }>;
}

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ReclamationsService {
  private apiUrl = 'http://localhost:3000/reclamations';

  constructor(private http: HttpClient) {}

  getAllReclamations(filters?: any): Observable<Reclamation[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.dateDebut) params = params.set('dateDebut', filters.dateDebut);
      if (filters.dateFin) params = params.set('dateFin', filters.dateFin);
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.search) params = params.set('search', filters.search);
    }
    
    return this.http
      .get<ApiResponse<Reclamation[]>>(`${this.apiUrl}`, { params })
      .pipe(
        map((response: any) => {
          if (response && response.data && Array.isArray(response.data)) {
            return response.data;
          }
          if (Array.isArray(response)) {
            return response;
          }
          console.warn('Format de réponse inattendu:', response);
          return [];
        }),
        catchError((error) => {
          console.error('Erreur getAllReclamations:', error);
          return throwError(() => error);
        })
      );
  }

  getReclamationById(id: number): Observable<Reclamation> {
    return this.http.get<ApiResponse<Reclamation>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  getReclamationsByUser(userId: number): Observable<Reclamation[]> {
    return this.http.get<ApiResponse<Reclamation[]>>(`${this.apiUrl}/user/${userId}`).pipe(
      map(response => response.data || [])
    );
  }

  getReclamationsByStatut(statut: string): Observable<Reclamation[]> {
    return this.http.get<ApiResponse<Reclamation[]>>(`${this.apiUrl}/statut/${statut}`).pipe(
      map(response => response.data || [])
    );
  }

  createReclamation(reclamation: CreateReclamationDto): Observable<Reclamation> {
    return this.http.post<ApiResponse<Reclamation>>(this.apiUrl, reclamation).pipe(
      map(response => response.data)
    );
  }

  createReclamationWithImage(formData: FormData): Observable<Reclamation> {
    return this.http.post<ApiResponse<Reclamation>>(`${this.apiUrl}/with-image`, formData).pipe(
      map(response => response.data)
    );
  }

  updateReclamation(id: number, reclamation: Partial<CreateReclamationDto>): Observable<Reclamation> {
    return this.http.patch<ApiResponse<Reclamation>>(`${this.apiUrl}/${id}`, reclamation).pipe(
      map(response => response.data)
    );
  }

  deleteReclamation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  changerStatut(id: number, statut: string): Observable<Reclamation> {
    return this.http.patch<ApiResponse<Reclamation>>(`${this.apiUrl}/${id}/statut`, { statut }).pipe(
      map(response => response.data)
    );
  }

  updateStatus(id: number, statut: string): Observable<Reclamation> {
    return this.changerStatut(id, statut);
  }

  repondreReclamation(id: number, reponse: ReponseReclamationDto): Observable<Reclamation> {
    return this.http.post<ApiResponse<Reclamation>>(`${this.apiUrl}/${id}/repondre`, reponse).pipe(
      map(response => response.data)
    );
  }

  uploadImage(id: number, file: File): Observable<Reclamation> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<ApiResponse<Reclamation>>(`${this.apiUrl}/${id}/image`, formData).pipe(
      map(response => response.data)
    );
  }

  createFromYolo(yoloData: YoloAnalysisResult, userId?: number): Observable<Reclamation> {
    return this.http.post<ApiResponse<Reclamation>>(`${this.apiUrl}/yolo`, {
      yoloResult: yoloData,
      userId,
    }).pipe(
      map(response => response.data)
    );
  }

  deleteMultiple(ids: number[]): Observable<any> {
    return this.http.request('delete', `${this.apiUrl}/batch`, { body: { ids } });
  }

  updateMultiple(ids: number[], data: Partial<CreateReclamationDto>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/batch`, { ids, data });
  }

  getStats(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats`).pipe(
      map(response => response.data)
    );
  }

  getCountByStatut(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats/by-statut`).pipe(
      map(response => response.data)
    );
  }

  getCountByGravite(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats/by-gravite`).pipe(
      map(response => response.data)
    );
  }

  exportToCsv(filtres?: any): Observable<Blob> {
    let params = new HttpParams();
    if (filtres) {
      Object.keys(filtres).forEach((key) => {
        if (filtres[key] !== undefined && filtres[key] !== null) {
          params = params.set(key, filtres[key]);
        }
      });
    }
    return this.http.get(`${this.apiUrl}/export/csv`, {
      params,
      responseType: 'blob',
    });
  }
  
  generateReport(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/report`, {
      responseType: 'blob',
    }).pipe(
      catchError(() => {
        console.warn('API rapport non disponible');
        return throwError(() => new Error('Service de rapport non disponible'));
      })
    );
  }
}