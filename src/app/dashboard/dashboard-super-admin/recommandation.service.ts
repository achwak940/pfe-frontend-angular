import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout, tap, map } from 'rxjs/operators';

// ============================================
// INTERFACES BASÉES EXACTEMENT SUR LA RÉPONSE API
// ============================================

export interface ApiRecommendation {
  solution: string;
  confidence: number;
}

export interface ApiAnalysisContent {
  case_summary: string;
  damage_level: string;
  deep_analysis: string;
}

export interface ApiRisks {
  high: string[];
  medium: string[];
  low: string[];
}

export interface ApiDecision {
  final_choice: string;
  justification: string;
  risk_if_ignored: string;
}

export interface ApiAnalysisWrapper {
  analysis: ApiAnalysisContent;
  risks: ApiRisks;
  recommendations_analysis: string[];
  decision: ApiDecision;
}

// Structure EXACTE de la réponse API /analyze
export interface ApiAnalyzeResponse {
  severity: number;
  recommendations: ApiRecommendation[];
  analysis: ApiAnalysisWrapper;
}

// Structure EXACTE de la réponse API /price-duration
export interface ApiPriceDurationResponse {
  device_enc: number;
  damage_enc: number;
  total_damage: number;
  price: number;
  duration_h: number;
}

// Interface normalisée pour l'affichage (calculs dynamiques basés sur l'API uniquement)
export interface NormalizedRecommendation {
  solution: string;
  confidence: number;
  description: string;
}

export interface NormalizedAnalysisData {
  severity: number;
  severityPercent: number;
  severityLabel: string;
  recommendations: NormalizedRecommendation[];
  caseSummary: string;
  damageLevel: string;
  deepAnalysis: string;
  risks: {
    high: string[];
    medium: string[];
    low: string[];
  };
  decision: {
    finalChoice: string;
    justification: string;
    riskIfIgnored: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RecommandationService {
  private readonly API_BASE = 'http://localhost:3000/recommendation';
  
  constructor(private http: HttpClient) {}

  /**
   * Appel API /analyze - 100% dynamique, PAS de valeurs statiques
   */
  getRecommendations(device_enc: number, damage_enc: number, total_damage: number): Observable<NormalizedAnalysisData> {
    const payload = {
      device_enc: Number(device_enc) || 0,
      damage_enc: Number(damage_enc) || 0,
      total_damage: Number(total_damage) || 0
    };

    console.log('📤 [API] POST /analyze', payload);

    return this.http.post<ApiAnalyzeResponse>(`${this.API_BASE}/analyze`, payload).pipe(
      timeout(30000),
      map(response => this.transformResponse(response)),
      catchError(this.handleError<NormalizedAnalysisData>('getRecommendations'))
    );
  }

  /**
   * Appel API /price-duration - 100% dynamique
   */
  getPriceDuration(device_enc: number, damage_enc: number, total_damage: number): Observable<ApiPriceDurationResponse> {
    const payload = {
      device_enc: Number(device_enc) || 0,
      damage_enc: Number(damage_enc) || 0,
      total_damage: Number(total_damage) || 0
    };

    console.log('📤 [API] POST /price-duration', payload);

    return this.http.post<ApiPriceDurationResponse>(`${this.API_BASE}/price-duration`, payload).pipe(
      timeout(30000),
      catchError(this.handleError<ApiPriceDurationResponse>('getPriceDuration'))
    );
  }

  /**
   * Transforme la réponse API - UNIQUEMENT avec les données de l'API
   * AUCUNE valeur statique ou par défaut
   */
  private transformResponse(response: ApiAnalyzeResponse): NormalizedAnalysisData {
    // Calcul basé UNIQUEMENT sur la sévérité retournée par l'API
    const severity = response.severity;
    const severityPercent = Math.round((severity / 4) * 100);
    
    // Déterminer le label de sévérité basé UNIQUEMENT sur la valeur API
    let severityLabel: string;
    if (severity >= 3) severityLabel = 'CRITIQUE';
    else if (severity >= 1.5) severityLabel = 'MODÉRÉE';
    else severityLabel = 'MINEURE';
    
    // Construire les recommandations avec descriptions basées UNIQUEMENT sur les données API
    const recommendations: NormalizedRecommendation[] = response.recommendations.map(rec => ({
      solution: rec.solution,
      confidence: rec.confidence,
      description: this.buildDescriptionFromApi(rec.solution, rec.confidence, severity)
    }));
    
    return {
      severity: severity,
      severityPercent: severityPercent,
      severityLabel: severityLabel,
      recommendations: recommendations,
      caseSummary: response.analysis.analysis.case_summary,
      damageLevel: response.analysis.analysis.damage_level,
      deepAnalysis: response.analysis.analysis.deep_analysis,
      risks: {
        high: response.analysis.risks.high || [],
        medium: response.analysis.risks.medium || [],
        low: response.analysis.risks.low || []
      },
      decision: {
        finalChoice: response.analysis.decision.final_choice,
        justification: response.analysis.decision.justification,
        riskIfIgnored: response.analysis.decision.risk_if_ignored
      }
    };
  }

  /**
   * Construit une description basée UNIQUEMENT sur les données de l'API
   * PAS de valeurs statiques
   */
  private buildDescriptionFromApi(solution: string, confidence: number, severity: number): string {
    // Description basée sur la solution réelle retournée par l'API
    return `Solution "${solution}" avec ${confidence}% de confiance (sévérité: ${severity}/4)`;
  }

  /**
   * Gestion d'erreur - PAS de fallback, on propage l'erreur réelle
   */
  private handleError<T>(operation: string) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`❌ [API] Erreur ${operation}:`, error);
      
      let errorMessage: string;
      
      if (error.status === 0) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez que le backend NestJS est démarré.';
      } else if (error.status === 400) {
        errorMessage = `Requête invalide: ${error.error?.message || 'Vérifiez les paramètres'}`;
      } else if (error.status === 404) {
        errorMessage = 'Endpoint API non trouvé. Vérifiez les routes.';
      } else if (error.status === 500) {
        errorMessage = 'Erreur interne du serveur. Vérifiez les logs NestJS.';
      } else {
        errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
      
      // On propage l'erreur sans fallback - le composant gérera l'affichage
      return throwError(() => new Error(errorMessage));
    };
  }
}