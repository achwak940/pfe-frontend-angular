// reponses.service.ts - Correction de la méthode
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReponsesService {

  constructor(private http: HttpClient) { }

  getAllReponsesByAdmin(userId: number): Observable<any> {
    return this.http.get<any>(`http://localhost:3000/reponse/get/all/${userId}`);
  }

  exportAllReponsesExcel(userId: number): Observable<Blob> {
    return this.http.get(`http://localhost:3000/reponse/exportExcel/all/${userId}`, {
      responseType: 'blob'
    });
  }

  exportAllReponsesPdf(id: number): Observable<Blob> {
    return this.http.get(`http://localhost:3000/reponse/export-pdf/reponses/${id}`, {
      responseType: 'blob'
    });
  }

  exportReponsesCsv(id: number): Observable<Blob> {
    return this.http.get(`http://localhost:3000/reponse/export-csv/reponses/${id}`, {
      responseType: 'blob'
    });
  }

  getNombreReponsesByAdmin(id: number): Observable<any> {
    return this.http.get(`http://localhost:3000/reponse/count/All/Reponses/${id}`);
  }

  // CORRECTION: Méthode avec le bon nom (getDetaillesReponseByid)
  getDetaillesReponseByid(id: number): Observable<any> {
    return this.http.get(`http://localhost:3000/reponse/detailles/${id}`);
  }

  // Nouveaux endpoints pour les statistiques
  getStatsParEnquete(userId: number): Observable<any> {
    return this.http.get(`http://localhost:3000/reponse/stats/enquetes/${userId}`);
  }

  getTopUtilisateurs(userId: number): Observable<any> {
    return this.http.get(`http://localhost:3000/reponse/top-users/${userId}`);
  }

  getTauxCompletionGlobal(userId: number): Observable<any> {
    return this.http.get(`http://localhost:3000/reponse/taux-completion/${userId}`);
  }

  // CORRECTION: Méthode avec un seul paramètre, le deuxième est optionnel via query params
  getParticipationParPeriode(userId: number, periode?: string): Observable<any> {
    let url = `http://localhost:3000/reponse/participation-periode/${userId}`;
    if (periode) {
      url += `?periode=${periode}`;
    }
    return this.http.get(url);
  }
}