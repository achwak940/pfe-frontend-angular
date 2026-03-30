import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Feedback {
  id: number;
  type: 'suggestion' | 'probleme_technique' | 'question';
  message: string;
  statut: 'nouveau' | 'en_cours' | 'resolu';
  date_creation: string;
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

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private apiUrl = 'http://localhost:3000/feedback'; // <-- ton API NestJS

  constructor(private http: HttpClient) {}

  // 🔹 Créer un feedback
  createFeedback(feedback: Partial<Feedback>): Observable<Feedback> {
    return this.http.post<Feedback>(this.apiUrl, feedback);
  }

  // 🔹 Récupérer tous les feedbacks
  getAllFeedbacks(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(this.apiUrl);
  }

  // 🔹 Récupérer un feedback par id
  getFeedbackById(id: number): Observable<Feedback> {
    return this.http.get<Feedback>(`${this.apiUrl}/${id}`);
  }

  // 🔹 Mettre à jour un feedback
  updateFeedback(id: number, feedback: Partial<Feedback>): Observable<Feedback> {
    return this.http.patch<Feedback>(`${this.apiUrl}/${id}`, feedback);
  }

  // 🔹 Supprimer un feedback
  deleteFeedback(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // 🔹 Récupérer les feedbacks pour un admin
  getFeedbacksForAdmin(adminId: number, enqueteId?: number): Observable<Feedback[]> {
    let params = new HttpParams();
    if (enqueteId) {
      params = params.set('enqueteId', enqueteId.toString());
    }
    return this.http.get<Feedback[]>(`${this.apiUrl}/admin/${adminId}`, { params });
  }
}