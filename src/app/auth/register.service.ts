import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class RegisterService {
   apiUrl="http://localhost:3000/utilisateur/register"
  constructor(
    private http:HttpClient,
    private router:Router
  ) { }
  registerUtilisateur(user :any):Observable<any>{
   return this.http.post<any>(this.apiUrl, user);

  }
}
