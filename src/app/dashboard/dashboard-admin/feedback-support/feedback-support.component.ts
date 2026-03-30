import { Component, OnInit } from '@angular/core';
import { Feedback, FeedbackService } from '../feedback.service';

@Component({
  selector: 'app-feedback-support',
  templateUrl: './feedback-support.component.html',
  styleUrls: ['./feedback-support.component.css']
})
export class FeedbackSupportComponent implements OnInit {

  feedbacks: Feedback[] = [];
  filteredFeedbacks: Feedback[] = [];

  // Stats
  total = 0;
  enCours = 0;
  resolus = 0;
  nouveaux = 0;

  // Stats data for header
  statsData = [
    { icon: 'fas fa-envelope', value: 0, label: 'Total' },
    { icon: 'fas fa-clock', value: 0, label: 'En cours' },
    { icon: 'fas fa-check-circle', value: 0, label: 'Résolus' }
  ];

  // Type stats for pie chart
  typeStats = [
    { label: 'Suggestions', color: '#9D50BB', count: 0, percent: 0 },
    { label: 'Problèmes', color: '#f39c12', count: 0, percent: 0 },
    { label: 'Questions', color: '#3498db', count: 0, percent: 0 }
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
  Math = Math; // Expose Math to template

  // Modal
  showDetailModal: boolean = false;
  showAllActivities: boolean = false;
  selectedFeedback: Feedback | null = null;
  replyText: string = '';

  // Activity
  activityPeriod: string = '7';
  activities: any[] = [];
  recentActivities: any[] = [];
  allActivities: any[] = [];
  displayActivities: any[] = [];

  // Toasts
  toasts: any[] = [];

  constructor(private feedbackService: FeedbackService) { }

  ngOnInit(): void {
    this.loadFeedbacks();
    this.loadActivities();
    this.startActivitySimulation();
  }

  loadFeedbacks() {
    this.feedbackService.getAllFeedbacks().subscribe((data: Feedback[]) => {
      this.feedbacks = data;
      this.applyFilters();
      this.computeStats();
      this.updatePagination();
      this.updateTypeStats();
    });
  }

  loadActivities() {
    this.updateActivity();
    this.updateRecentActivities();
  }

  startActivitySimulation() {
    // Simuler des activités toutes les 30 secondes
    setInterval(() => {
      const newActivity = this.generateRandomActivity();
      this.allActivities.unshift(newActivity);
      this.recentActivities = this.allActivities.slice(0, 20);
      this.displayActivities = this.recentActivities.slice(0, 5);
      
      // Afficher une notification toast pour les nouvelles activités
      if (newActivity.isNew) {
        this.showToast('Nouvelle activité', newActivity.text, 'info');
      }
    }, 30000);
  }

  generateRandomActivity(): any {
    const actions = [
      'Nouveau feedback reçu',
      'Feedback mis à jour',
      'Ticket résolu',
      'Réponse envoyée',
      'Statut modifié'
    ];
    const users = ['Jean Dupont', 'Marie Martin', 'Pierre Lambert', 'Sophie Bernard', 'Lucas Moreau'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    
    return {
      icon: this.getRandomIcon(),
      text: `${randomAction} de ${randomUser}`,
      time: new Date(),
      isNew: true
    };
  }

  getRandomIcon(): string {
    const icons = ['fas fa-envelope', 'fas fa-check-circle', 'fas fa-reply', 'fas fa-edit'];
    return icons[Math.floor(Math.random() * icons.length)];
  }

  updateRecentActivities() {
    // Simuler des activités récentes basées sur les feedbacks
    const activities = [];
    
    this.feedbacks.slice(0, 10).forEach((fb, index) => {
      const date = new Date(fb.date_creation);
      const now = new Date();
      const diffHours = (now.getTime() - date.getTime()) / (1000 * 3600);
      
      if (diffHours < 24) {
        activities.push({
          icon: 'fas fa-envelope',
          text: `Nouveau feedback de ${fb.utilisateur?.nom || 'Anonyme'}`,
          time: date,
          isNew: diffHours < 1
        });
      }
    });
    
    // Ajouter des activités simulées si nécessaire
    if (activities.length < 5) {
      for (let i = 0; i < 5 - activities.length; i++) {
        const date = new Date();
        date.setMinutes(date.getMinutes() - (i + 1) * 30);
        activities.push({
          icon: 'fas fa-info-circle',
          text: `Activité système #${i + 1}`,
          time: date,
          isNew: i === 0
        });
      }
    }
    
    // Trier par date décroissante
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    
    this.allActivities = activities;
    this.recentActivities = activities;
    this.displayActivities = activities.slice(0, 5);
  }

  viewAllActivities() {
    this.showAllActivities = true;
  }

  closeActivityModal() {
    this.showAllActivities = false;
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
    
    // Update statsData for header
    this.statsData = [
      { icon: 'fas fa-envelope', value: this.total, label: 'Total' },
      { icon: 'fas fa-clock', value: this.enCours, label: 'En cours' },
      { icon: 'fas fa-check-circle', value: this.resolus, label: 'Résolus' }
    ];
  }

  updateTypeStats() {
    const suggestionCount = this.getTypeCount('suggestion');
    const problemCount = this.getTypeCount('probleme_technique');
    const questionCount = this.getTypeCount('question');
    const total = this.total || 1;
    
    this.typeStats = [
      { label: 'Suggestions', color: '#9D50BB', count: suggestionCount, percent: Math.round((suggestionCount / total) * 100) },
      { label: 'Problèmes', color: '#f39c12', count: problemCount, percent: Math.round((problemCount / total) * 100) },
      { label: 'Questions', color: '#3498db', count: questionCount, percent: Math.round((questionCount / total) * 100) }
    ];
  }

  markResolved(fb: Feedback) {
    if (!fb.id) return;
    
    this.feedbackService.updateFeedback(fb.id, { statut: 'resolu' }).subscribe({
      next: () => {
        fb.statut = 'resolu';
        this.computeStats();
        this.applyFilters();
        this.updateTypeStats();
        this.showToast('Succès', 'Feedback marqué comme résolu', 'success');
        this.addActivity(`Feedback #${fb.id} marqué comme résolu`, 'fa-check-circle');
        this.updateRecentActivities();
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour', err);
        this.showToast('Erreur', 'Impossible de mettre à jour le statut', 'error');
      }
    });
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
        this.addActivity(`Feedback #${fb.id} supprimé`, 'fa-trash');
        this.updateRecentActivities();
        
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
        this.addActivity(`Statut du feedback #${fb.id} changé en ${fb.statut}`, 'fa-edit');
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

    console.log('Envoi de la réponse:', {
      feedbackId: this.selectedFeedback.id,
      reply: this.replyText,
      to: this.selectedFeedback.utilisateur?.email
    });

    this.showToast('Succès', 'Réponse envoyée avec succès', 'success');
    this.addActivity(`Réponse envoyée au feedback #${this.selectedFeedback.id}`, 'fa-reply');
    this.updateRecentActivities();
    
    if (this.selectedFeedback.statut === 'nouveau') {
      this.selectedFeedback.statut = 'en_cours';
      this.updateStatus(this.selectedFeedback);
    }
    
    this.replyText = '';
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
    link.setAttribute('download', `feedbacks_${new Date().toISOString()}.csv`);
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

  getTypeOffset(): number {
    const total = this.feedbacks.length;
    if (total === 0) return 283;
    const suggestionCount = this.getTypeCount('suggestion');
    const percentage = (suggestionCount / total) * 100;
    return 283 - (283 * percentage / 100);
  }

  getResolutionRate(): number {
    if (this.total === 0) return 0;
    return Math.round((this.resolus / this.total) * 100);
  }

  getResolutionOffset(): number {
    const rate = this.getResolutionRate();
    return 339 - (339 * rate / 100);
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'suggestion': 'Suggestion',
      'probleme_technique': 'Problème technique',
      'question': 'Question',
      'autre': 'Autre'
    };
    return labels[type] || type;
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'suggestion': '💡',
      'probleme_technique': '🐛',
      'question': '❓',
      'autre': '📝'
    };
    return icons[type] || '📌';
  }

  getTypeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'suggestion': 'suggestion',
      'probleme_technique': 'issue',
      'question': 'question',
      'autre': 'autre'
    };
    return classes[type] || '';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'nouveau': '🆕',
      'en_cours': '⏳',
      'resolu': '✅',
      'ignore': '⏭️'
    };
    return icons[status] || 'fas fa-flag';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'nouveau': 'Nouveau',
      'en_cours': 'En cours',
      'resolu': 'Résolu',
      'ignore': 'Ignoré'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'nouveau': 'new',
      'en_cours': 'in-progress',
      'resolu': 'resolved',
      'ignore': 'ignored'
    };
    return classes[status] || '';
  }

  updateActivity() {
    const days = parseInt(this.activityPeriod);
    const activityData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      activityData.push({
        label: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        count: Math.floor(Math.random() * 20) + 1
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
    const newActivity = {
      icon: `fas ${icon}`,
      text: text,
      time: new Date(),
      isNew: true
    };
    
    this.allActivities.unshift(newActivity);
    this.recentActivities = this.allActivities.slice(0, 20);
    this.displayActivities = this.recentActivities.slice(0, 5);
    
    this.showToast('Nouvelle activité', text, 'info');
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

  removeToast(toast: any) {
    this.toasts = this.toasts.filter(t => t.id !== toast.id);
  }

  openNewTicket() {
    this.showToast('Info', 'Fonctionnalité à venir', 'info');
  }
}