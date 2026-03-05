import { Component, OnInit } from '@angular/core';
import { QuestionService } from '../question.service';

@Component({
  selector: 'app-gestion-questions',
  templateUrl: './gestion-questions.component.html',
  styleUrls: ['./gestion-questions.component.css']
})
export class GestionQuestionsComponent implements OnInit {
  currentUser!: any;
  userId!: number;
  questions: any[] = [];

  questionTitle: string = '';
  questionType: string = 'multiple';
  questionStatus: string = 'active';
  required: boolean = true;
  options: string[] = ['', ''];

  showToast: boolean = false;

  constructor(private service: QuestionService) { }

  ngOnInit(): void {
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
      this.userId = this.currentUser.id;
      this.getAllQuestions();
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

  addOptions() {
    this.options.push('');
  }

  removeOptions(index: number) {
    this.options.splice(index, 1);
  }

  addQuestion() {
    const optionsFormatted = this.options
      .filter(o => o.trim() !== '')
      .map((o, index) => ({
        texte: o,
        order: index + 1
      }));

    const payload = {
      texte: this.questionTitle,
      type: this.questionType,
      obligatoire: this.required,
      active: this.questionStatus === 'active',
      options: this.questionType === 'text' ? [] : optionsFormatted
    };

    this.service.ajoutquestionAvecDesOptions(payload).subscribe({
      next: () => {
        this.getAllQuestions();
        this.resetForm();
        this.showSuccessToast(); // <-- toast success
      },
      error: (err) => {
        console.error('Erreur ajout question', err);
      }
    });
  }

  resetForm() {
    this.questionTitle = '';
    this.questionType = 'multiple';
    this.questionStatus = 'active';
    this.required = true;
    this.options = ['', ''];
  }

  showSuccessToast() {
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000); // يظهر 3 ثواني
  }
}