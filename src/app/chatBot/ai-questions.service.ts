import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError, Subject } from 'rxjs';

export interface GenerationEvent {
  id: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  prompt: string;
  result?: string;
  error?: string;
  timestamp: Date;
  progress?: number;
  detectedLanguage?: string;
}

export interface ChatResponse {
  success: boolean;
  data: {
    response: string;
    emotion: string;
    confidence: number;
  };
}

export interface BatchQuestion {
  id: number;
  type: string;
  question: string;
}

export interface BatchResponse {
  success: boolean;
  topic: string;
  count: number;
  questions: BatchQuestion[];
}

@Injectable({
  providedIn: 'root'
})
export class AiQuestionsService {

  private baseUrl = 'http://localhost:3000/ai-questions';
  private eventSource: EventSource | null = null;
  private generationEvents = new Subject<GenerationEvent>();
  private connectionStatus = new Subject<boolean>();
  
  private recognition: any = null;
  private isListening = false;
  private speechEvents = new Subject<string>();

  constructor(
    private http: HttpClient,
    private ngZone: NgZone
  ) {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'fr-FR';
      
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.ngZone.run(() => {
          this.speechEvents.next(transcript);
          this.isListening = false;
        });
      };
      
      this.recognition.onerror = (event: any) => {
        this.ngZone.run(() => {
          console.error('Speech recognition error:', event.error);
          this.isListening = false;
          this.speechEvents.error(event.error);
        });
      };
      
      this.recognition.onend = () => {
        this.ngZone.run(() => {
          this.isListening = false;
        });
      };
    } else {
      console.warn('Speech recognition not supported');
    }
  }

  setSpeechLanguage(lang: string): void {
    if (this.recognition) {
      const langMap: { [key: string]: string } = {
        'fr': 'fr-FR',
        'en': 'en-US',
        'ar': 'ar-SA'
      };
      this.recognition.lang = langMap[lang] || 'fr-FR';
    }
  }

  startListening(): Observable<string> {
    if (!this.recognition) {
      return throwError(() => new Error('Speech recognition not supported'));
    }
    
    if (this.isListening) {
      this.stopListening();
    }
    
    this.isListening = true;
    this.recognition.start();
    
    return this.speechEvents.asObservable();
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  isSpeechSupported(): boolean {
    return this.recognition !== null;
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  // ✅ Chatbot corrigé
  chat(message: string, language: string = 'fr'): Observable<string> {
    return this.http.post<ChatResponse>(`${this.baseUrl}/chat`, {
      message: message,
      language: language
    }).pipe(
      map(response => {
        console.log('Chat response:', response);
        return response.data.response;
      }),
      catchError(error => {
        console.error('Chat error:', error);
        return throwError(() => new Error('Failed to get chat response'));
      })
    );
  }

  // ✅ Génération de question corrigée
  generateQuestion(question: string): Observable<string> {
    return this.http.post<{ result: string }>(`${this.baseUrl}/generate`, {
      question: question
    }).pipe(
      map(response => {
        console.log('Generate response:', response);
        return response.result;
      }),
      catchError(error => {
        console.error('AI Service Error:', error);
        return throwError(() => new Error('Failed to generate question'));
      })
    );
  }

  generateBatchQuestions(topic: string, count: number, language: string = 'fr'): Observable<BatchResponse> {
    return this.http.post<BatchResponse>(`${this.baseUrl}/generate-batch`, {
      topic: topic,
      count: count,
      language: language
    }).pipe(
      catchError(error => {
        console.error('Batch generation error:', error);
        return throwError(() => new Error('Failed to generate batch questions'));
      })
    );
  }

  generateQuestionRealtime(question: string): Observable<GenerationEvent> {
    const subject = new Subject<GenerationEvent>();
    const eventId = Date.now().toString();

    const startEvent: GenerationEvent = {
      id: eventId,
      status: 'pending',
      prompt: question,
      timestamp: new Date(),
      progress: 0
    };
    subject.next(startEvent);

    // Émettre l'état de génération
    const generatingEvent: GenerationEvent = {
      id: eventId,
      status: 'generating',
      prompt: question,
      timestamp: new Date(),
      progress: 50
    };
    subject.next(generatingEvent);

    this.generateQuestion(question).subscribe({
      next: (result) => {
        const completeEvent: GenerationEvent = {
          id: eventId,
          status: 'completed',
          prompt: question,
          result: result,
          timestamp: new Date(),
          progress: 100
        };
        subject.next(completeEvent);
        subject.complete();
      },
      error: (error) => {
        const errorEvent: GenerationEvent = {
          id: eventId,
          status: 'error',
          prompt: question,
          error: error.message,
          timestamp: new Date(),
          progress: 0
        };
        subject.next(errorEvent);
        subject.error(error);
      }
    });

    return subject.asObservable();
  }

  connectToEventStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`${this.baseUrl}/events`);
    
    this.eventSource.onopen = () => {
      this.ngZone.run(() => {
        this.connectionStatus.next(true);
        console.log('✅ Connected to AI event stream');
      });
    };

    this.eventSource.onmessage = (event) => {
      this.ngZone.run(() => {
        try {
          const data: GenerationEvent = JSON.parse(event.data);
          this.generationEvents.next(data);
        } catch (error) {
          console.error('Error parsing event:', error);
        }
      });
    };

    this.eventSource.onerror = (error) => {
      this.ngZone.run(() => {
        this.connectionStatus.next(false);
        console.error('❌ SSE connection error:', error);
        setTimeout(() => this.connectToEventStream(), 5000);
      });
    };
  }

  disconnectFromEventStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.connectionStatus.next(false);
    }
  }

  getRealtimeEvents(): Observable<GenerationEvent> {
    return this.generationEvents.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  getAllGenerations(): Observable<GenerationEvent[]> {
    return this.http.get<GenerationEvent[]>(`${this.baseUrl}/generations`).pipe(
      catchError(error => {
        console.error('Error fetching generations:', error);
        return throwError(() => new Error('Failed to fetch generations'));
      })
    );
  }

  getGenerationById(id: string): Observable<GenerationEvent> {
    return this.http.get<GenerationEvent>(`${this.baseUrl}/generations/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching generation:', error);
        return throwError(() => new Error('Failed to fetch generation'));
      })
    );
  }
}