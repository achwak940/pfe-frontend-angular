import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsersRate: number;
}

export interface UserEvolutionData {
  labels: string[];
  newUsers: number[];
  activeUsers: number[];
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsersRate: number;
}

export interface EnqueteDistribution {
  categories: Array<{
    label: string;
    count: number;
    color: string;
    percentage: number;
  }>;
  total: number;
}

export interface EnqueteStats {
  total: number;
  parStatut: {
    brouillon: number;
    publiee: number;
    fermee: number;
    archive: number;
  };
}

export interface ReclamationStats {
  total: number;
  resolues: number;
  en_attente: number;
  taux_resolution: number;
}

export interface DashboardStats {
  users: UserStats;
  enquetes: EnqueteStats;
  reclamations: ReclamationStats;
  participation: number;
}

export interface Notification {
  id: number;
  titre: string;
  contenu: string;
  type: string;
  lu: boolean;
  dateCreation: Date;
  utilisateurId: number;
  messageId?: number;
}

export interface NotificationStats {
  total: number;
  nonLues: number;
  parType: Record<string, number>;
  dernieresNotifications: Notification[];
}

export interface Activity {
  id: number;
  utilisateur: string;
  utilisateurAvatar: string;
  action: string;
  target: string;
  message: string;
  details: string;
  type: string;
  date: Date;
  statusColor: string;
  icon: string;
  timeAgo: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatistiquesService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // ==================== UTILISATEURS ====================
  
  getDashboardUserStats(): Observable<{ success: boolean; data: UserStats }> {
    return this.http.get<{ success: boolean; data: UserStats }>(
      `${this.apiUrl}/utilisateur/stats/dashboard`
    );
  }

  getUserEvolutionData(periode: string = 'month'): Observable<{ success: boolean; data: UserEvolutionData }> {
    return this.http.get<{ success: boolean; data: UserEvolutionData }>(
      `${this.apiUrl}/utilisateur/stats/evolution?periode=${periode}`
    );
  }

  getTotalUsers(): Observable<{ nombreUsersTotal: number }> {
    return this.http.get<{ nombreUsersTotal: number }>(
      `${this.apiUrl}/utilisateur/NombreUsers`
    );
  }

  // ==================== ENQUÊTES ====================

  getEnqueteDistribution(): Observable<{ success: boolean; data: EnqueteDistribution }> {
    return this.http.get<{ success: boolean; data: EnqueteDistribution }>(
      `${this.apiUrl}/enquete/distribution`
    );
  }

  getEnqueteStats(): Observable<{ success: boolean; data: EnqueteStats }> {
    return this.http.get<{ success: boolean; data: EnqueteStats }>(
      `${this.apiUrl}/enquete/stats/chart`
    );
  }

  getTotalEnquetes(): Observable<{ success: boolean; total_enquetes: number }> {
    return this.http.get<{ success: boolean; total_enquetes: number }>(
      `${this.apiUrl}/enquete/count`
    );
  }

  // ==================== RÉCLAMATIONS ====================

  getReclamationStats(): Observable<{ success: boolean; data: ReclamationStats }> {
    return this.http.get<{ success: boolean; data: ReclamationStats }>(
      `${this.apiUrl}/reclamations/stats`
    );
  }

  // ==================== NOTIFICATIONS ====================

  getNotifications(userId: number, limit?: number): Observable<Notification[]> {
    let url = `${this.apiUrl}/notification/user/${userId}`;
    if (limit) {
      url += `?limit=${limit}`;
    }
    return this.http.get<Notification[]>(url);
  }

  getUnreadNotifications(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notification/user/${userId}/unread`);
  }

  countUnreadNotifications(userId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/notification/user/${userId}/unread/count`);
  }

  getRecentNotifications(userId: number, days: number = 7): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notification/user/${userId}/recent?days=${days}`);
  }

  getNotificationStats(userId?: number): Observable<NotificationStats> {
    let url = `${this.apiUrl}/notification/stats`;
    if (userId) {
      url += `?userId=${userId}`;
    }
    return this.http.get<NotificationStats>(url);
  }

  markNotificationAsRead(id: number): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/notification/${id}/read`, {});
  }

  markAllNotificationsAsRead(userId: number): Observable<{ count: number }> {
    return this.http.patch<{ count: number }>(`${this.apiUrl}/notification/user/${userId}/read-all`, {});
  }

  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/notification/${id}`);
  }

  // ==================== ACTIVITÉS RÉCENTES ====================

  getRecentActivities(limit: number = 10): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/activites/recentes?limit=${limit}`);
  }

  getActivitiesByType(type: string, limit: number = 10): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.apiUrl}/activites/type/${type}?limit=${limit}`);
  }

  // ==================== DASHBOARD COMPLET ====================

  getDashboardStats(): Observable<DashboardStats> {
    return new Observable(observer => {
      Promise.all([
        this.getDashboardUserStats().toPromise(),
        this.getEnqueteStats().toPromise(),
        this.getReclamationStats().toPromise()
      ]).then(([users, enquetes, reclamations]) => {
        observer.next({
          users: users?.data || { totalUsers: 0, newUsersThisMonth: 0, activeUsersRate: 0 },
          enquetes: enquetes?.data || { total: 0, parStatut: { brouillon: 0, publiee: 0, fermee: 0, archive: 0 } },
          reclamations: reclamations?.data || { total: 0, resolues: 0, en_attente: 0, taux_resolution: 0 },
          participation: 76
        });
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  // ==================== MÉTHODES UTILITAIRES ====================
  
  formatTimeAgo(date: Date | string): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'à l\'instant';
    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours} h`;
    if (diffDays < 7) return `il y a ${diffDays} j`;
    return past.toLocaleDateString();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'ENQUETE': return 'fa-poll';
      case 'REPONSE': return 'fa-reply-all';
      case 'RECLAMATION': return 'fa-exclamation-triangle';
      case 'MESSAGE': return 'fa-envelope';
      case 'RAPPEL': return 'fa-bell';
      default: return 'fa-info-circle';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'ENQUETE': return '#10b981';
      case 'REPONSE': return '#3b82f6';
      case 'RECLAMATION': return '#ef4444';
      case 'MESSAGE': return '#a855f7';
      case 'RAPPEL': return '#f59e0b';
      default: return '#6b7280';
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'CREATE': return 'fa-plus-circle';
      case 'UPDATE': return 'fa-edit';
      case 'DELETE': return 'fa-trash-alt';
      case 'RESPOND': return 'fa-reply';
      case 'GENERATE': return 'fa-magic';
      case 'CHANGE_STATUS': return 'fa-exchange-alt';
      default: return 'fa-bell';
    }
  }

  getActivityColor(type: string): string {
    switch (type) {
      case 'CREATE': return '#10b981';
      case 'UPDATE': return '#3b82f6';
      case 'DELETE': return '#ef4444';
      case 'RESPOND': return '#a855f7';
      case 'GENERATE': return '#8b5cf6';
      case 'CHANGE_STATUS': return '#f59e0b';
      default: return '#6b7280';
    }
  }
}