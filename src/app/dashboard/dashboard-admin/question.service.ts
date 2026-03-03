import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {

  
  constructor(private http: HttpClient) { }

  getAllQuestionsByAdmin(id: any): Observable<any> {
    const apiurl = `http://localhost:3000/question/user/${id}/question`;
    return this.http.get<any>(apiurl);
  }
 
}
