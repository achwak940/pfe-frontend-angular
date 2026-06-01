// src/app/dashboard/dashboard-admin/reclmations.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// ==================== INTERFACES POUR LES NOUVELLES API ====================

export interface RecommendRequest {
  device_enc: number;
  damage_enc: number;
  total_damage: number;
}

export interface PriceDurationRequest {
  device_enc: number;
  damage_enc: number;
  total_damage: number;
}

export interface PriceDurationResponse {
  device_enc: number;
  damage_enc: number;
  total_damage: number;
  price: number;
  duration_h: number;
}

export interface Recommendation {
  solution: string;
  confidence: number;
  class_id?: number;
}

export interface Analysis {
  analysis: {
    case_summary: string;
    damage_level: string;
    deep_analysis: string;
  };
  risks: {
    high: string[];
    medium: string[];
    low: string[];
  };
  recommendations_analysis: any[];
  decision: {
    final_choice: string;
    justification: string;
    risk_if_ignored: string;
  };
}

export interface RecommendResponse {
  severity: number;
  recommendations: Recommendation[];
  analysis: Analysis;
}

export interface PredictionResponse {
  image_url: string;
  total_damage: number;
  price: number;
  duration: number;
  boxes: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    damage: string;
    confidence: number;
    gravite: number;
  }>;
}

