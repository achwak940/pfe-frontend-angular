import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiurl = "http://localhost:3000/authentification";

  constructor(private http: HttpClient) { }

  // Méthode pour login email/password
  loginPostRequest(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiurl}/login`, { 
      email: email, 
      mot_de_passe: password
    });
  }

  // Méthode pour login avec Google
  loginWithGoogle(token: string): Observable<any> {
    return this.http.post(`${this.apiurl}/google`, { token: token });
  }
}