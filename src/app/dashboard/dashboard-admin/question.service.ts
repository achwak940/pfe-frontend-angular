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
  ajoutquestionAvecDesOptions(data:any){
    const apiurl='http://localhost:3000/question/add/options'
    return this.http.post(apiurl,data)
  }
    updateQuestion(id: number, data: any): Observable<any> {
    const apiurl = `http://localhost:3000/question/modifierQuestion/${id}`;
    return this.http.patch(apiurl, data);
  }
 deleteQuestion(id: number): Observable<any> {
  const apiurl = `http://localhost:3000/question/remove/${id}`;
  return this.http.delete(apiurl);
}
}
