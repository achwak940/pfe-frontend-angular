import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { AiQuestionsService, GenerationEvent, BatchResponse } from '../ai-questions.service';
import { Subscription } from 'rxjs';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  status: 'pending' | 'generating' | 'completed' | 'error';
  progress?: number;
}

interface ConversationHistory {
  id: string;
  name: string;
  chatHistory: ChatMessage[];
  timestamp: Date;
}

@Component({
  selector: 'app-ai-question',
  templateUrl: './ai-question.component.html',
  styleUrls: ['./ai-question.component.css']
})
export class AiQuestionComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatMessages') private chatMessagesContainer!: ElementRef;
  
  userInput: string = '';
  result: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  progress: number = 0;
  isConnected: boolean = false;
  isListening: boolean = false;
  selectedLanguage: string = 'fr';
  chatHistory: ChatMessage[] = [];
  isSpeechEnabled: boolean = true;
  
  // Édition de message
  editingMessage: ChatMessage | null = null;
  editContent: string = '';
  
  // Historique des conversations
  showHistoryPanel: boolean = false;
  conversations: ConversationHistory[] = [];
  searchTerm: string = '';
  
  batchMode: boolean = false;
  batchTopic: string = '';
  batchCount: number = 3;
  generatedQuestions: any[] = [];
  
  suggestions: string[] = [
    '🎓 Générer une question sur l\'éducation en ligne',
    '🏥 Créer une question de satisfaction patient',
    '💼 Question sur l\'engagement des employés',
    '🎮 Question sur l\'éthique de l\'IA',
    '🌍 Question sur la sensibilisation au climat'
  ];
  
  suggestionsArabic: string[] = [
    '🎓 توليد سؤال حول التعليم عبر الإنترنت',
    '🏥 إنشاء سؤال حول رضا المرضى',
    '💼 سؤال حول مشاركة الموظفين',
    '🎮 سؤال حول أخلاقيات الذكاء الاصطناعي',
    '🌍 سؤال حول التوعية المناخية'
  ];
  
  languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];
  
  private eventsSubscription: Subscription | null = null;
  private connectionSubscription: Subscription | null = null;
  private speechSubscription: Subscription | null = null;
  private shouldScroll: boolean = true;

  constructor(
    private aiService: AiQuestionsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.connectToRealtime();
    this.loadChatHistory();
    this.loadConversations();
    this.setupSpeechRecognition();
  }

  ngOnDestroy(): void {
    this.disconnectFromRealtime();
    if (this.speechSubscription) {
      this.speechSubscription.unsubscribe();
    }
    this.aiService.stopListening();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.chatMessagesContainer && this.chatMessagesContainer.nativeElement) {
        this.chatMessagesContainer.nativeElement.scrollTop = 
          this.chatMessagesContainer.nativeElement.scrollHeight;
        this.shouldScroll = false;
      }
    } catch(err) {
      console.error('Scroll error:', err);
    }
  }

  private forceScrollToBottom(): void {
    this.shouldScroll = true;
    setTimeout(() => {
      this.scrollToBottom();
    }, 150);
  }

  private setupSpeechRecognition(): void {
    this.aiService.setSpeechLanguage(this.selectedLanguage);
  }

  toggleListening(): void {
    if (this.isListening) {
      this.aiService.stopListening();
      this.isListening = false;
    } else {
      this.startVoiceInput();
    }
  }

  startVoiceInput(): void {
    if (!this.aiService.isSpeechSupported()) {
      this.errorMessage = 'La reconnaissance vocale n\'est pas supportée sur ce navigateur';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.aiService.setSpeechLanguage(this.selectedLanguage);
    if (this.speechSubscription) {
      this.speechSubscription.unsubscribe();
    }
    this.speechSubscription = this.aiService.startListening().subscribe({
      next: (transcript: string) => {
        this.userInput = transcript;
        this.isListening = false;
        this.cdr.detectChanges();
        setTimeout(() => this.generateQuestion(), 500);
      },
      error: (error) => {
        console.error('Speech error:', error);
        this.isListening = false;
        this.errorMessage = 'Erreur de reconnaissance vocale';
        setTimeout(() => this.errorMessage = '', 3000);
        this.cdr.detectChanges();
      }
    });
    this.isListening = true;
    this.cdr.detectChanges();
  }

  changeLanguage(langCode: string): void {
    this.selectedLanguage = langCode;
    this.aiService.setSpeechLanguage(langCode);
    
    if (langCode === 'ar') {
      this.suggestions = this.suggestionsArabic;
    } else {
      this.suggestions = [
        '🎓 Générer une question sur l\'éducation en ligne',
        '🏥 Créer une question de satisfaction patient',
        '💼 Question sur l\'engagement des employés',
        '🎮 Question sur l\'éthique de l\'IA',
        '🌍 Question sur la sensibilisation au climat'
      ];
    }
    
    this.addSystemMessage(`Langue changée vers ${this.languages.find(l => l.code === langCode)?.name}`);
    this.cdr.detectChanges();
    this.forceScrollToBottom();
  }

  toggleBatchMode(): void {
    this.batchMode = !this.batchMode;
    if (!this.batchMode) {
      this.generatedQuestions = [];
    }
  }

  toggleSpeech(): void {
    this.isSpeechEnabled = !this.isSpeechEnabled;
    if (!this.isSpeechEnabled) {
      window.speechSynthesis.cancel();
      this.addSystemMessage('🔇 Synthèse vocale désactivée');
    } else {
      this.addSystemMessage('🔊 Synthèse vocale activée');
    }
    this.cdr.detectChanges();
  }

  generateBatchQuestions(): void {
    if (!this.batchTopic.trim()) {
      this.errorMessage = 'Veuillez entrer un sujet pour les questions';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.loading = true;
    this.generatedQuestions = [];
    this.cdr.detectChanges();
    
    this.aiService.generateBatchQuestions(this.batchTopic, this.batchCount, this.selectedLanguage).subscribe({
      next: (response: BatchResponse) => {
        this.generatedQuestions = response.questions;
        this.loading = false;
        this.addSystemMessage(`✅ ${response.count} questions générées sur le thème: ${response.topic}`);
        this.cdr.detectChanges();
        this.forceScrollToBottom();
      },
      error: (error) => {
        console.error('Batch generation error:', error);
        this.errorMessage = 'Échec de génération des questions';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private connectToRealtime(): void {
    this.aiService.connectToEventStream();
    
    this.eventsSubscription = this.aiService.getRealtimeEvents().subscribe({
      next: (event: GenerationEvent) => {
        this.handleRealtimeEvent(event);
        this.cdr.detectChanges();
        this.forceScrollToBottom();
      },
      error: (error) => {
        console.error('Event stream error:', error);
        this.errorMessage = 'Connexion perdue. Reconnexion...';
        this.cdr.detectChanges();
      }
    });
    
    this.connectionSubscription = this.aiService.getConnectionStatus().subscribe({
      next: (connected: boolean) => {
        this.isConnected = connected;
        if (connected) {
          this.errorMessage = '';
          this.addSystemMessage('✅ Connecté au service AI avec succès');
        } else {
          this.addSystemMessage('⚠️ Connexion au service AI...');
        }
        this.cdr.detectChanges();
        this.forceScrollToBottom();
      }
    });
  }

  private disconnectFromRealtime(): void {
    if (this.eventsSubscription) {
      this.eventsSubscription.unsubscribe();
    }
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
    this.aiService.disconnectFromEventStream();
  }

  private handleRealtimeEvent(event: GenerationEvent): void {
    const existingMessage = this.chatHistory.find(m => m.id === event.id);
    
    if (existingMessage) {
      existingMessage.status = event.status;
      existingMessage.content = event.result || event.error || existingMessage.content;
      existingMessage.progress = event.progress;
    } else if (event.status === 'generating') {
      this.addAIMessageWithId('', event.id, event.status, event.progress);
    }
    
    if (event.status === 'completed' && event.result) {
      this.result = event.result;
      this.loading = false;
      this.progress = 100;
      this.addSystemMessage('✅ Question générée avec succès!');
      this.speakText(event.result);
    }
    
    if (event.status === 'error') {
      this.errorMessage = event.error || 'Échec de génération';
      this.loading = false;
      this.addSystemMessage(`❌ Erreur: ${this.errorMessage}`);
    }
    
    this.cdr.detectChanges();
    this.forceScrollToBottom();
  }

  speakText(text: string): void {
    if (!this.isSpeechEnabled) {
      console.log('Speech synthesis is disabled');
      return;
    }
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (this.selectedLanguage === 'ar') {
        utterance.lang = 'ar-SA';
      } else if (this.selectedLanguage === 'fr') {
        utterance.lang = 'fr-FR';
      } else {
        utterance.lang = 'en-US';
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }

  generateQuestion(): void {
    if (!this.userInput.trim()) {
      this.errorMessage = 'Veuillez entrer une question ou un contexte';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.loading = true;
    this.result = '';
    this.errorMessage = '';
    this.progress = 0;
    this.shouldScroll = true;

    const questionText = this.userInput;
    this.addUserMessage(questionText);
    this.userInput = '';
    this.cdr.detectChanges();
    this.forceScrollToBottom();

    this.aiService.generateQuestion(questionText).subscribe({
      next: (result: string) => {
        console.log('Question générée:', result);
        this.result = result;
        this.loading = false;
        this.progress = 100;
        this.addAIMessage(result);
        this.addSystemMessage('✅ Question générée avec succès!');
        this.speakText(result);
        this.saveToLocalStorage(questionText, result);
        this.saveCurrentConversation();
        this.cdr.detectChanges();
        this.forceScrollToBottom();
      },
      error: (error) => {
        console.error('Generation error:', error);
        this.errorMessage = 'Échec de génération. Veuillez réessayer.';
        this.loading = false;
        this.addSystemMessage('❌ Échec de génération. Veuillez réessayer.');
        this.cdr.detectChanges();
        this.forceScrollToBottom();
      }
    });
  }

  // ✅ Édition d'un message
  editMessage(message: ChatMessage): void {
    console.log('Editing message:', message);
    this.editingMessage = { ...message };
    this.editContent = message.content;
    this.cdr.detectChanges();
  }

  // ✅ Sauvegarde de l'édition
  saveEdit(): void {
    console.log('Saving edit:', this.editContent);
    if (this.editingMessage && this.editContent.trim()) {
      const index = this.chatHistory.findIndex(m => m.id === this.editingMessage!.id);
      if (index !== -1) {
        // Mettre à jour le message
        this.chatHistory[index].content = this.editContent;
        this.chatHistory[index].timestamp = new Date();
        
        // Forcer la détection des changements
        this.chatHistory = [...this.chatHistory];
        
        this.addSystemMessage('✏️ Message modifié avec succès');
        this.saveCurrentConversation();
        this.saveToLocalStorage('', '');
        this.cdr.detectChanges();
        this.forceScrollToBottom();
      }
    }
    this.cancelEdit();
  }

  // ✅ Annuler l'édition
  cancelEdit(): void {
    this.editingMessage = null;
    this.editContent = '';
    this.cdr.detectChanges();
  }

  // ✅ Supprimer un message
  deleteMessage(messageId: string): void {
    const messageToDelete = this.chatHistory.find(m => m.id === messageId);
    if (messageToDelete) {
      this.chatHistory = this.chatHistory.filter(m => m.id !== messageId);
      this.addSystemMessage(`🗑️ Message ${messageToDelete.type === 'user' ? 'utilisateur' : 'IA'} supprimé`);
      this.saveCurrentConversation();
      this.saveToLocalStorage('', '');
      this.cdr.detectChanges();
      this.forceScrollToBottom();
    }
  }

  // ✅ Régénérer une question
  regenerateQuestion(message: ChatMessage): void {
    console.log('Regenerating question for message:', message);
    
    if (message.type === 'user') {
      // Régénérer à partir du message utilisateur
      this.userInput = message.content;
      this.generateQuestion();
    } else if (message.type === 'ai') {
      // Trouver le message utilisateur précédent
      const messageIndex = this.chatHistory.findIndex(m => m.id === message.id);
      let userMessage: ChatMessage | null = null;
      
      // Chercher le message utilisateur avant ce message IA
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (this.chatHistory[i].type === 'user') {
          userMessage = this.chatHistory[i];
          break;
        }
      }
      
      if (userMessage) {
        // Supprimer le message IA actuel
        this.deleteMessage(message.id);
        // Régénérer la réponse
        this.userInput = userMessage.content;
        this.generateQuestion();
      } else {
        this.addSystemMessage('❌ Impossible de régénérer: message utilisateur non trouvé');
      }
    }
  }

  // ✅ Méthodes pour l'historique des conversations
  toggleHistoryPanel(): void {
    this.showHistoryPanel = !this.showHistoryPanel;
    if (this.showHistoryPanel) {
      this.loadConversations();
    }
  }

  loadConversations(): void {
    const saved = localStorage.getItem('conversations');
    if (saved) {
      try {
        this.conversations = JSON.parse(saved);
        this.cdr.detectChanges();
      } catch(e) {
        console.error('Error loading conversations:', e);
      }
    }
  }

  saveCurrentConversation(): void {
    if (this.chatHistory.length === 0) return;
    
    const conversationName = `Conversation du ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    const newConversation: ConversationHistory = {
      id: Date.now().toString(),
      name: conversationName,
      chatHistory: [...this.chatHistory],
      timestamp: new Date()
    };
    
    this.conversations.unshift(newConversation);
    if (this.conversations.length > 20) {
      this.conversations = this.conversations.slice(0, 20);
    }
    localStorage.setItem('conversations', JSON.stringify(this.conversations));
  }

  loadConversation(conversation: ConversationHistory): void {
    this.chatHistory = [...conversation.chatHistory];
    this.cdr.detectChanges();
    this.forceScrollToBottom();
    this.addSystemMessage(`📜 Conversation chargée: ${conversation.name}`);
    this.showHistoryPanel = false;
  }

  deleteConversation(conversationId: string, event: Event): void {
    event.stopPropagation();
    this.conversations = this.conversations.filter(c => c.id !== conversationId);
    localStorage.setItem('conversations', JSON.stringify(this.conversations));
    this.addSystemMessage('🗑️ Conversation supprimée');
  }

  exportChatHistory(): void {
    const data = {
      exportDate: new Date(),
      chatHistory: this.chatHistory,
      totalMessages: this.chatHistory.length,
      language: this.selectedLanguage,
      conversations: this.conversations
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.addSystemMessage('💾 Historique exporté avec succès');
  }

  importChatHistory(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.chatHistory) {
            this.chatHistory = data.chatHistory;
            this.cdr.detectChanges();
            this.forceScrollToBottom();
            this.addSystemMessage('📁 Historique importé avec succès');
            this.saveCurrentConversation();
          }
        } catch(error) {
          console.error('Error importing history:', error);
          this.addSystemMessage('❌ Erreur lors de l\'import');
        }
      };
      reader.readAsText(file);
    }
  }

  clearAllHistory(): void {
    if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
      localStorage.removeItem('chat_history');
      localStorage.removeItem('question_history');
      localStorage.removeItem('conversations');
      this.chatHistory = [];
      this.conversations = [];
      this.addSystemMessage('🗑️ Tout l\'historique a été effacé');
      this.cdr.detectChanges();
    }
  }

  getFilteredConversations(): ConversationHistory[] {
    if (!this.searchTerm) return this.conversations;
    return this.conversations.filter(c => 
      c.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // ✅ Méthodes privées
  private addUserMessage(content: string): void {
    const message: ChatMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: content,
      timestamp: new Date(),
      status: 'completed'
    };
    this.chatHistory = [...this.chatHistory, message];
    this.cdr.detectChanges();
  }

  private addAIMessage(content: string): void {
    const message: ChatMessage = {
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'ai',
      content: content,
      timestamp: new Date(),
      status: 'completed',
      progress: 100
    };
    this.chatHistory = [...this.chatHistory, message];
    this.cdr.detectChanges();
  }

  private addAIMessageWithId(content: string, id: string, status: string, progress?: number): void {
    const message: ChatMessage = {
      id: id,
      type: 'ai',
      content: content,
      timestamp: new Date(),
      status: status as any,
      progress: progress
    };
    this.chatHistory = [...this.chatHistory, message];
    this.cdr.detectChanges();
  }

  private addSystemMessage(content: string): void {
    const message: ChatMessage = {
      id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'system',
      content: content,
      timestamp: new Date(),
      status: 'completed'
    };
    this.chatHistory = [...this.chatHistory, message];
    this.cdr.detectChanges();
    this.forceScrollToBottom();
    
    setTimeout(() => {
      this.chatHistory = this.chatHistory.filter(m => m.id !== message.id);
      this.cdr.detectChanges();
    }, 5000);
  }

  private loadChatHistory(): void {
    const saved = localStorage.getItem('chat_history');
    if (saved) {
      try {
        const history = JSON.parse(saved);
        this.chatHistory = history.slice(-50);
        this.cdr.detectChanges();
        setTimeout(() => this.scrollToBottom(), 200);
      } catch(e) {
        console.error('Error loading chat history:', e);
      }
    }
  }

  private saveToLocalStorage(question: string, answer: string): void {
    try {
      const history = {
        question,
        answer,
        timestamp: new Date(),
        language: this.selectedLanguage
      };
      const saved = localStorage.getItem('question_history') || '[]';
      const questions = JSON.parse(saved);
      questions.unshift(history);
      localStorage.setItem('question_history', JSON.stringify(questions.slice(-50)));
      localStorage.setItem('chat_history', JSON.stringify(this.chatHistory.slice(-50)));
    } catch(e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.addSystemMessage('📋 Copié dans le presse-papier!');
      this.cdr.detectChanges();
    }).catch(err => {
      console.error('Copy failed:', err);
    });
  }

  useSuggestion(suggestion: string): void {
    this.userInput = suggestion;
    this.generateQuestion();
  }

  clearChat(): void {
    if (confirm('Êtes-vous sûr de vouloir effacer la conversation actuelle ?')) {
      this.chatHistory = [];
      this.result = '';
      this.errorMessage = '';
      this.generatedQuestions = [];
      this.batchMode = false;
      this.addSystemMessage('Chat effacé. Prêt pour de nouvelles questions!');
      this.cdr.detectChanges();
      this.forceScrollToBottom();
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'completed': return '✅';
      case 'error': return '❌';
      case 'generating': return '🔄';
      default: return '⏳';
    }
  }

  scrollToBottomManual(): void {
    this.forceScrollToBottom();
  }

  getLanguageIcon(langCode: string): string {
    const icons: { [key: string]: string } = {
      fr: 'fas fa-flag',
      en: 'fas fa-flag-usa',
      ar: 'fas fa-flag'
    };
    return icons[langCode] || 'fas fa-globe';
  }

  getMessageIcon(type: string): string {
    switch(type) {
      case 'user': return 'fas fa-user';
      case 'ai': return 'fas fa-robot';
      case 'system': return 'fas fa-info-circle';
      default: return 'fas fa-comment';
    }
  }
}