import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UsersService {


  constructor(private http:HttpClient) { }
  exportUsersConnecte(){
  return this.http.get('http://localhost:3000/utilisateur/export-connecte', { responseType: 'blob' })
  }
   exportUsersConnectePdf(){
  return this.http.get('http://localhost:3000/utilisateur/exportPdf-connecte', { responseType: 'blob' })
  }
   exportUsersConnecteCsv(){
  return this.http.get('http://localhost:3000/utilisateur/export-csv', { responseType: 'blob' })
  }

}
