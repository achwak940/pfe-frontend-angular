// oublier-mdp.service.ts  ← À placer dans : src/app/oublier-mdp/oublier-mdp.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ForgotPasswordResponse {
  message?: string;
  erreur?: string;
  remainingSeconds?: number;
}

export interface ResetPasswordResponse {
  message?: string;
  erreur?: string;
  expired?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class OublierMdpService {
  private baseUrl = 'http://localhost:3000/authentification';

  constructor(private http: HttpClient) {}

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http
      .post<ForgotPasswordResponse>(`${this.baseUrl}/forgot-password`, { email })
      .pipe(
        map((response: ForgotPasswordResponse) => response),
        catchError(this.handleError),
      );
  }

  resetPassword(token: string, newPassword: string): Observable<ResetPasswordResponse> {
    return this.http
      .post<ResetPasswordResponse>(`${this.baseUrl}/reset-password`, { token, newPassword })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Une erreur est survenue. Veuillez réessayer.';
    if (error.status === 0) {
      message = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
    } else if (error.error?.erreur) {
      message = error.error.erreur;
    } else if (error.error?.message) {
      message = error.error.message;
    }
    return throwError(() => ({ message }));
  }
}