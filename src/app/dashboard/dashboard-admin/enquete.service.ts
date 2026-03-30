import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnqueteService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }
  
  getAllEnquete(id: any): Observable<any[]> {
    const apiUrl = `${this.baseUrl}/utilisateur/enquetes/${id}`;
    return this.http.get<any[]>(apiUrl); 
  }
  
  getAllEnquetesDetails(idUser: any, idEnquete: any): Observable<any> {
    const apiUrl = `${this.baseUrl}/utilisateur/enquetes/${idUser}/${idEnquete}`;
    return this.http.get<any>(apiUrl);
  }
  
  addNewEnqueteVide(data: any): Observable<any> {
    const apiurl = `${this.baseUrl}/enquete/creation`;
    return this.http.post<any>(apiurl, data);
  }
  
  updateEnquete(data: any, id: any): Observable<any> {
    const apiurl = `${this.baseUrl}/enquete/update/${id}`;
    return this.http.patch<any>(apiurl, data);
  }
  
  getEnqueteById(id: any): Observable<any> {
    const apiurl = `${this.baseUrl}/enquete/${id}`;
    return this.http.get(apiurl);
  }
  
  removeEnquete(id: any): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/delete/${id}`;
    return this.http.delete(apiUrl);
  }
  
  // Nouveaux endpoints pour les statistiques
  getEnqueteStats(idEnquete: number): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/${idEnquete}/stats`;
    return this.http.get(apiUrl);
  }
  
  getReponsesByQuestion(idEnquete: number, questionId: number): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/${idEnquete}/question/${questionId}/reponses`;
    return this.http.get(apiUrl);
  }
  
  generateQRCode(idEnquete: number): Observable<Blob> {
    const apiUrl = `${this.baseUrl}/enquete/${idEnquete}/qrcode`;
    return this.http.get(apiUrl, { responseType: 'blob' });
  }
  
  getEvolutionReponses(idEnquete: number): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/${idEnquete}/evolution`;
    return this.http.get(apiUrl);
  }
  
  // Publier une enquête
  publishEnquete(idEnquete: number): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/${idEnquete}/publier`;
    return this.http.patch(apiUrl, {});
  }
  
  // Archiver une enquête
  archiveEnquete(idEnquete: number): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/${idEnquete}/archiver`;
    return this.http.patch(apiUrl, {});
  }
  
  // Changer le statut
  changeStatut(idEnquete: number, statut: string): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/change-statut/${idEnquete}`;
    return this.http.patch(apiUrl, { statut });
  }
  
  // Changer le type de participation
  changeTypeParticipation(idEnquete: number, type: string): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/changeTypeParticipation/${idEnquete}`;
    return this.http.patch(apiUrl, { typeParticipation: type });
  }
  // Ajouter dans la classe EnqueteService

getTauxReponseAdmin(userId: number): Observable<any> {
  const apiUrl = `${this.baseUrl}/enquete/taux-reponse-admin/${userId}`;
  return this.http.get(apiUrl);
}

getNombreParticipants(userId: number): Observable<any> {
  const apiUrl = `${this.baseUrl}/enquete/participants/${userId}`;
  return this.http.get(apiUrl);
}

getEvolutionReponsesAdmin(userId: number): Observable<any> {
  const apiUrl = `${this.baseUrl}/enquete/evolution-admin/${userId}`;
  return this.http.get(apiUrl);
}

getStatistiquesGlobales(userId: number): Observable<any> {
  const apiUrl = `${this.baseUrl}/enquete/statistiques-globales/${userId}`;
  return this.http.get(apiUrl);
}
}