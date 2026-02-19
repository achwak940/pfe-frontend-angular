import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiurl="http://localhost:3000/authentification/login"

  constructor(
    private http:HttpClient
  ) { }
  //cette methode pour test api post pour login 
loginPostRequest(email: string, password: string): Observable<any> {
  return this.http.post(this.apiurl, { 
    email: email, 
    mot_de_passe: password // correspondance exacte avec backend
  });
}

}
