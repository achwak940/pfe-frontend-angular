import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StatistiqueUserTotalService {

  constructor(private http:HttpClient) { }
  getNombreAllUsers(){
    return this.http.get('http://localhost:3000/utilisateur/NombreUsers');
  }
  getNombreAllUsersActifs(){
    return this.http.get('http://localhost:3000/utilisateur/NombreUsers/actifs')
  }
  getNombreAllUsersInactifs(){
    return this.http.get('http://localhost:3000/utilisateur/NombreUsers/Inactifs')
  }
   getNombreAllAdmins(){
    return this.http.get('http://localhost:3000/utilisateur/Nombre/Admins');
  }
  getAllUsers(){
    return this.http.get("http://localhost:3000/utilisateur/get/all")
  }
}
