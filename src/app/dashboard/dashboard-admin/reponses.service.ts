import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReponsesService {
  private apiUrl = 'http://localhost:3000/reponse';

  constructor(private http: HttpClient) { }

  getAllReponsesByAdmin(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get/all/${userId}`);
  }

  exportAllReponsesExcel(userId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/exportExcel/all/${userId}`, {
      responseType: 'blob'
    });
  }

  exportAllReponsesPdf(userId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export-pdf/reponses/${userId}`, {
      responseType: 'blob'
    });
  }

  exportReponsesCsv(userId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export-csv/reponses/${userId}`, {
      responseType: 'blob'
    });
  }

  getNombreReponsesByAdmin(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/count/All/Reponses/${id}`);
  }

  getDetaillesReponseByid(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/detailles/${id}`);
  }

  getStatsParEnquete(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/enquetes/${userId}`);
  }

  getTopUtilisateurs(userId: number, limit: number = 5): Observable<any> {
    return this.http.get(`${this.apiUrl}/top-users/${userId}?limit=${limit}`);
  }

  getTauxCompletionGlobal(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/taux-completion/${userId}`);
  }

  getParticipationParPeriode(userId: number, periode?: string): Observable<any> {
    let params = new HttpParams();
    if (periode) {
      params = params.set('periode', periode);
    }
    return this.http.get(`${this.apiUrl}/participation-periode/${userId}`, { params });
  }

  getEvolutionReponses(userId: number, periode: string = 'week'): Observable<any> {
    return this.http.get(`${this.apiUrl}/evolution-reponses/${userId}?periode=${periode}`);
  }

  getSurveyStatusStats(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/survey-status/${userId}`);
  }

  getParticipationParEnquete(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/participation-enquetes/${userId}`);
  }

  getTopEnquetes(userId: number, periode: string = 'week', limit: number = 5): Observable<any> {
    return this.http.get(`${this.apiUrl}/top-enquetes/${userId}?periode=${periode}&limit=${limit}`);
  }

  getRecentEnquetes(userId: number, limit: number = 3): Observable<any> {
    return this.http.get(`${this.apiUrl}/recent-enquetes/${userId}?limit=${limit}`);
  }

  getRecentActivities(userId: number, limit: number = 5): Observable<any> {
    return this.http.get(`${this.apiUrl}/recent-activities/${userId}?limit=${limit}`);
  }
}