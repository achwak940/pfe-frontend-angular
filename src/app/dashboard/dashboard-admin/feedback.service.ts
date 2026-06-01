import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Feedback {
  id: number;
  type: 'suggestion' | 'probleme_technique' | 'question';
  message: string;
  statut: 'nouveau' | 'en_cours' | 'resolu' | 'annule';  // Ajout de 'annule'
  date_creation: string;
  utilisateurId?: number;
  enqueteId?: number;
  utilisateur?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  enquete?: {
    id: number;
    titre: string;
  };
}

export interface CreateFeedbackDto {
  type: 'suggestion' | 'probleme_technique' | 'question';
  message: string;
  utilisateurId?: number;
  enqueteId?: number;
}

export interface FeedbackStats {
  total: number;
  nouveaux: number;
  enCours: number;
  resolus: number;
  suggestions: number;
  problemes: number;
  questions: number;
  tauxResolution: number;
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private apiUrl = 'http://localhost:3000/feedback';

  constructor(private http: HttpClient) {}

  createFeedback(feedback: CreateFeedbackDto): Observable<Feedback> {
    return this.http.post<Feedback>(this.apiUrl, feedback);
  }

  getAllFeedbacks(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(this.apiUrl);
  }

  getFeedbackById(id: number): Observable<Feedback> {
    return this.http.get<Feedback>(`${this.apiUrl}/${id}`);
  }

  updateFeedback(id: number, feedback: Partial<Feedback>): Observable<Feedback> {
    return this.http.patch<Feedback>(`${this.apiUrl}/${id}`, feedback);
  }

  deleteFeedback(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getFeedbacksForAdmin(adminId: number, enqueteId?: number): Observable<Feedback[]> {
    let params = new HttpParams();
    if (enqueteId) {
      params = params.set('enqueteId', enqueteId.toString());
    }
    return this.http.get<Feedback[]>(`${this.apiUrl}/admin/${adminId}`, { params });
  }

  getStatsForAdmin(adminId: number): Observable<FeedbackStats> {
    return this.http.get<FeedbackStats>(`${this.apiUrl}/stats/admin/${adminId}`);
  }
}