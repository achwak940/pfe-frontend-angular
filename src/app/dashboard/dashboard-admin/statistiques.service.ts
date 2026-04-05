import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StatistiquesService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getNombreEnqueteByUser(id: any): Observable<any> {
    const apiUrl = `${this.apiUrl}/utilisateur/enquetes/count/${id}`;
    return this.http.get(apiUrl);
  }

  getNombreParticipantsByUser(id: any): Observable<any> {
    const apiUrl = `${this.apiUrl}/enquete/participants/${id}`;
    return this.http.get(apiUrl);
  }

  getTauxReponseTotal(id: any): Observable<any> {
    const apiUrl = `${this.apiUrl}/enquete/taux-reponse-admin/${id}`;
    return this.http.get(apiUrl);
  }

  getNombreTotalUsers(): Observable<any> {
    const apiUrl = `${this.apiUrl}/utilisateur/count/all`;
    return this.http.get(apiUrl);
  }
  getAllUsersConnecte(): Observable<any> {
    const apiUrl = `${this.apiUrl}/utilisateur/get/all/connecte`;
    return this.http.get(apiUrl);
  }

  getAllUsersConnecteNouveaux(): Observable<any> {
    const apiUrl = `${this.apiUrl}/utilisateur/get/all/connecte/nouveaux`;
    return this.http.get(apiUrl);
  }

  // Nouveaux endpoints pour le dashboard
  getEvolutionReponses(id: number, periode: string = 'week'): Observable<any> {
    const apiUrl = `${this.apiUrl}/reponse/evolution-reponses/${id}?periode=${periode}`;
    return this.http.get(apiUrl);
  }

  getSurveyStatusStats(id: number): Observable<any> {
    const apiUrl = `${this.apiUrl}/reponse/survey-status/${id}`;
    return this.http.get(apiUrl);
  }

  getParticipationParEnquete(id: number): Observable<any> {
    const apiUrl = `${this.apiUrl}/reponse/participation-enquetes/${id}`;
    return this.http.get(apiUrl);
  }

  getTopEnquetes(id: number, periode: string = 'week', limit: number = 5): Observable<any> {
    const apiUrl = `${this.apiUrl}/reponse/top-enquetes/${id}?periode=${periode}&limit=${limit}`;
    return this.http.get(apiUrl);
  }

  getRecentEnquetes(id: number, limit: number = 3): Observable<any> {
    const apiUrl = `${this.apiUrl}/reponse/recent-enquetes/${id}?limit=${limit}`;
    return this.http.get(apiUrl);
  }

  getRecentActivities(id: number, limit: number = 5): Observable<any> {
    const apiUrl = `${this.apiUrl}/reponse/recent-activities/${id}?limit=${limit}`;
    return this.http.get(apiUrl);
  }

  getStatsParEnquete(id: number): Observable<any> {
    const apiUrl = `${this.apiUrl}/reponse/stats/enquetes/${id}`;
    return this.http.get(apiUrl);
  }
  getTopUtilisateurs(id: number): Observable<any> {
    const apiUrl = `${this.apiUrl}/reponse/top-users/${id}`;
    return this.http.get(apiUrl);
  }

  getTauxCompletionGlobal(id: number): Observable<any> {
    const apiUrl = `${this.apiUrl}/reponse/taux-completion/${id}`;
    return this.http.get(apiUrl);
  }
}