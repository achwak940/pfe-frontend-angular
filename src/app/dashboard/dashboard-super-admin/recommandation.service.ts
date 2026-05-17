import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Recommendation {
  solution: string;
  confidence: number;
}

export interface AnalysisResponse {
  severity: number;
  recommendations: Recommendation[];
  analysis: {
    analysis: {
      case_summary: string;
      damage_level: string;
      deep_analysis: string;
    };
    risks: {
      high: string[];
      medium: string[];
      low: string[];
    };
    recommendations_analysis: any[];
    decision: {
      final_choice: string;
      justification: string;
      risk_if_ignored: string;
    };
  };
}

export interface PriceDurationResponse {
  price: number;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecommandationService {
  private readonly API_URL = 'http://localhost:3000/recommendation';

  constructor(private http: HttpClient) { }

  getRecommendations(device_enc: number, damage_enc: number, total_damage: number): Observable<AnalysisResponse> {
    return this.http.post<AnalysisResponse>(`${this.API_URL}/analyze`, {
      device_enc,
      damage_enc,
      total_damage
    });
  }

  getPriceDuration(device_enc: number, damage_enc: number, total_damage: number): Observable<PriceDurationResponse> {
    return this.http.post<PriceDurationResponse>(`${this.API_URL}/price-duration`, {
      device_enc,
      damage_enc,
      total_damage
    });
  }
}