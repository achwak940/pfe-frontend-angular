import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { Message, MessangerService, User, ApiResponse } from '../messanger.service';

@Component({
  selector: 'app-messanger',
  templateUrl: './messanger.component.html',
  styleUrls: ['./messanger.component.css']
})
export class MessangerComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  @Input() recipientUser: User | null = null;
  @Output() close = new EventEmitter<void>();
  
  // Utilisateur courant récupéré dynamiquement
  currentUser: User | null = null;
  currentUserId: number = 0;
  
  messages: Message[] = [];
  newMessage: string = '';
  sujet: string = '';
  sending: boolean = false;
  loading: boolean = false;
  isTyping: boolean = false;
  autoScroll: boolean = true;
  refreshInterval: any;
  
  notification: { type: string; message: string; show: boolean } = {
    type: 'success',
    message: '',
    show: false
  };
  
  private subscriptions: Subscription[] = [];
  private notificationTimeout: any;
  private typingTimeout: any;

  constructor(private messangerService: MessangerService) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    
    if (this.recipientUser && this.currentUser) {
      this.loadMessages();
      this.startAutoRefresh();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  ngAfterViewChecked(): void {
    if (this.autoScroll && this.messagesContainer) {
      this.scrollToBottom();
    }
  }

  loadCurrentUser(): void {
    // Récupérer l'utilisateur connecté depuis le service
    const user = this.messangerService.getCurrentUser();
    
    if (user && user.id) {
      this.currentUser = user;
      this.currentUserId = user.id;
    } else {
      // Fallback: essayer de récupérer depuis sessionStorage
      const sessionUser = sessionStorage.getItem('currentUser');
      if (sessionUser) {
        try {
          this.currentUser = JSON.parse(sessionUser);
          this.currentUserId = this.currentUser!.id;
        } catch (e) {
          console.error('Erreur chargement utilisateur session', e);
          this.loadDefaultUser();
        }
      } else {
        this.loadDefaultUser();
      }
    }
  }

  loadDefaultUser(): void {
    // Utilisateur par défaut si aucun n'est connecté (pour développement)
    this.currentUser = {
      id: 1,
      prenom: 'Jean',
      nom: 'Dupont',
      email: 'jean.dupont@email.com',
      online: true
    };
    this.currentUserId = 1;
    
    // Optionnel: sauvegarder l'utilisateur par défaut
    this.messangerService.setCurrentUser(this.currentUser);
  }

  startAutoRefresh(): void {
    // Rafraîchir les messages toutes les 5 secondes
    this.refreshInterval = setInterval(() => {
      if (this.recipientUser && !this.sending && this.currentUser) {
        this.refreshMessages();
      }
    }, 5000);
  }

  loadMessages(): void {
    if (!this.recipientUser || !this.currentUser) return;
    
    this.loading = true;
    
    const sub = this.messangerService.getConversation(this.currentUserId, this.recipientUser.id).subscribe({
      next: (response: ApiResponse<Message[]>) => {
        if (response.success && response.data) {
          const oldMessagesCount = this.messages.length;
          this.messages = response.data.map((msg: Message) => ({
            ...msg,
            dateEnvoi: new Date(msg.dateEnvoi),
            estMoi: msg.expediteurId === this.currentUserId
          }));
          
          // Vérifier si de nouveaux messages sont arrivés
          if (this.messages.length > oldMessagesCount) {
            this.showNotification('info', 'Nouveaux messages');
            this.scrollToBottom();
          }
          
          // Marquer les messages non lus comme lus
          this.markUnreadMessagesAsRead();
        } else if (!response.success) {
          this.showNotification('error', response.message || 'Erreur chargement messages');
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur chargement messages:', error);
        this.showNotification('error', 'Erreur lors du chargement des messages');
        this.loading = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  markUnreadMessagesAsRead(): void {
    if (!this.currentUser) return;
    
    const unreadMessages = this.messages.filter(
      msg => msg.destinataireId === this.currentUserId && !msg.lu
    );
    
    unreadMessages.forEach(msg => {
      const sub = this.messangerService.markAsRead(msg.id).subscribe({
        next: () => {
          msg.lu = true;
        },
        error: (error: any) => {
          console.error('Erreur marquage message:', error);
        }
      });
      this.subscriptions.push(sub);
    });
  }

  scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.messagesContainer?.nativeElement) {
          this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
        }
      }, 100);
    } catch (err) { 
      console.error('Erreur scroll:', err);
    }
  }

  onTyping(): void {
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.isTyping = true;
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
    }, 1000);
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.recipientUser || !this.currentUser) return;
    
    this.sending = true;
    
    const messageData = {
      expediteurId: this.currentUserId,
      destinataireId: this.recipientUser.id,
      sujet: this.sujet || 'Message',
      contenu: this.newMessage
    };
    
    const sub = this.messangerService.sendMessage(messageData).subscribe({
      next: (response: ApiResponse<Message>) => {
        if (response.success && response.data) {
          const newMsg: Message = {
            id: response.data.id,
            expediteurId: this.currentUserId,
            destinataireId: this.recipientUser!.id,
            contenu: this.newMessage,
            sujet: this.sujet,
            dateEnvoi: new Date(response.data.dateEnvoi),
            lu: false,
            estMoi: true
          };
          
          this.messages.push(newMsg);
          this.newMessage = '';
          this.sujet = '';
          this.autoScroll = true;
          
          this.showNotification('success', 'Message envoyé avec succès');
          this.scrollToBottom();
        } else {
          this.showNotification('error', response.message || 'Erreur lors de l\'envoi');
        }
        this.sending = false;
      },
      error: (error: any) => {
        console.error('Erreur envoi message:', error);
        this.showNotification('error', 'Erreur lors de l\'envoi du message');
        this.sending = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  refreshMessages(): void {
    if (!this.loading) {
      this.loadMessages();
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  private showNotification(type: string, message: string): void {
    this.notification = { type, message, show: true };
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(() => {
      this.notification.show = false;
    }, 3000);
  }

  closeNotification(): void {
    this.notification.show = false;
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
  }

  formatTime(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const today = new Date();
    const msgDate = new Date(date);
    
    today.setHours(0, 0, 0, 0);
    msgDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return msgDate.toLocaleDateString('fr-FR', { weekday: 'long' });
    } else {
      return msgDate.toLocaleDateString('fr-FR');
    }
  }

  isCurrentUser(message: Message): boolean {
    return message.expediteurId === this.currentUserId;
  }

  shouldShowDateSeparator(index: number): boolean {
    if (index === 0) return true;
    const currentDate = new Date(this.messages[index].dateEnvoi).toDateString();
    const previousDate = new Date(this.messages[index - 1].dateEnvoi).toDateString();
    return currentDate !== previousDate;
  }

  getMessageStatus(message: Message): string {
    if (!this.isCurrentUser(message)) return '';
    return message.lu ? 'Lu' : 'Envoyé';
  }
  // Ajoutez cette méthode pour construire l'URL complète de l'image
getImageUrl(photoProfil: string): string {
  if (!photoProfil || photoProfil === 'default' || photoProfil === '') {
    return '';
  }
  
  // Si l'URL est déjà complète, la retourner directement
  if (photoProfil.startsWith('http://') || photoProfil.startsWith('https://')) {
    return photoProfil;
  }
  
  // Construire l'URL complète pour les images uploadées
  // Ajustez le chemin selon votre backend
  return `http://localhost:3000/${photoProfil}`;
}

// Méthode pour gérer les erreurs de chargement d'image
onImageError(): void {
  // Si l'image ne se charge pas, on va afficher l'avatar par défaut
  if (this.recipientUser) {
    this.recipientUser.photo_profil = '';
  }
}
}