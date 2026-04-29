import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  photo_profil?: string;
  online?: boolean;
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

  constructor(private http: HttpClient) { }

  sendMessage(messageData: { expediteurId: number; destinataireId: number; sujet: string; contenu: string }): Observable<ApiResponse<Message>> {
    return this.http.post<ApiResponse<Message>>(`${this.apiUrl}/message/send`, messageData);
  }

  getAllUserMessages(userId: number): Observable<ApiResponse<Message[]>> {
    return this.http.get<ApiResponse<Message[]>>(`${this.apiUrl}/message/user/${userId}`);
  }

  getReceivedMessages(userId: number): Observable<ApiResponse<Message[]>> {
    return this.http.get<ApiResponse<Message[]>>(`${this.apiUrl}/message/received/${userId}`);
  }

  getSentMessages(userId: number): Observable<ApiResponse<Message[]>> {
    return this.http.get<ApiResponse<Message[]>>(`${this.apiUrl}/message/sent/${userId}`);
  }

  getConversations(userId: number): Observable<ApiResponse<Conversation[]>> {
    return this.http.get<ApiResponse<Conversation[]>>(`${this.apiUrl}/message/conversations/${userId}`);
  }

  getConversation(userId1: number, userId2: number): Observable<ApiResponse<Message[]>> {
    return this.http.get<ApiResponse<Message[]>>(`${this.apiUrl}/message/conversation/${userId1}/${userId2}`);
  }

  getUnreadCount(userId: number): Observable<ApiResponse<null>> {
    return this.http.get<ApiResponse<null>>(`${this.apiUrl}/message/unread/${userId}`);
  }

  markAsRead(messageId: number): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/message/read/${messageId}`, {});
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

  // Service pour récupérer l'utilisateur connecté
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Erreur parsing utilisateur', e);
        return null;
      }
    }
    return null;
  }

  // Service pour définir l'utilisateur connecté
  setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  // Service pour récupérer l'utilisateur courant depuis l'API
  fetchCurrentUserFromApi(userId: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/utilisateur/${userId}`);
  }
}