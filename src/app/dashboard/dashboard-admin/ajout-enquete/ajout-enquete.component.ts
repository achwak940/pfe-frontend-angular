import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { EnqueteService } from '../enquete.service';
import { QuestionService } from '../question.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ajout-enquete',
  templateUrl: './ajout-enquete.component.html',
  styleUrls: ['./ajout-enquete.component.css']
})
export class AjoutEnqueteComponent implements OnInit {
  enqueteForm!: FormGroup;
  today = new Date().toISOString().split('T')[0];
  msgSuccess = "";
    currentUser!: any;
    userID!:number
  // Questions
  availableQuestions: any[] = [];
  selectedQuestions: any[] = [];
  showNewQuestionForm = false;
  currentUserId!:number

  // Types de questions
  questionTypes = [
    { value: 'TEXTE', label: 'Réponse texte' },
    { value: 'CHOIX_UNIQUE', label: 'Choix unique' },
    { value: 'CHOIX_MULTIPLE', label: 'Choix multiple' },
    { value: 'NOTE', label: 'Note (1-5)' }
  ];

  // Nouvelle question
  newQuestionForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private enqueteService: EnqueteService,
    private questionService: QuestionService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initNewQuestionForm();
     const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
      this.userID = this.currentUser.id;
    }
     this.loadAvailableQuestions();
  }

  initForm(): void {
    this.enqueteForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['', [Validators.minLength(10)]],
      dateFin: ['', Validators.required],
      questions: this.fb.array([])
    });
  }

  initNewQuestionForm(): void {
    this.newQuestionForm = this.fb.group({
      texte: ['', Validators.required],
      type: ['TEXTE', Validators.required],
      options: this.fb.array([])
    });
  }

  get questionsFormArray(): FormArray {
    return this.enqueteForm.get('questions') as FormArray;
  }

  get optionsFormArray(): FormArray {
    return this.newQuestionForm.get('options') as FormArray;
  }

  loadAvailableQuestions(): void {
    this.questionService.getAllQuestionsByAdmin(this.currentUserId).subscribe({
      next: (res: any) => {
        this.availableQuestions = res || [];
      },
      error: (err) => {
        console.error('Erreur chargement questions', err);
      }
    });
  }

  // Vérifier si une question est sélectionnée
  isQuestionSelected(question: any): boolean {
    return this.selectedQuestions.some(q => q.id === question.id);
  }

  // Gestion des questions existantes
  addExistingQuestion(question: any): void {
    if (!this.isQuestionSelected(question)) {
      this.selectedQuestions.push(question);
      this.questionsFormArray.push(this.fb.group({
        id: [question.id],
        texte: [question.texte],
        type: [question.type],
        isExisting: [true]
      }));
    }
  }

  removeExistingQuestion(index: number): void {
    this.selectedQuestions.splice(index, 1);
    this.questionsFormArray.removeAt(index);
  }

  // Gestion des nouvelles questions
  toggleNewQuestionForm(): void {
    this.showNewQuestionForm = !this.showNewQuestionForm;
    if (!this.showNewQuestionForm) {
      this.resetNewQuestionForm();
    }
  }

  addOption(): void {
    this.optionsFormArray.push(this.fb.control('', Validators.required));
  }

  removeOption(index: number): void {
    this.optionsFormArray.removeAt(index);
  }

  saveNewQuestion(): void {
    if (this.newQuestionForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulaire incomplet',
        text: 'Veuillez remplir tous les champs de la question'
      });
      return;
    }

    const newQuestion = {
      texte: this.newQuestionForm.value.texte,
      type: this.newQuestionForm.value.type,
      options: this.newQuestionForm.value.options || [],
      isNew: true
    };

    this.selectedQuestions.push(newQuestion);
    this.questionsFormArray.push(this.fb.group({
      texte: [newQuestion.texte],
      type: [newQuestion.type],
      options: [newQuestion.options],
      isNew: [true]
    }));

    this.toggleNewQuestionForm();
    this.resetNewQuestionForm();

    Swal.fire({
      icon: 'success',
      title: 'Question ajoutée',
      text: 'La question a été ajoutée à l\'enquête',
      timer: 1500,
      showConfirmButton: false
    });
  }

  resetNewQuestionForm(): void {
    this.newQuestionForm.reset({ type: 'TEXTE' });
    while (this.optionsFormArray.length) {
      this.optionsFormArray.removeAt(0);
    }
  }

  // Soumission - CORRIGÉE pour correspondre au format attendu par l'API
  addEnquete(): void {
    const formValue = this.enqueteForm.value;
 
    
    // Format attendu par l'API backend
    const enqueteData: any = {
      titre: formValue.titre,
      description: formValue.description,
      dateFin: formValue.dateFin,
       userId: this.userID
    };

    // Ajouter les questions si elles existent
    if (this.selectedQuestions.length > 0) {
      enqueteData.questions = this.selectedQuestions.map(q => {
        if (q.id) {
          // Question existante - envoyer seulement l'id
          return { id: q.id };
        } else {
          // Nouvelle question - envoyer toutes les données
          return {
            texte: q.texte,
            type: q.type,
            options: q.options || []
          };
        }
      });
    }

    console.log('Données envoyées à l\'API:', enqueteData); // Pour déboguer

    this.enqueteService.addNewEnqueteVide(enqueteData).subscribe({
      next: (res: any) => {
        console.log('Réponse de l\'API:', res); // Pour déboguer
        
        Swal.fire({
          icon: 'success',
          title: 'Succès 🎉',
          text: res.message || 'Enquête créée avec succès',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        });
        
        this.enqueteForm.reset();
        this.selectedQuestions = [];
        this.questionsFormArray.clear();
      },
      error: (err: any) => {
        console.error('Erreur API:', err); // Pour déboguer
        
        Swal.fire({
          icon: 'error',
          title: 'Erreur ❌',
          text: err.error?.message || 'Une erreur est survenue',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  onSubmit(): void {
    if (this.enqueteForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.enqueteForm.controls).forEach(key => {
        this.enqueteForm.get(key)?.markAsTouched();
      });
      
      Swal.fire({
        icon: 'warning',
        title: 'Formulaire incomplet',
        text: 'Veuillez remplir tous les champs obligatoires',
        confirmButtonColor: '#f39c12'
      });
      return;
    }
    this.addEnquete();
  }
}