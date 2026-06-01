// src/app/dashboard/dashboard-admin/users.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  // ========== MÉTHODES D'EXPORT ==========
  exportUsersConnecte(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/utilisateur/export-connecte`, { responseType: 'blob' });
  }

  exportUsersConnectePdf(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/utilisateur/exportPdf-connecte`, { responseType: 'blob' });
  }

  exportUsersConnecteCsv(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/utilisateur/export-csv`, { responseType: 'blob' });
  }

  // ========== MÉTHODES DE PARTAGE ==========

  getAllShareInfo(enqueteId: number, userId?: number): Observable<any> {
    let url = `${this.apiUrl}/enquete/${enqueteId}/share/all`;
    if (userId) url += `?userId=${userId}`;
    return this.http.get(url);
  }

  sendEnqueteByEmailWithTemplate(enqueteId: number, emails: string[], customMessage?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/enquete/${enqueteId}/send/email`, { emails, customMessage });
  }

  sendEnqueteToUsers(enqueteId: number, userIds: number[], customMessage?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/enquete/${enqueteId}/send/users`, { userIds, customMessage });
  }

  downloadQRCode(enqueteId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/enquete/${enqueteId}/share/qrcode`, { responseType: 'blob' });
  }

  getQRCodeUrl(enqueteId: number): string {
    return `${this.apiUrl}/enquete/${enqueteId}/share/qrcode`;
  }

  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  }

  isNativeShareAvailable(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.share;
  }

  async shareNative(data: { title: string; text: string; url: string }): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  shareOnFacebook(url: string): void {
    const encodedUrl = encodeURIComponent(url);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
  }

  shareOnMessenger(url: string): void {
    const encodedUrl = encodeURIComponent(url);
    window.open(`https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=&redirect_uri=${encodedUrl}`, '_blank');
  }

  async shareOnInstagram(url: string): Promise<void> {
    await this.copyToClipboard(url);
  }

  shareOnWhatsApp(phoneNumber: string | null, message: string): void {
    const encoded = encodeURIComponent(message);
    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  }
}