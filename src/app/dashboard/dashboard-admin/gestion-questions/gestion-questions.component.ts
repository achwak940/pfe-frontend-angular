import { Component, OnInit } from '@angular/core';
import { QuestionService } from '../question.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gestion-questions',
  templateUrl: './gestion-questions.component.html',
  styleUrls: ['./gestion-questions.component.css']
})
export class GestionQuestionsComponent implements OnInit {
  currentUser!: any;
  userId!: number;
  questions: any[] = [];
  filteredQuestions: any[] = []; // Pour le filtrage
  currentFilter: string = 'all'; // Filtre actif

  // Formulaire
  questionTitle: string = '';
  questionType: string = 'multiple';
  questionStatus: string = 'active';
  required: boolean = true;
  options: string[] = ['', ''];
  
  // Configuration pour le type rating (étoiles)
  ratingConfig = {
    maxStars: 5,
    minValue: 1,
    maxValue: 5
  };
  
  // Configuration pour le type scale (échelle)
  scaleConfig = {
    minLabel: 'Pas satisfait',
    maxLabel: 'Très satisfait',
    steps: 5
  };
  
  // État
  showToast: boolean = false;
  toastMessage: string = '';
  isEditing: boolean = false;
  editingQuestionId: number | null = null;

  // Liste des types de questions disponibles
  questionTypes = [
    { value: 'multiple', label: 'Choix multiple', icon: 'fa-list' },
    { value: 'unique', label: 'Choix unique', icon: 'fa-dot-circle' },
    { value: 'text', label: 'Texte libre', icon: 'fa-font' },
    { value: 'rating', label: 'Évaluation par étoiles', icon: 'fa-star' },
    { value: 'scale', label: 'Échelle linéaire', icon: 'fa-chart-line' },
    { value: 'date', label: 'Date', icon: 'fa-calendar' }
  ];

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
          this.questions = res.data || res || [];
          this.filterQuestions(this.currentFilter); // Appliquer le filtre actuel
          console.log('Questions:', this.questions);
        },
        error: (err) => {
          console.error('Erreur fetching questions', err);
        }
      });
  }

  // Méthodes pour les statistiques
  getRatingCount(): number {
    return this.questions.filter(q => q.type === 'rating').length;
  }

  getDateCount(): number {
    return this.questions.filter(q => q.type === 'date').length;
  }

  getScaleCount(): number {
    return this.questions.filter(q => q.type === 'scale').length;
  }

  // Méthode de filtrage
  filterQuestions(filter: string) {
    this.currentFilter = filter;
    if (filter === 'all') {
      this.filteredQuestions = [...this.questions];
    } else if (filter === 'active') {
      this.filteredQuestions = this.questions.filter(q => q.active === true);
    } else if (filter === 'inactive') {
      this.filteredQuestions = this.questions.filter(q => q.active === false);
    }
  }

  // TrackBy function pour éviter la perte de focus
  trackByIndex(index: number, item: string): number {
    return index;
  }

  // Gestion des options
  addOptions() {
    this.options.push('');
    this.options = [...this.options];
  }

  removeOptions(index: number) {
    if (this.options.length > 2) {
      this.options.splice(index, 1);
      this.options = [...this.options];
    }
  }

  onTypeChange() {
    // Réinitialiser les configurations quand on change de type
    if (this.questionType === 'text') {
      this.options = [];
    } else if (this.questionType === 'multiple' || this.questionType === 'unique') {
      if (this.options.length === 0) {
        this.options = ['', ''];
      }
    } else if (this.questionType === 'rating') {
      this.ratingConfig = { maxStars: 5, minValue: 1, maxValue: 5 };
      this.options = [];
    } else if (this.questionType === 'scale') {
      this.scaleConfig = { minLabel: 'Pas satisfait', maxLabel: 'Très satisfait', steps: 5 };
      this.options = [];
    } else if (this.questionType === 'date') {
      this.options = [];
    }
  }

  // Sauvegarder (ajout ou modification)
  saveQuestion() {
    // Validation
    if (!this.questionTitle.trim()) {
      this.showToastMessage('Le titre de la question est requis');
      return;
    }

    if (this.questionType === 'multiple' || this.questionType === 'unique') {
      const validOptions = this.options.filter(o => o.trim() !== '');
      if (validOptions.length < 2) {
        this.showToastMessage('Veuillez ajouter au moins 2 options');
        return;
      }
    }

    const optionsFormatted = this.options
      .filter(o => o.trim() !== '')
      .map((o, index) => ({
        texte: o.trim(),
        order: index + 1
      }));

    const payload: any = {
      texte: this.questionTitle.trim(),
      type: this.questionType,
      obligatoire: this.required,
      active: this.questionStatus === 'active'
    };

    // Ajouter les données selon le type
    if (this.questionType === 'multiple' || this.questionType === 'unique') {
      payload.options = optionsFormatted;
    } else if (this.questionType === 'rating') {
      payload.ratingConfig = this.ratingConfig;
      payload.options = [];
    } else if (this.questionType === 'scale') {
      payload.scaleConfig = this.scaleConfig;
      payload.options = [];
    } else {
      payload.options = [];
    }

    if (this.isEditing && this.editingQuestionId) {
      // Mode modification
      this.service.updateQuestion(this.editingQuestionId, payload).subscribe({
        next: () => {
          this.getAllQuestions();
          this.resetForm();
          this.showToastMessage('Question modifiée avec succès !');
        },
        error: (err) => {
          console.error('Erreur modification question', err);
          this.showToastMessage('Erreur lors de la modification');
        }
      });
    } else {
      // Mode ajout
      this.service.ajoutquestionAvecDesOptions(payload).subscribe({
        next: () => {
          this.getAllQuestions();
          this.resetForm();
          this.showToastMessage('Question ajoutée avec succès !');
        },
        error: (err) => {
          console.error('Erreur ajout question', err);
          this.showToastMessage('Erreur lors de l\'ajout');
        }
      });
    }
  }

  // Éditer une question
  editQuestion(question: any) {
    this.isEditing = true;
    this.editingQuestionId = question.id;
    this.questionTitle = question.texte;
    this.questionType = question.type;
    this.questionStatus = question.active ? 'active' : 'inactive';
    this.required = question.obligatoire;

    // Charger les options si présentes
    if (question.options && question.options.length > 0) {
      this.options = question.options.map((opt: any) => opt.texte);
      while (this.options.length < 2) {
        this.options.push('');
      }
    } else {
      this.options = ['', ''];
    }
    
    // Charger les configurations spécifiques
    if (question.ratingConfig) {
      this.ratingConfig = question.ratingConfig;
    }
    
    if (question.scaleConfig) {
      this.scaleConfig = question.scaleConfig;
    }

    // Scroll vers le formulaire
    setTimeout(() => {
      document.querySelector('.question-form-card')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
  }

  // Annuler l'édition
  cancelEdit() {
    this.resetForm();
  }

  // Supprimer une question
  deleteQuestion(question: any) {
    Swal.fire({
      title: 'Confirmation de suppression',
      html: `Êtes-vous sûr de vouloir supprimer la question : <strong style="color:#9f7aea">"${question.texte}"</strong> ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#9f7aea',
      cancelButtonColor: '#e9d8fd',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      background: '#faf5ff',
      backdrop: `rgba(159, 122, 234, 0.15)`,
      customClass: {
        title: 'swal-title',
        popup: 'swal-popup',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
        icon: 'swal-icon--warning'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.deleteQuestion(question.id).subscribe({
          next: () => {
            this.getAllQuestions();
            Swal.fire({
              title: 'Succès !',
              text: 'Question supprimée avec succès !',
              icon: 'success',
              confirmButtonColor: '#9f7aea',
              confirmButtonText: 'OK',
              timer: 3000,
              timerProgressBar: true,
              background: '#faf5ff',
              customClass: {
                title: 'swal-title',
                popup: 'swal-popup',
                confirmButton: 'swal-confirm-btn',
                icon: 'swal-icon--success'
              }
            });
          },
          error: (err) => {
            console.error('Erreur suppression question', err);
            Swal.fire({
              title: 'Erreur !',
              text: 'Erreur lors de la suppression',
              icon: 'error',
              confirmButtonColor: '#9f7aea',
              confirmButtonText: 'Fermer',
              background: '#faf5ff',
              customClass: {
                title: 'swal-title',
                popup: 'swal-popup',
                confirmButton: 'swal-confirm-btn'
              }
            });
          }
        });
      }
    });
  }

  // Réinitialiser le formulaire
  resetForm() {
    this.questionTitle = '';
    this.questionType = 'multiple';
    this.questionStatus = 'active';
    this.required = true;
    this.options = ['', ''];
    this.ratingConfig = { maxStars: 5, minValue: 1, maxValue: 5 };
    this.scaleConfig = { minLabel: 'Pas satisfait', maxLabel: 'Très satisfait', steps: 5 };
    this.isEditing = false;
    this.editingQuestionId = null;
  }

  // Afficher le toast
  showToastMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  // Helper pour afficher le type en français
  getTypeLabel(type: string): string {
    const types: {[key: string]: string} = {
      'multiple': 'Choix multiple',
      'unique': 'Choix unique',
      'text': 'Texte libre',
      'rating': 'Évaluation étoiles',
      'scale': 'Échelle linéaire',
      'date': 'Date'
    };
    return types[type] || type;
  }
  
  getTypeIcon(type: string): string {
    const icons: {[key: string]: string} = {
      'multiple': 'fa-list',
      'unique': 'fa-dot-circle',
      'text': 'fa-font',
      'rating': 'fa-star',
      'scale': 'fa-chart-line',
      'date': 'fa-calendar'
    };
    return icons[type] || 'fa-question';
  }
  
  // Méthodes pour la prévisualisation
  getStarsArray(maxStars: number): number[] {
    return Array(maxStars).fill(0);
  }
  
  getScalePoints(steps: number): number[] {
    return Array(steps).fill(0);
  }

  // Méthode pour obtenir la classe CSS du bouton de filtre
  getFilterButtonClass(filter: string): string {
    return this.currentFilter === filter ? 'active' : '';
  }
}