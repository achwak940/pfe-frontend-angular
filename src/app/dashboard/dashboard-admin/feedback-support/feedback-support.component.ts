import { Component, OnInit, OnDestroy } from '@angular/core';
import { Feedback, FeedbackService } from '../feedback.service';

@Component({
  selector: 'app-feedback-support',
  templateUrl: './feedback-support.component.html',
  styleUrls: ['./feedback-support.component.css']
})
export class FeedbackSupportComponent implements OnInit, OnDestroy {

  feedbacks: Feedback[] = [];
  filteredFeedbacks: Feedback[] = [];
  currentUserId: number = 0;

  // Stats
  total = 0;
  enCours = 0;
  resolus = 0;
  nouveaux = 0;
  annules = 0;

  statsData = [
    { icon: 'fas fa-envelope', value: 0, label: 'Total', color: '#9D50BB' },
    { icon: 'fas fa-clock', value: 0, label: 'En cours', color: '#f39c12' },
    { icon: 'fas fa-check-circle', value: 0, label: 'Résolus', color: '#2ecc71' },
    { icon: 'fas fa-ban', value: 0, label: 'Annulés', color: '#95a5a6' }
  ];

  typeStats = [
    { label: 'Suggestions', color: '#9D50BB', count: 0, percent: 0, icon: '💡' },
    { label: 'Problèmes', color: '#f39c12', count: 0, percent: 0, icon: '🐛' },
    { label: 'Questions', color: '#3498db', count: 0, percent: 0, icon: '❓' }
  ];

  // Filtres
  searchText: string = '';
  filterType: string = '';
  filterStatut: string = '';
  filterEnquete: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  Math = Math;

  // Modal
  showDetailModal: boolean = false;
  showAddFeedbackModal: boolean = false;
  showAllActivitiesModal: boolean = false;
  selectedFeedback: Feedback | null = null;
  replyText: string = '';
  isSubmitting: boolean = false;
  surveysList: any[] = [];

  // Nouveau feedback
  newFeedback = {
    type: 'suggestion' as 'suggestion' | 'probleme_technique' | 'question',
    message: '',
    enqueteId: null as number | null
  };

  // Activity
  activityPeriod: string = '7';
  activities: any[] = [];
  recentActivities: any[] = [];
  allActivities: any[] = [];
  displayActivities: any[] = [];

  // Toasts
  toasts: any[] = [];
  private refreshInterval: any;

  constructor(private feedbackService: FeedbackService) { }