// ==================== INTERFACES EXISTANTES ====================

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
  private recommendationApiUrl = 'http://localhost:3000/recommendation'; // NestJS API

  constructor(private http: HttpClient) {}

  // ==================== NOUVELLES MÉTHODES API ====================

  /**
   * 🔥 Obtenir les recommandations via NestJS
   */
  getRecommendations(data: RecommendRequest): Observable<RecommendResponse> {
    return this.http.post<RecommendResponse>(
      `${this.recommendationApiUrl}/analyze`,
      data
    ).pipe(
      catchError((error) => {
        console.error('❌ Erreur getRecommendations:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 💰 Obtenir prix et durée via NestJS
   */
  getPriceDuration(data: PriceDurationRequest): Observable<PriceDurationResponse> {
    return this.http.post<PriceDurationResponse>(
      `${this.recommendationApiUrl}/price-duration`,
      data
    ).pipe(
      catchError((error) => {
        console.error('❌ Erreur getPriceDuration:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 🖼️ Prédiction image via YOLO (upload)
   */
  predictImage(file: File): Observable<PredictionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<PredictionResponse>(
      `${this.recommendationApiUrl}/predict`,
      formData
    ).pipe(
      catchError((error) => {
        console.error('❌ Erreur predictImage:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * 🔥 Analyse complète (prix + durée + recommandations)
   */
  analyzeComplete(data: PriceDurationRequest): Observable<{
    price: number;
    duration: number;
    recommendations: Recommendation[];
    severity: number;
  }> {
    // Appeler d'abord le prix/durée
    return new Observable(observer => {
      this.getPriceDuration(data).subscribe({
        next: (priceDuration) => {
          this.getRecommendations(data).subscribe({
            next: (recommendations) => {
              observer.next({
                price: priceDuration.price,
                duration: priceDuration.duration_h,
                recommendations: recommendations.recommendations,
                severity: recommendations.severity
              });
              observer.complete();
            },
            error: (err) => observer.error(err)
          });
        },
        error: (err) => observer.error(err)
      });
    });
  }

  // ==================== MÉTHODES EXISTANTES ====================

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
      map(response => response.data),
      catchError((error) => {
        console.error('Erreur getReclamationById:', error);
        return throwError(() => error);
      })
    );
  }

  getReclamationsByUser(userId: number): Observable<Reclamation[]> {
    return this.http.get<ApiResponse<Reclamation[]>>(`${this.apiUrl}/user/${userId}`).pipe(
      map(response => response.data || []),
      catchError((error) => {
        console.error('Erreur getReclamationsByUser:', error);
        return throwError(() => error);
      })
    );
  }

  getReclamationsByStatut(statut: string): Observable<Reclamation[]> {
    return this.http.get<ApiResponse<Reclamation[]>>(`${this.apiUrl}/statut/${statut}`).pipe(
      map(response => response.data || []),
      catchError((error) => {
        console.error('Erreur getReclamationsByStatut:', error);
        return throwError(() => error);
      })
    );
  }

  createReclamation(reclamation: CreateReclamationDto): Observable<Reclamation> {
    return this.http.post<ApiResponse<Reclamation>>(this.apiUrl, reclamation).pipe(
      map(response => response.data),
      catchError((error) => {
        console.error('Erreur createReclamation:', error);
        return throwError(() => error);
      })
    );
  }

  createReclamationWithImage(formData: FormData): Observable<Reclamation> {
    return this.http.post<ApiResponse<Reclamation>>(`${this.apiUrl}/with-image`, formData).pipe(
      map(response => response.data),
      catchError((error) => {
        console.error('Erreur createReclamationWithImage:', error);
        return throwError(() => error);
      })
    );
  }

  updateReclamation(id: number, reclamation: Partial<CreateReclamationDto>): Observable<Reclamation> {
    return this.http.patch<ApiResponse<Reclamation>>(`${this.apiUrl}/${id}`, reclamation).pipe(
      map(response => response.data),
      catchError((error) => {
        console.error('Erreur updateReclamation:', error);
        return throwError(() => error);
      })
    );
  }

  deleteReclamation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error('Erreur deleteReclamation:', error);
        return throwError(() => error);
      })
    );
  }

  changerStatut(id: number, statut: string): Observable<Reclamation> {
    return this.http.patch<ApiResponse<Reclamation>>(`${this.apiUrl}/${id}/statut`, { statut }).pipe(
      map(response => response.data),
      catchError((error) => {
        console.error('Erreur changerStatut:', error);
        return throwError(() => error);
      })
    );
  }

  updateStatus(id: number, statut: string): Observable<Reclamation> {
    return this.changerStatut(id, statut);
  }

  repondreReclamation(id: number, reponse: ReponseReclamationDto): Observable<Reclamation> {
    return this.http.post<ApiResponse<Reclamation>>(`${this.apiUrl}/${id}/repondre`, reponse).pipe(
      map(response => response.data),
      catchError((error) => {
        console.error('Erreur repondreReclamation:', error);
        return throwError(() => error);
      })
    );
  }

  uploadImage(id: number, file: File): Observable<Reclamation> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<ApiResponse<Reclamation>>(`${this.apiUrl}/${id}/image`, formData).pipe(
      map(response => response.data),
      catchError((error) => {
        console.error('Erreur uploadImage:', error);
        return throwError(() => error);
      })
    );
  }

  createFromYolo(yoloData: YoloAnalysisResult, userId?: number): Observable<Reclamation> {
    return this.http.post<ApiResponse<Reclamation>>(`${this.apiUrl}/yolo`, {
      yoloResult: yoloData,
      userId,
    }).pipe(
      map(response => response.data),
      catchError((error) => {
        console.error('Erreur createFromYolo:', error);
        return throwError(() => error);
      })
    );
  }

  deleteMultiple(ids: number[]): Observable<any> {
    return this.http.request('delete', `${this.apiUrl}/batch`, { body: { ids } }).pipe(
      catchError((error) => {
        console.error('Erreur deleteMultiple:', error);
        return throwError(() => error);
      })
    );
  }

  updateMultiple(ids: number[], data: Partial<CreateReclamationDto>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/batch`, { ids, data }).pipe(
      catchError((error) => {
        console.error('Erreur updateMultiple:', error);
        return throwError(() => error);
      })
    );
  }

  getStats(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats`).pipe(
      map(response => response.data),
      catchError((error) => {
        console.error('Erreur getStats:', error);
        return throwError(() => error);
      })
    );
  }

  getCountByStatut(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats/by-statut`).pipe(
      map(response => response.data),
      catchError((error) => {
        console.error('Erreur getCountByStatut:', error);
        return throwError(() => error);
      })
    );
  }

  getCountByGravite(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/stats/by-gravite`).pipe(
      map(response => response.data),
      catchError((error) => {
        console.error('Erreur getCountByGravite:', error);
        return throwError(() => error);
      })
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
    }).pipe(
      catchError((error) => {
        console.error('Erreur exportToCsv:', error);
        return throwError(() => error);
      })
    );
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