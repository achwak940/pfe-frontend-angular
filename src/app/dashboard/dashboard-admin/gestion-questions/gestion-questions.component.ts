import { Component, OnInit } from '@angular/core';
import { json } from 'stream/consumers';
import { QuestionService } from '../question.service';

@Component({
  selector: 'app-gestion-questions',
  templateUrl: './gestion-questions.component.html',
  styleUrls: ['./gestion-questions.component.css']
})
export class GestionQuestionsComponent implements OnInit {
  currentUser!:any
  userId!:number
   questions: any[] = [];
  constructor(private service:QuestionService) { }
  ngOnInit(): void {
    const user=localStorage.getItem('currentUser')
    if(user){
      this.currentUser=JSON.parse(user)
      this.userId=this.currentUser.id
  this.getAllQuestions()
    }
   
  }
  getAllQuestions() {
    this.service.getAllQuestionsByAdmin(this.userId)
      .subscribe({
        next: (res: any) => {
          this.questions = res.data || res; 
          console.log('Questions:', this.questions);
        },
        error: (err) => {
          console.error('Erreur fetching questions', err);
        }
      });
  }
}
