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
  filteredQuestions: any[] = [];
  currentFilter: string = 'all';
    // ... vos autres propriétés
  Math = Math; // Ajoutez cette ligne
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 1;
  paginatedQuestions: any[] = [];

  // Formulaire
  questionTitle: string = '';
  questionType: string = 'multiple';
  questionStatus: string = 'active';
  required: boolean = true;
  options: string[] = ['', ''];
  
  ratingConfig = {
    maxStars: 5,
    minValue: 1,
    maxValue: 5
  };
  
  scaleConfig = {
    minLabel: 'Pas satisfait',
    maxLabel: 'Très satisfait',
    steps: 5
  };
  
  showToast: boolean = false;
  toastMessage: string = '';
  isEditing: boolean = false;
  editingQuestionId: number | null = null;
  searchTerm: string = '';
  sortBy: string = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

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
          this.filterQuestions(this.currentFilter);
        },
        error: (err) => {
          console.error('Erreur fetching questions', err);
        }
      });
  }

  filterQuestions(filter: string) {
    this.currentFilter = filter;
    let filtered = [...this.questions];
    
    // Filtre par statut
    if (filter === 'active') {
      filtered = filtered.filter(q => q.active === true);
    } else if (filter === 'inactive') {
      filtered = filtered.filter(q => q.active === false);
    }
    
    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.texte.toLowerCase().includes(term) ||
        this.getTypeLabel(q.type).toLowerCase().includes(term)
      );
    }
    
    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      if (this.sortBy === 'date') {
        comparison = new Date(a.create_at).getTime() - new Date(b.create_at).getTime();
      } else if (this.sortBy === 'title') {
        comparison = a.texte.localeCompare(b.texte);
      } else if (this.sortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      }
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    this.filteredQuestions = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredQuestions.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedQuestions = this.filteredQuestions.slice(startIndex, endIndex);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      // Scroll to top of questions list
      document.querySelector('.questions-header')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  getPagesArray(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getRatingCount(): number {
    return this.questions.filter(q => q.type === 'rating').length;
  }

  getDateCount(): number {
    return this.questions.filter(q => q.type === 'date').length;
  }

  getScaleCount(): number {
    return this.questions.filter(q => q.type === 'scale').length;
  }

  getActiveCount(): number {
    return this.questions.filter(q => q.active === true).length;
  }

  getInactiveCount(): number {
    return this.questions.filter(q => q.active === false).length;
  }

  trackByIndex(index: number, item: string): number {
    return index;
  }

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

  saveQuestion() {
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

  editQuestion(question: any) {
    this.isEditing = true;
    this.editingQuestionId = question.id;
    this.questionTitle = question.texte;
    this.questionType = question.type;
    this.questionStatus = question.active ? 'active' : 'inactive';
    this.required = question.obligatoire;

    if (question.options && question.options.length > 0) {
      this.options = question.options.map((opt: any) => opt.texte);
      while (this.options.length < 2) {
        this.options.push('');
      }
    } else {
      this.options = ['', ''];
    }
    
    if (question.ratingConfig) {
      this.ratingConfig = question.ratingConfig;
    }
    
    if (question.scaleConfig) {
      this.scaleConfig = question.scaleConfig;
    }

    setTimeout(() => {
      document.querySelector('.question-form-card')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 100);
  }

  cancelEdit() {
    this.resetForm();
  }

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

  showToastMessage(message: string) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

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
  
  getStarsArray(maxStars: number): number[] {
    return Array(maxStars).fill(0);
  }
  
  getScalePoints(steps: number): number[] {
    return Array(steps).fill(0);
  }

  getFilterButtonClass(filter: string): string {
    return this.currentFilter === filter ? 'active' : '';
  }

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.filterQuestions(this.currentFilter);
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterQuestions(this.currentFilter);
  }

  exportToCSV() {
    const headers = ['ID', 'Titre', 'Type', 'Statut', 'Obligatoire', 'Date de création'];
    const data = this.filteredQuestions.map(q => [
      q.id,
      q.texte,
      this.getTypeLabel(q.type),
      q.active ? 'Active' : 'Inactive',
      q.obligatoire ? 'Oui' : 'Non',
      new Date(q.create_at).toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'questions_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    this.showToastMessage('Export CSV effectué avec succès !');
  }
}