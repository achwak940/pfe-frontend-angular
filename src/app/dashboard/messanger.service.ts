import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

// Dans messanger.service.ts
export interface User {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  photo_profil?: string;
  online?: boolean;
  statut?: string;
  telephone?: string; // Ajoutez cette ligne
}

export interface Message {
  id: number;
  expediteurId: number;
  destinataireId: number;
  sujet?: string;
  contenu: string;
  dateEnvoi: Date;
  lu: boolean;
  dateLecture?: Date;
  expediteur?: User;
  destinataire?: User;
  estMoi?: boolean;
}

export interface Conversation {
  user: User;
  dernierMessage: string;
  dateDernierMessage: Date;
  nonLu: number;
  derniereActivite?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MessangerService {
  private apiUrl = 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Erreur parsing utilisateur', e);
      }
    }
  }

  setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  fetchCurrentUserFromApi(userId: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/utilisateur/${userId}`);
  }

  // ==================== MESSAGES ====================

  sendMessage(expediteurId: number, destinataireId: number, sujet: string, contenu: string): Observable<ApiResponse<Message>> {
    return this.http.post<ApiResponse<Message>>(`${this.apiUrl}/message/send`, {
      expediteurId,
      destinataireId,
      sujet,
      contenu
    });
  }

  getAllUserMessages(userId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/message/user/${userId}`);
  }

  getReceivedMessages(userId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/message/received/${userId}`);
  }

  getSentMessages(userId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/message/sent/${userId}`);
  }

  getConversations(userId: number): Observable<ApiResponse<Conversation[]>> {
    return this.http.get<ApiResponse<Conversation[]>>(`${this.apiUrl}/message/conversations/${userId}`);
  }

  getConversation(userId1: number, userId2: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/message/conversation/${userId1}/${userId2}`);
  }

  getUnreadCount(userId: number): Observable<ApiResponse<null>> {
    return this.http.get<ApiResponse<null>>(`${this.apiUrl}/message/unread/${userId}`);
  }

  markAsRead(messageId: number): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/message/read/${messageId}`, {});
  }

  markConversationAsRead(userId: number, interlocuteurId: number): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/message/conversation/read/${userId}/${interlocuteurId}`, {});
  }

  getMessageById(messageId: number): Observable<ApiResponse<Message>> {
    return this.http.get<ApiResponse<Message>>(`${this.apiUrl}/message/${messageId}`);
  }

  updateMessage(messageId: number, updateData: { sujet?: string; contenu?: string; lu?: boolean }): Observable<ApiResponse<Message>> {
    return this.http.patch<ApiResponse<Message>>(`${this.apiUrl}/message/${messageId}`, updateData);
  }

  deleteMessage(messageId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/message/${messageId}`);
  }

  deleteConversation(userId: number, interlocuteurId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/message/conversation/${userId}/${interlocuteurId}`);
  }
  getFullImageUrl(photoProfil: string): string {
  if (!photoProfil || photoProfil === 'default' || photoProfil === '') {
    return '';
  }
  
  // Si l'URL est déjà complète, la retourner directement
  if (photoProfil.startsWith('http://') || photoProfil.startsWith('https://')) {
    return photoProfil;
  }
  
  // Construire l'URL complète pour les images uploadées
  // Note: Votre backend retourne des chemins comme /uploads/profiles/...
  return `http://localhost:3000${photoProfil}`;
}
}