  ngOnInit(): void {
    this.getCurrentUser();
    this.loadFeedbacks();
    this.startActivitySimulation();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  getCurrentUser(): void {
    const user = localStorage.getItem('currentUser');
    if (user) {
      const currentUser = JSON.parse(user);
      this.currentUserId = currentUser.id;
    }
  }

  loadFeedbacks() {
    if (!this.currentUserId) {
      console.error('User ID not found');
      return;
    }
    
    this.feedbackService.getFeedbacksForAdmin(this.currentUserId).subscribe({
      next: (data: Feedback[]) => {
        this.feedbacks = data;
        this.applyFilters();
        this.computeStats();
        this.updatePagination();
        this.updateTypeStats();
        this.updateRecentActivities();
        this.showToast('Succès', `${data.length} feedbacks chargés`, 'success');
      },
      error: (err: any) => {
        console.error('Erreur chargement feedbacks:', err);
        this.showToast('Erreur', 'Impossible de charger les feedbacks', 'error');
      }
    });
  }

  startActivitySimulation() {
    this.refreshInterval = setInterval(() => {
      const newActivity = this.generateRandomActivity();
      this.allActivities.unshift(newActivity);
      this.recentActivities = this.allActivities.slice(0, 20);
      this.displayActivities = this.recentActivities.slice(0, 5);
      
      if (newActivity.isNew) {
        this.showToast('Nouvelle activité', newActivity.text, 'info');
      }
    }, 60000);
  }

  generateRandomActivity(): any {
    const actions = ['Nouveau feedback reçu', 'Feedback mis à jour', 'Ticket résolu', 'Réponse envoyée', 'Ticket annulé'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    return {
      icon: 'fas fa-envelope',
      text: randomAction,
      time: new Date(),
      isNew: true
    };
  }

  updateRecentActivities() {
    const activities: any[] = [];
    
    this.feedbacks.slice(0, 10).forEach((fb) => {
      const date = new Date(fb.date_creation);
      const now = new Date();
      const diffHours = (now.getTime() - date.getTime()) / (1000 * 3600);
      
      if (diffHours < 24) {
        let icon = 'fas fa-envelope';
        if (fb.statut === 'resolu') icon = 'fas fa-check-circle';
        if (fb.statut === 'annule') icon = 'fas fa-ban';
        if (fb.statut === 'en_cours') icon = 'fas fa-clock';
        
        activities.push({
          icon: icon,
          text: `${this.getStatusLabel(fb.statut)} - ${fb.utilisateur?.nom || 'Anonyme'}: ${fb.message.substring(0, 50)}...`,
          time: date,
          isNew: diffHours < 1
        });
      }
    });
    
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    
    this.allActivities = activities;
    this.recentActivities = activities;
    this.displayActivities = activities.slice(0, 5);
  }

  viewAllActivities() {
    this.showAllActivitiesModal = true;
  }

  closeActivityModal() {
    this.showAllActivitiesModal = false;
  }

  refreshData() {
    this.loadFeedbacks();
    this.showToast('Info', 'Données actualisées', 'info');
  }

  printTable() {
    window.print();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchText || this.filterType || this.filterStatut || this.filterEnquete);
  }

  applyFilters() {
    let filtered = [...this.feedbacks];

    if (this.searchText) {
      const searchLower = this.searchText.toLowerCase();
      filtered = filtered.filter(fb => 
        fb.message?.toLowerCase().includes(searchLower) ||
        fb.utilisateur?.nom?.toLowerCase().includes(searchLower) ||
        fb.utilisateur?.email?.toLowerCase().includes(searchLower)
      );
    }

    if (this.filterType) {
      filtered = filtered.filter(fb => fb.type === this.filterType);
    }

    if (this.filterStatut) {
      filtered = filtered.filter(fb => fb.statut === this.filterStatut);
    }

    if (this.filterEnquete) {
      filtered = filtered.filter(fb => fb.enquete?.titre === this.filterEnquete);
    }

    this.filteredFeedbacks = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredFeedbacks.length / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1;
  }

  getPaginatedFeedbacks(): Feedback[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredFeedbacks.slice(startIndex, endIndex);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  computeStats() {
    this.total = this.feedbacks.length;
    this.nouveaux = this.feedbacks.filter(fb => fb.statut === 'nouveau').length;
    this.enCours = this.feedbacks.filter(fb => fb.statut === 'en_cours').length;
    this.resolus = this.feedbacks.filter(fb => fb.statut === 'resolu').length;
    this.annules = this.feedbacks.filter(fb => fb.statut === 'annule').length;
    
    this.statsData = [
      { icon: 'fas fa-envelope', value: this.total, label: 'Total', color: '#9D50BB' },
      { icon: 'fas fa-clock', value: this.enCours, label: 'En cours', color: '#f39c12' },
      { icon: 'fas fa-check-circle', value: this.resolus, label: 'Résolus', color: '#2ecc71' },
      { icon: 'fas fa-ban', value: this.annules, label: 'Annulés', color: '#95a5a6' }
    ];
  }

  updateTypeStats() {
    const suggestionCount = this.getTypeCount('suggestion');
    const problemCount = this.getTypeCount('probleme_technique');
    const questionCount = this.getTypeCount('question');
    const total = this.total || 1;
    
    this.typeStats = [
      { label: 'Suggestions', color: '#9D50BB', count: suggestionCount, percent: Math.round((suggestionCount / total) * 100), icon: '💡' },
      { label: 'Problèmes', color: '#f39c12', count: problemCount, percent: Math.round((problemCount / total) * 100), icon: '🐛' },
      { label: 'Questions', color: '#3498db', count: questionCount, percent: Math.round((questionCount / total) * 100), icon: '❓' }
    ];
  }

  markResolved(fb: Feedback) {
    if (!fb.id) return;
    
    if (confirm('Marquer ce feedback comme résolu ?')) {
      this.feedbackService.updateFeedback(fb.id, { statut: 'resolu' }).subscribe({
        next: () => {
          fb.statut = 'resolu';
          this.computeStats();
          this.applyFilters();
          this.updateTypeStats();
          this.showToast('Succès', 'Feedback marqué comme résolu', 'success');
          this.updateRecentActivities();
          this.addActivity(`Feedback #${fb.id} marqué comme résolu`, 'fas fa-check-circle');
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour', err);
          this.showToast('Erreur', 'Impossible de mettre à jour le statut', 'error');
        }
      });
    }
  }

  cancelTicket(fb: Feedback) {
    if (!fb.id) return;
    
    if (confirm('Voulez-vous vraiment annuler ce ticket ?')) {
      this.feedbackService.updateFeedback(fb.id, { statut: 'annule' }).subscribe({
        next: () => {
          fb.statut = 'annule';
          this.computeStats();
          this.applyFilters();
          this.updateTypeStats();
          this.showToast('Info', 'Ticket annulé avec succès', 'info');
          this.updateRecentActivities();
          this.addActivity(`Ticket #${fb.id} annulé`, 'fas fa-ban');
          
          if (this.showDetailModal && this.selectedFeedback?.id === fb.id) {
            this.selectedFeedback.statut = 'annule';
          }
        },
        error: (err) => {
          console.error('Erreur lors de l\'annulation', err);
          this.showToast('Erreur', 'Impossible d\'annuler le ticket', 'error');
        }
      });
    }
  }

  reopenTicket(fb: Feedback) {
    if (!fb.id) return;
    
    if (confirm('Réouvrir ce ticket ?')) {
      this.feedbackService.updateFeedback(fb.id, { statut: 'nouveau' }).subscribe({
        next: () => {
          fb.statut = 'nouveau';
          this.computeStats();
          this.applyFilters();
          this.updateTypeStats();
          this.showToast('Succès', 'Ticket réouvert avec succès', 'success');
          this.updateRecentActivities();
          this.addActivity(`Ticket #${fb.id} réouvert`, 'fas fa-folder-open');
          
          if (this.showDetailModal && this.selectedFeedback?.id === fb.id) {
            this.selectedFeedback.statut = 'nouveau';
          }
        },
        error: (err) => {
          console.error('Erreur lors de la réouverture', err);
          this.showToast('Erreur', 'Impossible de réouvrir le ticket', 'error');
        }
      });
    }
  }

  deleteFeedback(fb: Feedback) {
    if (!confirm('Voulez-vous vraiment supprimer ce feedback ?')) return;
    if (!fb.id) return;

    this.feedbackService.deleteFeedback(fb.id).subscribe({
      next: () => {
        this.feedbacks = this.feedbacks.filter(f => f.id !== fb.id);
        this.applyFilters();
        this.computeStats();
        this.updateTypeStats();
        this.showToast('Succès', 'Feedback supprimé avec succès', 'success');
        this.updateRecentActivities();
        this.addActivity(`Feedback #${fb.id} supprimé`, 'fas fa-trash');
        
        if (this.showDetailModal && this.selectedFeedback?.id === fb.id) {
          this.closeModal();
        }
      },
      error: (err) => {
        console.error('Erreur lors de la suppression', err);
        this.showToast('Erreur', 'Impossible de supprimer le feedback', 'error');
      }
    });
  }

  viewDetails(fb: Feedback) {
    this.selectedFeedback = { ...fb };
    this.replyText = '';
    this.showDetailModal = true;
  }

  closeModal() {
    this.showDetailModal = false;
    this.selectedFeedback = null;
    this.replyText = '';
  }

  updateStatus(fb: Feedback) {
    if (!fb.id) return;
    
    this.feedbackService.updateFeedback(fb.id, { statut: fb.statut }).subscribe({
      next: () => {
        this.computeStats();
        this.applyFilters();
        this.updateTypeStats();
        this.showToast('Succès', 'Statut mis à jour', 'success');
        this.updateRecentActivities();
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du statut', err);
        this.showToast('Erreur', 'Impossible de mettre à jour le statut', 'error');
      }
    });
  }

  sendReply() {
    if (!this.replyText.trim()) {
      this.showToast('Attention', 'Veuillez écrire une réponse', 'warning');
      return;
    }

    if (!this.selectedFeedback?.id) return;

    this.showToast('Succès', 'Réponse envoyée avec succès', 'success');
    this.updateRecentActivities();
    this.addActivity(`Réponse envoyée au feedback #${this.selectedFeedback.id}`, 'fas fa-reply');
    
    if (this.selectedFeedback.statut === 'nouveau') {
      this.selectedFeedback.statut = 'en_cours';
      this.updateStatus(this.selectedFeedback);
    }
    
    this.replyText = '';
  }

  openNewFeedbackModal() {
    this.newFeedback = {
      type: 'suggestion',
      message: '',
      enqueteId: null
    };
    this.showAddFeedbackModal = true;
    this.loadSurveysForFeedback();
  }

  closeAddFeedbackModal() {
    this.showAddFeedbackModal = false;
    this.newFeedback = {
      type: 'suggestion',
      message: '',
      enqueteId: null
    };
  }

  loadSurveysForFeedback() {
    this.feedbackService.getFeedbacksForAdmin(this.currentUserId).subscribe({
      next: (data: Feedback[]) => {
        const surveysMap = new Map();
        data.forEach(fb => {
          if (fb.enquete?.id && fb.enquete?.titre && !surveysMap.has(fb.enquete.id)) {
            surveysMap.set(fb.enquete.id, {
              id: fb.enquete.id,
              titre: fb.enquete.titre
            });
          }
        });
        this.surveysList = Array.from(surveysMap.values());
      },
      error: (err) => console.error('Erreur chargement enquêtes:', err)
    });
  }

  submitFeedback() {
    if (!this.newFeedback.message.trim()) {
      this.showToast('Attention', 'Veuillez saisir un message', 'warning');
      return;
    }

    this.isSubmitting = true;

    const feedbackData: any = {
      type: this.newFeedback.type,
      message: this.newFeedback.message
    };

    if (this.currentUserId) {
      feedbackData.utilisateurId = this.currentUserId;
    }

    if (this.newFeedback.enqueteId) {
      feedbackData.enqueteId = this.newFeedback.enqueteId;
    }

    this.feedbackService.createFeedback(feedbackData).subscribe({
      next: (newFeedback: Feedback) => {
        this.isSubmitting = false;
        this.closeAddFeedbackModal();
        this.showToast('Succès', 'Feedback ajouté avec succès', 'success');
        this.loadFeedbacks();
        
        this.addActivity(`Nouveau feedback ajouté (${this.getTypeLabel(newFeedback.type)})`, 'fas fa-plus-circle');
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Erreur lors de l\'ajout du feedback:', err);
        this.showToast('Erreur', 'Impossible d\'ajouter le feedback', 'error');
      }
    });
  }

  resetFilters() {
    this.searchText = '';
    this.filterType = '';
    this.filterStatut = '';
    this.filterEnquete = '';
    this.applyFilters();
    this.showToast('Info', 'Filtres réinitialisés', 'info');
  }

  exportData() {
    const dataToExport = this.filteredFeedbacks.map(fb => ({
      'ID': fb.id,
      'Utilisateur': fb.utilisateur?.nom || 'Anonyme',
      'Email': fb.utilisateur?.email || '-',
      'Type': this.getTypeLabel(fb.type),
      'Message': fb.message,
      'Statut': this.getStatusLabel(fb.statut),
      'Date': fb.date_creation,
      'Enquête': fb.enquete?.titre || '-'
    }));

    const csv = this.convertToCSV(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `feedbacks_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showToast('Succès', 'Export effectué avec succès', 'success');
  }

  convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  getUniqueEnquetes(): any[] {
    const enquetes = new Map();
    this.feedbacks.forEach(fb => {
      if (fb.enquete?.id && fb.enquete?.titre) {
        enquetes.set(fb.enquete.id, fb.enquete);
      }
    });
    return Array.from(enquetes.values());
  }

  getTypeCount(type: string): number {
    return this.feedbacks.filter(fb => fb.type === type).length;
  }

  getResolutionRate(): number {
    if (this.total === 0) return 0;
    return Math.round((this.resolus / this.total) * 100);
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'suggestion': 'Suggestion',
      'probleme_technique': 'Problème technique',
      'question': 'Question'
    };
    return labels[type] || type;
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'suggestion': '💡',
      'probleme_technique': '🐛',
      'question': '❓'
    };
    return icons[type] || '📌';
  }

  getTypeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'suggestion': 'suggestion',
      'probleme_technique': 'issue',
      'question': 'question'
    };
    return classes[type] || '';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'nouveau': 'Nouveau',
      'en_cours': 'En cours',
      'resolu': 'Résolu',
      'annule': 'Annulé'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'nouveau': 'new',
      'en_cours': 'in-progress',
      'resolu': 'resolved',
      'annule': 'cancelled'
    };
    return classes[status] || '';
  }

  updateActivity() {
    const days = parseInt(this.activityPeriod);
    const activityData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const randomCount = Math.floor(Math.random() * 20) + 1;
      activityData.push({
        label: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        count: randomCount
      });
    }
    
    this.activities = activityData;
  }

  getActivityData(): any[] {
    return this.activities;
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} jours`;
  }

  addActivity(text: string, icon: string) {
    this.allActivities.unshift({
      icon: icon,
      text: text,
      time: new Date(),
      isNew: true
    });
    this.recentActivities = this.allActivities.slice(0, 20);
    this.displayActivities = this.recentActivities.slice(0, 5);
  }

  removeToast(toast: any) {
    this.toasts = this.toasts.filter(t => t.id !== toast.id);
  }

  showToast(title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      info: 'fas fa-info-circle',
      warning: 'fas fa-exclamation-triangle'
    };
    
    const toast = {
      id: Date.now(),
      title,
      message,
      type,
      icon: icons[type]
    };
    
    this.toasts.push(toast);
    
    setTimeout(() => {
      this.removeToast(toast);
    }, 5000);
  }

  copyToClipboard(text: string) {
    if (!text) {
      this.showToast('Info', 'Aucun email à copier', 'info');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Succès', 'Email copié dans le presse-papier', 'success');
    }).catch(() => {
      this.showToast('Erreur', 'Impossible de copier', 'error');
    });
  }
}