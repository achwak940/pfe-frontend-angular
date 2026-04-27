// src/app/dashboard/dashboard-admin/reclmations.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  imageUrl: string;
  imageName: string;
  reponseAdmin?: string;
  dateReponse?: string;
  createdAt?: string;
  updatedAt?: string;
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

@Injectable({ providedIn: 'root' })
export class ReclamationsService {
  private apiUrl = 'http://localhost:3000/reclamations';

  constructor(private http: HttpClient) {}

  getAllReclamations(): Observable<Reclamation[]> {
    return this.http.get<Reclamation[]>(this.apiUrl);
  }

  getReclamationById(id: number): Observable<Reclamation> {
    return this.http.get<Reclamation>(`${this.apiUrl}/${id}`);
  }

  getReclamationsByUser(userId: number): Observable<Reclamation[]> {
    return this.http.get<Reclamation[]>(`${this.apiUrl}/user/${userId}`);
  }

  getReclamationsByStatut(statut: string): Observable<Reclamation[]> {
    return this.http.get<Reclamation[]>(`${this.apiUrl}/statut/${statut}`);
  }

  createReclamation(reclamation: CreateReclamationDto): Observable<Reclamation> {
    return this.http.post<Reclamation>(this.apiUrl, reclamation);
  }

  updateReclamation(id: number, reclamation: Partial<CreateReclamationDto>): Observable<Reclamation> {
    return this.http.patch<Reclamation>(`${this.apiUrl}/${id}`, reclamation);
  }

  changerStatut(id: number, statut: string): Observable<Reclamation> {
    return this.http.patch<Reclamation>(`${this.apiUrl}/${id}/statut`, { statut });
  }

  repondreReclamation(id: number, reponse: ReponseReclamationDto): Observable<Reclamation> {
    return this.http.post<Reclamation>(`${this.apiUrl}/${id}/repondre`, reponse);
  }

  updateStatus(id: number, statut: string): Observable<Reclamation> {
    return this.changerStatut(id, statut);
  }

  deleteReclamation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  createFromYolo(yoloData: YoloAnalysisResult, userId?: number): Observable<Reclamation> {
    return this.http.post<Reclamation>(`${this.apiUrl}/yolo`, { yoloData, userId });
  }
}