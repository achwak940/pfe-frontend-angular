import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnqueteService {

  constructor(private http:HttpClient) { }
    getAllEnquete(id: any): Observable<any[]> {
    const apiUrl = `http://localhost:3000/utilisateur/enquetes/${id}`;
    return this.http.get<any[]>(apiUrl); // pas de "id" ici
  }
  addNewEnqueteVide(data:any){
    const aipurl= `http://localhost:3000/enquete/creation`
    return this.http.post<any>(aipurl,data)
  }
  updateEnquete(data:any,id:any){
    const apiurl=`http://localhost:3000/enquete/update/${id}`
    return this.http.patch<any>(apiurl,data)

  }
   getEnqueteById(id:any){
      const apiurl=`http://localhost:3000/enquete/${id}`
      return this.http.get(apiurl)
    }
    supprimerEnquete(id:any){
      const apiurl=``
      return this.http.delete(apiurl)

    }
}
