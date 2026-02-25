import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardAdminService {
  constructor(private http:HttpClient) { }
   getAllEnquete(id: any): Observable<any[]> {
    const apiUrl = `http://localhost:3000/utilisateur/enquetes/${id}`;
    return this.http.get<any[]>(apiUrl); // pas de "id" ici
  }
   
}
