import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MessangerService, Conversation, Message, User, ApiResponse } from '../messanger.service';

@Component({
  selector: 'app-boite-messanger',
  templateUrl: './boite-messanger.component.html',
  styleUrls: ['./boite-messanger.component.css']
})
export class BoiteMessangerComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Données
  conversations: Conversation[] = [];
  allConversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: any[] = [];
  currentUser: User | null = null;
  
  // UI State
  isLoading = false;
  isLoadingMessages = false;
  isSending = false;
  showUserInfo = false;
  isDarkMode = false;
  
  // Message en cours d'édition
  editingMessage: any = null;
  editingText: string = '';
  
  // Filtres et recherche
  searchQuery = '';
  filterType: 'all' | 'admin' | 'client' | 'expert' = 'all';
  
  // Message
  messageText = '';
  messageSujet = '';
  showSujetInput = false;
  
  // Notifications
  notifications: { id: number; message: string; type: string }[] = [];
  
  // Emojis
  showEmojiPicker = false;
  emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '💀', '👻', '👽', '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'];
  
  private destroy$ = new Subject<void>();
  private refreshInterval: any;

  constructor(
    private messangerService: MessangerService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('[BoiteMessanger] Constructor appelé');
  }

  ngOnInit(): void {
    console.log('[BoiteMessanger] ngOnInit - Démarrage du composant');
    this.initCurrentUser();
    this.loadThemePreference();
    this.startMessagePolling();
  }

  ngOnDestroy(): void {
    console.log('[BoiteMessanger] ngOnDestroy - Nettoyage du composant');
    this.destroy$.next();
    this.destroy$.complete();
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private initCurrentUser(): void {
    console.log('[BoiteMessanger] initCurrentUser - Début');
    this.currentUser = this.messangerService.getCurrentUser();
    console.log('[BoiteMessanger] Utilisateur depuis service:', this.currentUser);
    
    if (!this.currentUser) {
      console.log('[BoiteMessanger] Aucun utilisateur trouvé, création d\'un utilisateur par défaut');
      this.currentUser = { 
        id: 1, 
        prenom: 'John', 
        nom: 'Doe', 
        email: 'john@example.com', 
        online: true,
        statut: 'ACTIF'
      };
      this.messangerService.setCurrentUser(this.currentUser);
    }
    this.loadConversations();
  }

  private startMessagePolling(): void {
    this.refreshInterval = setInterval(() => {
      if (this.currentUser && this.selectedConversation) {
        this.loadMessages(this.currentUser.id, this.selectedConversation.user.id);
        this.loadConversations();
      } else if (this.currentUser) {
        this.loadConversations();
      }
    }, 5000);
  }

  loadConversations(): void {
    if (!this.currentUser) return;
    
    this.isLoading = true;
    this.messangerService.getConversations(this.currentUser.id).subscribe({
      next: (response: ApiResponse<Conversation[]>) => {
        if (response.success && response.data) {
          this.allConversations = response.data;
          this.conversations = [...this.allConversations];
        } else {
          this.allConversations = [];
          this.conversations = [];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('[BoiteMessanger] loadConversations - Erreur:', error);
        this.isLoading = false;
        this.addNotification('Erreur lors du chargement des conversations', 'error');
      }
    });
  }

  onSearchInput(query: string): void {
    this.searchQuery = query;
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      this.conversations = this.allConversations.filter(conv => 
        (conv.user?.prenom?.toLowerCase() || '').includes(searchTerm) ||
        (conv.user?.nom?.toLowerCase() || '').includes(searchTerm) ||
        (conv.user?.email?.toLowerCase() || '').includes(searchTerm) ||
        (conv.dernierMessage?.toLowerCase() || '').includes(searchTerm)
      );
    } else {
      this.conversations = [...this.allConversations];
    }
  }

  loadMessages(userId1: number, userId2: number): void {
    console.log(`[BoiteMessanger] loadMessages - Chargement conversation entre ${userId1} et ${userId2}`);
    this.isLoadingMessages = true;
    
    this.messangerService.getConversation(userId1, userId2).subscribe({
      next: (response: ApiResponse<any[]>) => {
        if (response.success && response.data) {
          this.messages = response.data;
          this.markConversationAsRead();
        } else {
          this.messages = [];
        }
        this.isLoadingMessages = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('[BoiteMessanger] loadMessages - Erreur:', error);
        this.isLoadingMessages = false;
      }
    });
  }

  selectConversation(conversation: Conversation): void {
    console.log('[BoiteMessanger] selectConversation - Conversation sélectionnée:', conversation.user?.prenom, conversation.user?.nom);
    
    this.selectedConversation = conversation;
    if (this.currentUser) {
      this.loadMessages(this.currentUser.id, conversation.user.id);
    }
    this.showUserInfo = false;
    this.messageText = '';
    this.messageSujet = '';
    this.editingMessage = null;
  }

  sendMessage(): void {
    if ((!this.messageText || !this.messageText.trim()) || !this.selectedConversation || !this.currentUser || this.isSending) {
      return;
    }
    
    const contenu = this.messageText.trim();
    const sujet = this.messageSujet.trim() || 'Message';
    
    this.isSending = true;
    
    this.messangerService.sendMessage(this.currentUser.id, this.selectedConversation.user.id, sujet, contenu).subscribe({
      next: (response: ApiResponse<Message>) => {
        if (response.success) {
          if (this.currentUser && this.selectedConversation) {
            this.loadMessages(this.currentUser.id, this.selectedConversation.user.id);
          }
          this.messageText = '';
          this.messageSujet = '';
          this.addNotification('Message envoyé', 'success');
          this.loadConversations();
        } else {
          this.addNotification(response.message || 'Erreur lors de l\'envoi', 'error');
        }
        this.isSending = false;
      },
      error: (error: any) => {
        console.error('[BoiteMessanger] sendMessage - Erreur HTTP:', error);
        this.addNotification('Erreur lors de l\'envoi du message', 'error');
        this.isSending = false;
      }
    });
  }

  // MODIFIER UN MESSAGE
  startEditMessage(message: any): void {
    this.editingMessage = message;
    this.editingText = message.contenu;
  }

  cancelEditMessage(): void {
    this.editingMessage = null;
    this.editingText = '';
  }

  saveEditMessage(): void {
    if (!this.editingMessage || !this.editingText.trim()) {
      this.cancelEditMessage();
      return;
    }
    
    this.messangerService.updateMessage(this.editingMessage.id, { contenu: this.editingText.trim() }).subscribe({
      next: (response: ApiResponse<Message>) => {
        if (response.success) {
          this.addNotification('Message modifié', 'success');
          if (this.currentUser && this.selectedConversation) {
            this.loadMessages(this.currentUser.id, this.selectedConversation.user.id);
          }
        } else {
          this.addNotification(response.message || 'Erreur lors de la modification', 'error');
        }
        this.cancelEditMessage();
      },
      error: (error: any) => {
        console.error('Erreur modification message:', error);
        this.addNotification('Erreur lors de la modification', 'error');
        this.cancelEditMessage();
      }
    });
  }

  // PARTAGE DE LOCALISATION CORRIGÉ
  shareLocation(): void {
    if (navigator.geolocation) {
      this.addNotification('📍 Récupération de votre position...', 'info');
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const { latitude, longitude } = position.coords;
          
          // Créer une URL Google Maps propre
          const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          
          // Message formaté avec emojis et lien cliquable
          const locationMessage = `📍 **Ma position actuelle**\n\n📌 Coordonnées : ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\n🗺️ Voir sur Google Maps :\n${googleMapsUrl}`;
          
          this.messageText = locationMessage;
          this.sendMessage();
          this.addNotification('📍 Position partagée avec succès', 'success');
        },
        (error: GeolocationPositionError) => {
          console.error('Erreur géolocalisation:', error);
          let errorMessage = '❌ Impossible d\'obtenir votre position';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '❌ Permission de géolocalisation refusée';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '📍 Position non disponible';
              break;
            case error.TIMEOUT:
              errorMessage = '⏱️ Délai d\'attente dépassé';
              break;
          }
          this.addNotification(errorMessage, 'error');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      this.addNotification('⚠️ Géolocalisation non supportée par votre navigateur', 'error');
    }
  }

  // Formater les liens dans les messages
  formatMessageWithLinks(text: string): string {
    if (!text) return '';
    
    // Détecter les URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    return text.replace(urlRegex, (url) => {
      // Tronquer l'URL pour l'affichage si elle est trop longue
      let displayUrl = url;
      if (url.length > 60) {
        displayUrl = url.substring(0, 57) + '...';
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-link">${displayUrl}</a>`;
    });
  }

  markConversationAsRead(): void {
    if (!this.currentUser || !this.selectedConversation) return;
    
    const unreadMessages = this.messages.filter(m => !m.lu && !m.estMoi);
    
    if (unreadMessages.length > 0) {
      this.messangerService.markConversationAsRead(this.currentUser.id, this.selectedConversation.user.id).subscribe({
        next: () => {
          if (this.selectedConversation) {
            this.selectedConversation.nonLu = 0;
          }
          this.loadConversations();
        },
        error: (err: any) => console.error('[BoiteMessanger] Erreur marquage:', err)
      });
    }
  }

  deleteConversation(): void {
    if (!this.currentUser || !this.selectedConversation) return;
    
    if (confirm('Voulez-vous vraiment supprimer cette conversation ?')) {
      this.messangerService.deleteConversation(this.currentUser.id, this.selectedConversation.user.id).subscribe({
        next: (response: ApiResponse<null>) => {
          if (response.success) {
            this.addNotification('Conversation supprimée', 'success');
            this.selectedConversation = null;
            this.messages = [];
            this.loadConversations();
          } else {
            this.addNotification(response.message || 'Erreur lors de la suppression', 'error');
          }
        },
        error: (error: any) => {
          console.error('[BoiteMessanger] deleteConversation - Erreur:', error);
          this.addNotification('Erreur lors de la suppression', 'error');
        }
      });
    }
  }

  deleteMessage(messageId: number): void {
    if (confirm('Voulez-vous vraiment supprimer ce message ?')) {
      this.messangerService.deleteMessage(messageId).subscribe({
        next: (response: ApiResponse<null>) => {
          if (response.success && this.currentUser && this.selectedConversation) {
            this.loadMessages(this.currentUser.id, this.selectedConversation.user.id);
            this.addNotification('Message supprimé', 'success');
          }
        },
        error: (error: any) => {
          console.error('[BoiteMessanger] deleteMessage - Erreur:', error);
          this.addNotification('Erreur lors de la suppression', 'error');
        }
      });
    }
  }

  attachFile(): void {
    this.addNotification('L\'envoi de fichiers est temporairement désactivé', 'info');
  }

  onFileSelected(event: Event): void {
    this.addNotification('L\'envoi de fichiers est temporairement désactivé', 'info');
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.conversations = [...this.allConversations];
  }

  filterByType(type: 'all' | 'admin' | 'client' | 'expert'): void {
    console.log('Filtrage désactivé');
  }

  toggleUserInfo(): void {
    this.showUserInfo = !this.showUserInfo;
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('messenger-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('messenger-theme', 'light');
    }
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string): void {
    this.messageText += emoji;
    this.showEmojiPicker = false;
  }

  private addNotification(message: string, type: string = 'info'): void {
    const id = Date.now();
    this.notifications.unshift({ id, message, type });
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
    }, 5000);
  }

  private loadThemePreference(): void {
    const savedTheme = localStorage.getItem('messenger-theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark-mode');
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        const element = this.messageContainer.nativeElement;
        const shouldScroll = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
        if (shouldScroll) {
          element.scrollTop = element.scrollHeight;
        }
      }
    } catch (err) {
      console.error('[BoiteMessanger] Erreur scroll:', err);
    }
  }

  getImageUrl(photoProfil: string | undefined): string {
    if (!photoProfil || photoProfil === 'default' || photoProfil === '') {
      return '';
    }
    
    if (photoProfil.startsWith('http://') || photoProfil.startsWith('https://')) {
      return photoProfil;
    }
    
    let cleanPath = photoProfil;
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    
    return `http://localhost:3000${cleanPath}`;
  }

  onImageError(event: Event, user: any): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement && user) {
      const name = `${user.prenom || ''} ${user.nom || ''}`.trim();
      const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
      const defaultName = initials || 'User';
      imgElement.src = `https://ui-avatars.com/api/?name=${defaultName}&background=9D50BB&color=fff`;
    }
  }

  formatTime(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (diff < 3600000) {
      return `Il y a ${minutes} min`;
    } else if (diff < 86400000) {
      return `Il y a ${hours} h`;
    } else {
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  }

  formatMessageTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }

  getInterlocuteurName(): string {
    if (!this.selectedConversation) return '';
    return `${this.selectedConversation.user.prenom || ''} ${this.selectedConversation.user.nom || ''}`.trim();
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  getRoleBadgeClass(role?: string): string {
    switch(role?.toLowerCase()) {
      case 'admin': return 'role-admin';
      case 'expert': return 'role-expert';
      case 'actif': return 'role-expert';
      default: return 'role-client';
    }
  }

  getRoleLabel(role?: string): string {
    switch(role?.toLowerCase()) {
      case 'admin': return 'Administrateur';
      case 'expert': return 'Expert technique';
      case 'actif': return 'Expert technique';
      default: return 'Client';
    }
  }

  getUserEmail(userId: number): string {
    const conv = this.conversations.find(c => c.user.id === userId);
    return conv?.user.email || '';
  }

  getMessageDate(): string {
    if (this.messages.length > 0 && this.messages[0]?.dateEnvoi) {
      return this.formatDate(this.messages[0].dateEnvoi);
    }
    return "Aujourd'hui";
  }
}