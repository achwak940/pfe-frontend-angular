import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class GereProfilService {
  consulterProfil(userId:number){
        const apiUrl = `http://localhost:3000/utilisateur/profil/${userId}`;
        return this.http.get(apiUrl);
  }
  constructor(private http: HttpClient) { }
  updateUser(userId: number, updatedData: any) {
    const apiUrl = `http://localhost:3000/utilisateur/profil/${userId}`;
    return this.http.patch(apiUrl, updatedData);
}
}