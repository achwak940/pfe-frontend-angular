import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { QuestionService } from '../question.service';
import Swal from 'sweetalert2';
import { EnqueteService } from '../enquete.service';

declare var webkitSpeechRecognition: any;

interface GeneratedQuestion {
  texte: string;
  type: string;
  options: string[];
  required: boolean;
  language?: string;
}

interface GeneratedSurvey {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
  language: string;
}

@Component({
  selector: 'app-ajout-enquete',
  templateUrl: './ajout-enquete.component.html',
  styleUrls: ['./ajout-enquete.component.css']
})
export class AjoutEnqueteComponent implements OnInit, OnDestroy {
  enqueteForm!: FormGroup;
  today = new Date().toISOString().split('T')[0];
  currentUser!: any;
  userID!: number;
  
  // IA Mode
  iaModeEnabled = false;
  iaPrompt = '';
  isGenerating = false;
  numberOfQuestions = 5;
  availableQuestionCounts = [3, 5, 7, 10, 15];
  selectedLanguage: string = 'fr';
  
  // Langues supportées
  languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
    { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
    { code: 'tn', name: 'Tunisien', flag: '🇹🇳', dir: 'ltr' },
    
  ];
  
  // Synthèse vocale
  isListening = false;
  recognition: any;
  currentListeningField = '';
  
  // Questions
  availableQuestions: any[] = [];
  selectedQuestions: any[] = [];
  showNewQuestionForm = false;
  editingQuestionIndex: number | null = null;
  
  questionTypes = [
    { value: 'TEXTE', label: '📝 Réponse texte', icon: 'fa-font', hasOptions: false, needsRating: false },
    { value: 'CHOIX_UNIQUE', label: '🔘 Choix unique', icon: 'fa-circle-dot', hasOptions: true, needsRating: false },
    { value: 'CHOIX_MULTIPLE', label: '☑️ Choix multiple', icon: 'fa-check-square', hasOptions: true, needsRating: false },
    { value: 'NOTE', label: '⭐ Note (1-5)', icon: 'fa-star', hasOptions: false, needsRating: true }
  ];

  newQuestionForm!: FormGroup;

  // Empêcher les doubles appels
  private isGeneratingSurvey = false;
  private currentSwal: any = null;

  constructor(
    private fb: FormBuilder,
    private enqueteService: EnqueteService,
    private questionService: QuestionService
  ) {
    this.initSpeechRecognition();
  }

  ngOnInit(): void {
    this.initForm();
    this.initNewQuestionForm();
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
      this.userID = this.currentUser.id;
    }
    this.loadAvailableQuestions();
  }

  ngOnDestroy(): void {
    if (this.currentSwal) {
      this.currentSwal.close();
    }
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  initForm(): void {
    this.enqueteForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['', [Validators.minLength(10)]],
      dateFin: ['', Validators.required],
      typeParticipation: ['PUBLIC', Validators.required]
    });
  }

  initNewQuestionForm(): void {
    this.newQuestionForm = this.fb.group({
      texte: ['', Validators.required],
      type: ['TEXTE', Validators.required],
      options: this.fb.array([])
    });
    
    this.newQuestionForm.get('type')?.valueChanges.subscribe((type) => {
      this.updateOptionsVisibility(type);
    });
  }

  updateOptionsVisibility(type: string): void {
    const questionType = this.questionTypes.find(t => t.value === type);
    if (questionType?.hasOptions && this.optionsFormArray.length === 0) {
      this.addOption();
      this.addOption();
    } else if (!questionType?.hasOptions) {
      while (this.optionsFormArray.length) {
        this.optionsFormArray.removeAt(0);
      }
    }
  }

  get optionsFormArray(): FormArray {
    return this.newQuestionForm.get('options') as FormArray;
  }

  loadAvailableQuestions(): void {
    this.questionService.getAllQuestionsByAdmin(this.userID).subscribe({
      next: (res: any) => {
        this.availableQuestions = res || [];
      },
      error: (err) => {
        console.error('Erreur chargement questions', err);
      }
    });
  }

  // ==================== SYNTHÈSE VOCALE RAPIDE ====================
  
  private initSpeechRecognition(): void {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      
      this.recognition.onstart = () => {
        this.isListening = true;
      };
      
      this.recognition.onend = () => {
        setTimeout(() => {
          this.isListening = false;
        }, 500);
      };
      
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        
        if (this.currentListeningField === 'iaPrompt') {
          this.iaPrompt = transcript;
        } else if (this.currentListeningField === 'questionText') {
          this.newQuestionForm.patchValue({ texte: transcript });
        }
        
        this.isListening = false;
        this.currentListeningField = '';
      };
      
      this.recognition.onerror = (event: any) => {
        console.error('Erreur reconnaissance:', event.error);
        this.isListening = false;
        this.currentListeningField = '';
      };
    }
  }

  startVoiceInput(field: string): void {
    if (!this.recognition) {
      this.show3DAlert('error', 'Non supporté', 'La reconnaissance vocale n\'est pas supportée par votre navigateur');
      return;
    }
    
    if (this.isListening) {
      this.recognition.abort();
      this.isListening = false;
    }
    
    this.currentListeningField = field;
    
    // Définir la langue
    const langMap: { [key: string]: string } = {
      'fr': 'fr-FR',
      'en': 'en-US',
      'ar': 'ar-SA',
      'tn': 'fr-TN',
      'es': 'es-ES',
      'de': 'de-DE',
      'it': 'it-IT'
    };
    
    this.recognition.lang = langMap[this.selectedLanguage] || 'fr-FR';
    this.recognition.start();
    
    // Timeout automatique après 8 secondes
    setTimeout(() => {
      if (this.isListening) {
        this.recognition.stop();
      }
    }, 8000);
  }

  // ==================== ALERTES 3D ====================
  
 // ==================== ALERTES 3D CORRIGÉES ====================
  
private async show3DAlert(type: 'success' | 'error' | 'warning' | 'info' | 'question', title: string, message: string, options?: any): Promise<any> {
  // Fermer l'alerte précédente si elle existe
  if (this.currentSwal) {
    this.currentSwal.close();
  }
  
  const icons = {
    success: { emoji: '🎉', color: '#9D50BB' },
    error: { emoji: '😢', color: '#e74c3c' },
    warning: { emoji: '⚠️', color: '#f39c12' },
    info: { emoji: 'ℹ️', color: '#3498db' },
    question: { emoji: '🤔', color: '#9D50BB' }
  };
  
  const icon = icons[type];
  
  this.currentSwal = Swal.fire({
    title: `${icon.emoji} ${title}`,
    html: `<div style="font-size: 1rem; line-height: 1.5; color: #4f5b6b;">${message}</div>`,
    icon: type,
    confirmButtonText: options?.confirmText || 'OK',
    cancelButtonText: options?.cancelText || 'Annuler',
    showCancelButton: options?.showCancel || false,
    confirmButtonColor: icon.color,
    cancelButtonColor: '#6c757d',
    background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fe 100%)',
    backdrop: `rgba(0,0,0,0.4)`,
    showClass: {
      popup: 'animate__animated animate__fadeInUp animate__faster'
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutDown animate__faster'
    },
    willClose: () => {
      this.currentSwal = null;
    }
  });
  
  return this.currentSwal;
}

  private closeCurrentAlert(): void {
    if (this.currentSwal) {
      this.currentSwal.close();
      this.currentSwal = null;
    }
  }

  // ==================== GÉNÉRATION IA MULTILINGUE ====================
  
  toggleIAMode(): void {
    this.iaModeEnabled = !this.iaModeEnabled;
    if (!this.iaModeEnabled) {
      this.iaPrompt = '';
      this.numberOfQuestions = 5;
    }
  }

  async generateSurveyWithIA(): Promise<void> {
    // Éviter les doubles appels
    if (this.isGeneratingSurvey || this.isGenerating) {
      return;
    }
    
    if (!this.iaPrompt.trim()) {
      await this.show3DAlert('warning', 'Idée requise', 'Veuillez décrire le thème de votre enquête');
      return;
    }

    if (!this.enqueteForm.get('dateFin')?.value) {
      await this.show3DAlert('warning', 'Date requise', 'Veuillez définir une date de fin avant de générer');
      return;
    }

    this.isGeneratingSurvey = true;
    this.isGenerating = true;
    
    // Afficher l'alerte de progression
    this.closeCurrentAlert();
    
    const loadingHtml = `
      <div class="ia-loading-3d">
        <div class="spinner-3d">
          <div class="cube1"></div>
          <div class="cube2"></div>
          <div class="cube3"></div>
          <div class="cube4"></div>
        </div>
        <p class="loading-text-3d">
          <span class="loading-emoji">🤖</span>
          L'IA analyse votre demande...
          <span class="loading-dots">...</span>
        </p>
        <small class="loading-subtitle">Langue: ${this.getLanguageName(this.selectedLanguage)}</small>
      </div>
    `;
    
    this.currentSwal = Swal.fire({
      title: '<div class="swal-3d-title"><span class="swal-emoji-3d">⚡</span><span style="color: #9D50BB">Génération en cours</span></div>',
      html: loadingHtml,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Simuler un délai pour l'effet visuel
      await this.delay(500);
      
      const generatedSurvey = await this.generateSmartSurvey(
        this.iaPrompt, 
        this.numberOfQuestions,
        this.selectedLanguage
      );
      
      // Mettre à jour le formulaire
      if (generatedSurvey.title) {
        this.enqueteForm.patchValue({ titre: generatedSurvey.title });
      }
      
      if (generatedSurvey.description) {
        this.enqueteForm.patchValue({ description: generatedSurvey.description });
      }
      
      // Gérer le remplacement des questions
      let shouldReplace = false;
      
      if (this.selectedQuestions.length > 0) {
        this.closeCurrentAlert();
        
        const result = await this.show3DAlert('question', 'Questions existantes', 
          `Vous avez déjà ${this.selectedQuestions.length} question(s). Que souhaitez-vous faire ?`,
          { showCancel: true, confirmText: '🔄 Remplacer', cancelText: '➕ Ajouter' }
        );
        
        shouldReplace = result.isConfirmed;
        
        if (shouldReplace) {
          this.selectedQuestions = [];
        }
      }
      
      // Ajouter les nouvelles questions
      for (const q of generatedSurvey.questions) {
        this.selectedQuestions.push({
          id: Date.now() + Math.random(),
          texte: q.texte,
          type: q.type,
          options: q.options || [],
          isNew: true,
          generatedByAI: true,
          language: this.selectedLanguage
        });
        // Petit délai pour l'effet d'ajout progressif
        await this.delay(50);
      }
      
      // Fermer l'alerte de progression
      this.closeCurrentAlert();
      
      // Afficher le succès
      await this.show3DAlert('success', 'Enquête générée !', 
        `<div style="text-align: left">
           <p><strong>🌍 Langue:</strong> ${this.getLanguageName(this.selectedLanguage)}</p>
           <p><strong>📋 Titre:</strong> ${generatedSurvey.title.substring(0, 50)}</p>
           <p><strong>📝 Questions:</strong> ${generatedSurvey.questions.length} questions créées</p>
           <p><strong>✨ Statut:</strong> Prête à être modifiée</p>
         </div>`
      );
      
    } catch (error) {
      console.error('Erreur:', error);
      this.closeCurrentAlert();
      await this.show3DAlert('error', 'Erreur de génération', 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      this.isGeneratingSurvey = false;
      this.isGenerating = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getLanguageName(code: string): string {
    const lang = this.languages.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : '🇫🇷 Français';
  }

  private async generateSmartSurvey(idea: string, count: number, language: string): Promise<GeneratedSurvey> {
    const keywords = this.extractKeywords(idea, language);
    const title = this.generateTitle(idea, keywords, language);
    const description = this.generateDescription(idea, keywords, language);
    const questions = this.generateQuestions(idea, keywords, count, language);
    
    return { title, description, questions, language };
  }

  private extractKeywords(idea: string, language: string): string[] {
    const stopWords: { [key: string]: string[] } = {
      fr: ['pour', 'une', 'des', 'les', 'et', 'de', 'du', 'la', 'le', 'dans', 'sur', 'avec'],
      en: ['for', 'the', 'and', 'of', 'to', 'in', 'that', 'is', 'are', 'with', 'on', 'at'],
      ar: ['في', 'من', 'إلى', 'على', 'عن', 'مع', 'بين', 'بعد', 'قبل'],
      tn: ['باش', 'شنو', 'علاش', 'هاذا', 'هاذي', 'كيفاش', 'برشا', 'شكون'],
      es: ['para', 'una', 'las', 'los', 'y', 'de', 'del', 'la', 'el', 'que', 'es', 'son'],
      de: ['für', 'die', 'der', 'und', 'von', 'zu', 'im', 'mit', 'den', 'das', 'ist'],
      it: ['per', 'una', 'delle', 'dei', 'della', 'e', 'di', 'del', 'il', 'che', 'è']
    };
    
    const words = idea.toLowerCase().split(/\s+/);
    const stopWordsList = stopWords[language] || stopWords['fr'];
    return words.filter(w => w.length > 2 && !stopWordsList.includes(w)).slice(0, 5);
  }

  private generateTitle(idea: string, keywords: string[], language: string): string {
    const templates: { [key: string]: string[] } = {
      fr: [`📊 Enquête sur ${keywords[0] || idea.substring(0, 30)}`, `🎯 Sondage: ${idea.substring(0, 50)}`, `📋 Questionnaire: ${keywords.join(' - ')}`],
      en: [`📊 Survey on ${keywords[0] || idea.substring(0, 30)}`, `🎯 Poll: ${idea.substring(0, 50)}`, `📋 Questionnaire: ${keywords.join(' - ')}`],
      ar: [`📊 استبيان حول ${keywords[0] || idea.substring(0, 30)}`, `🎯 استطلاع: ${idea.substring(0, 50)}`, `📋 استبيان: ${keywords.join(' - ')}`],
      tn: [`📊 Enquête 3la ${keywords[0] || idea.substring(0, 30)}`, `🎯 Sondage: ${idea.substring(0, 50)}`, `📋 Questionnaire: ${keywords.join(' - ')}`],
      es: [`📊 Encuesta sobre ${keywords[0] || idea.substring(0, 30)}`, `🎯 Sondeo: ${idea.substring(0, 50)}`, `📋 Cuestionario: ${keywords.join(' - ')}`],
      de: [`📊 Umfrage zu ${keywords[0] || idea.substring(0, 30)}`, `🎯 Befragung: ${idea.substring(0, 50)}`, `📋 Fragebogen: ${keywords.join(' - ')}`],
      it: [`📊 Indagine su ${keywords[0] || idea.substring(0, 30)}`, `🎯 Sondaggio: ${idea.substring(0, 50)}`, `📋 Questionario: ${keywords.join(' - ')}`]
    };
    const tpls = templates[language] || templates['fr'];
    return tpls[Math.floor(Math.random() * tpls.length)];
  }

  private generateDescription(idea: string, keywords: string[], language: string): string {
    const descriptions: { [key: string]: string } = {
      fr: `✨ Cette enquête vise à recueillir votre avis sur ${idea}. Vos réponses nous aideront à nous améliorer. Merci pour votre participation ! 🙏`,
      en: `✨ This survey aims to gather your feedback on ${idea}. Your responses will help us improve. Thank you for participating! 🙏`,
      ar: `✨ يهدف هذا الاستبيان إلى جمع آرائكم حول ${idea}. ستساعدنا ردودكم على التحسين. شكراً لمشاركتكم! 🙏`,
      tn: `✨ Cette enquête 3la ${idea} bech tajma3 rayek. Réponsek ta3awna n7assenou. Merci 3la mcharktek! 🙏`,
      es: `✨ Esta encuesta tiene como objetivo recopilar su opinión sobre ${idea}. Sus respuestas nos ayudarán a mejorar. ¡Gracias por participar! 🙏`,
      de: `✨ Diese Umfrage soll Ihre Meinung zu ${idea} einholen. Ihre Antworten helfen uns, uns zu verbessern. Danke für Ihre Teilnahme! 🙏`,
      it: `✨ Questo sondaggio mira a raccogliere il tuo parere su ${idea}. Le tue risposte ci aiuteranno a migliorare. Grazie per aver partecipato! 🙏`
    };
    return descriptions[language] || descriptions['fr'];
  }

  private generateQuestions(idea: string, keywords: string[], count: number, language: string): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = [];
    
    const templates: { [key: string]: Array<{ type: string; template: string; options?: string[] }> } = {
      fr: [
        { type: 'TEXTE', template: `💬 Comment décririez-vous votre expérience avec ${idea} ?` },
        { type: 'NOTE', template: `⭐ Dans l'ensemble, comment évaluez-vous ${idea} ?`, options: ['1', '2', '3', '4', '5'] },
        { type: 'CHOIX_UNIQUE', template: `🎯 Quel aspect de ${idea} est le plus important pour vous ?`, options: ['Qualité 🏆', 'Prix 💰', 'Service 🤝', 'Fiabilité 🔒', 'Innovation 💡'] },
        { type: 'CHOIX_MULTIPLE', template: `✅ Quels sont les points forts de ${idea} ? (Plusieurs choix possibles)`, options: ['Qualité', 'Rapidité', 'Simplicité', 'Support', 'Innovation'] },
        { type: 'TEXTE', template: `💡 Quelles améliorations suggérez-vous pour ${idea} ?` }
      ],
      en: [
        { type: 'TEXTE', template: `💬 How would you describe your experience with ${idea}?` },
        { type: 'NOTE', template: `⭐ Overall, how would you rate ${idea}?`, options: ['1', '2', '3', '4', '5'] },
        { type: 'CHOIX_UNIQUE', template: `🎯 Which aspect of ${idea} is most important to you?`, options: ['Quality 🏆', 'Price 💰', 'Service 🤝', 'Reliability 🔒', 'Innovation 💡'] },
        { type: 'CHOIX_MULTIPLE', template: `✅ What are the strengths of ${idea}? (Multiple choices possible)`, options: ['Quality', 'Speed', 'Simplicity', 'Support', 'Innovation'] },
        { type: 'TEXTE', template: `💡 What improvements would you suggest for ${idea}?` }
      ],
      ar: [
        { type: 'TEXTE', template: `💬 كيف تصف تجربتك مع ${idea}؟` },
        { type: 'NOTE', template: `⭐ بشكل عام، كيف تقيم ${idea}؟`, options: ['1', '2', '3', '4', '5'] },
        { type: 'CHOIX_UNIQUE', template: `🎯 ما هو الجانب الأكثر أهمية بالنسبة لك في ${idea}؟`, options: ['الجودة 🏆', 'السعر 💰', 'الخدمة 🤝', 'الموثوقية 🔒', 'الابتكار 💡'] },
        { type: 'CHOIX_MULTIPLE', template: `✅ ما هي نقاط القوة في ${idea}؟ (اختيارات متعددة ممكنة)`, options: ['الجودة', 'السرعة', 'البساطة', 'الدعم', 'الابتكار'] },
        { type: 'TEXTE', template: `💡 ما التحسينات التي تقترحها لـ ${idea}؟` }
      ],
      tn: [
        { type: 'TEXTE', template: `💬 كيفاش تصف تجربتك مع ${idea}؟` },
        { type: 'NOTE', template: `⭐ شنو رايك في ${idea} من 1 ل 5؟`, options: ['1', '2', '3', '4', '5'] },
        { type: 'CHOIX_UNIQUE', template: `🎯 شنو أهم حاجة في ${idea} بالنسبة ليك؟`, options: ['Qualité 🏆', 'Prix 💰', 'Service 🤝', 'Fiabilité 🔒', 'Innovation 💡'] },
        { type: 'CHOIX_MULTIPLE', template: `✅ شنو نقاط القوة في ${idea}؟`, options: ['Qualité', 'Rapidité', 'Simplicité', 'Support', 'Innovation'] },
        { type: 'TEXTE', template: `💡 شنو التحسينات اللي تقترحها لـ ${idea}؟` }
      ]
    };
    
    const tpls = templates[language] || templates['fr'];
    
    for (let i = 0; i < count; i++) {
      const tpl = tpls[i % tpls.length];
      questions.push({
        texte: tpl.template,
        type: tpl.type,
        options: tpl.options || [],
        required: true,
        language: language
      });
    }
    
    return questions;
  }

  // ==================== GESTION QUESTIONS ====================

  getQuestionTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'TEXTE': 'fa-font',
      'CHOIX_UNIQUE': 'fa-circle-dot',
      'CHOIX_MULTIPLE': 'fa-check-square',
      'NOTE': 'fa-star'
    };
    return icons[type] || 'fa-question';
  }

  shouldShowOptions(question: any): boolean {
    return question.type === 'CHOIX_UNIQUE' || question.type === 'CHOIX_MULTIPLE';
  }

  shouldShowRating(question: any): boolean {
    return question.type === 'NOTE';
  }

  isQuestionSelected(question: any): boolean {
    return this.selectedQuestions.some(q => q.id === question.id);
  }

  addExistingQuestion(question: any): void {
    if (!this.isQuestionSelected(question)) {
      this.selectedQuestions.push({ ...question, id: question.id || Date.now() + Math.random() });
      this.show3DAlert('success', 'Ajoutée', 'Question ajoutée à votre enquête');
    }
  }

  removeExistingQuestion(index: number): void {
    this.show3DAlert('question', 'Supprimer ?', 'Cette question sera retirée de votre enquête', { showCancel: true, confirmText: '🗑️ Supprimer', cancelText: 'Annuler' })
      .then((result) => {
        if (result.isConfirmed) {
          this.selectedQuestions.splice(index, 1);
          this.show3DAlert('success', 'Supprimée', 'Question retirée de l\'enquête');
        }
      });
  }

  editQuestion(index: number): void {
    const question = this.selectedQuestions[index];
    this.editingQuestionIndex = index;
    
    this.newQuestionForm.patchValue({
      texte: question.texte,
      type: question.type
    });
    
    while (this.optionsFormArray.length) {
      this.optionsFormArray.removeAt(0);
    }
    
    if (question.options && question.options.length > 0) {
      question.options.forEach((opt: string) => {
        this.optionsFormArray.push(this.fb.control(opt, Validators.required));
      });
    }
    
    this.showNewQuestionForm = true;
    setTimeout(() => {
      document.querySelector('.new-question-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  updateQuestion(): void {
    if (this.newQuestionForm.invalid) {
      this.show3DAlert('warning', 'Formulaire incomplet', 'Veuillez remplir tous les champs');
      return;
    }

    const updatedQuestion = {
      ...this.selectedQuestions[this.editingQuestionIndex!],
      texte: this.newQuestionForm.value.texte,
      type: this.newQuestionForm.value.type,
      options: this.newQuestionForm.value.options || []
    };
    
    this.selectedQuestions[this.editingQuestionIndex!] = updatedQuestion;
    this.show3DAlert('success', 'Modifiée', 'Question mise à jour');
    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editingQuestionIndex = null;
    this.showNewQuestionForm = false;
    this.resetNewQuestionForm();
  }

  toggleNewQuestionForm(): void {
    this.showNewQuestionForm = !this.showNewQuestionForm;
    if (!this.showNewQuestionForm) {
      this.cancelEdit();
    } else {
      this.editingQuestionIndex = null;
      this.resetNewQuestionForm();
    }
  }

  addOption(): void {
    this.optionsFormArray.push(this.fb.control('', Validators.required));
  }

  removeOption(index: number): void {
    this.optionsFormArray.removeAt(index);
  }

  saveNewQuestion(): void {
    if (this.newQuestionForm.invalid) {
      this.show3DAlert('warning', 'Formulaire incomplet', 'Veuillez remplir tous les champs');
      return;
    }

    const newQuestion = {
      id: Date.now() + Math.random(),
      texte: this.newQuestionForm.value.texte,
      type: this.newQuestionForm.value.type,
      options: this.newQuestionForm.value.options || [],
      isNew: true
    };

    if (this.editingQuestionIndex !== null) {
      this.selectedQuestions[this.editingQuestionIndex] = newQuestion;
      this.cancelEdit();
    } else {
      this.selectedQuestions.push(newQuestion);
    }

    this.resetNewQuestionForm();
    this.show3DAlert('success', 'Enregistrée', 'Question ajoutée avec succès');
  }

  resetNewQuestionForm(): void {
    this.newQuestionForm.reset({ type: 'TEXTE', texte: '' });
    while (this.optionsFormArray.length) {
      this.optionsFormArray.removeAt(0);
    }
  }

  clearAllQuestions(): void {
    this.show3DAlert('question', 'Tout supprimer ?', `⚠️ ${this.selectedQuestions.length} question(s) seront définitivement supprimées`, 
      { showCancel: true, confirmText: '🗑️ Tout supprimer', cancelText: 'Annuler' })
      .then((result) => {
        if (result.isConfirmed) {
          this.selectedQuestions = [];
          this.show3DAlert('success', 'Supprimées', 'Toutes les questions ont été supprimées');
        }
      });
  }

  // Soumission
  async addEnquete(): Promise<void> {
    if (this.enqueteForm.invalid) {
      Object.keys(this.enqueteForm.controls).forEach(key => {
        this.enqueteForm.get(key)?.markAsTouched();
      });
      this.show3DAlert('warning', 'Formulaire incomplet', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (this.selectedQuestions.length === 0) {
      const result = await this.show3DAlert('question', 'Aucune question', 'Voulez-vous créer une enquête sans question ?',
        { showCancel: true, confirmText: '✅ Oui', cancelText: '❌ Non' });
      
      if (!result.isConfirmed) {
        return;
      }
    }

    const formValue = this.enqueteForm.value;
    const enqueteData: any = {
      titre: formValue.titre,
      description: formValue.description,
      dateFin: formValue.dateFin,
      typeParticipation: formValue.typeParticipation,
      userId: this.userID
    };

    if (this.selectedQuestions.length > 0) {
      enqueteData.questions = this.selectedQuestions.map(q => ({
        texte: q.texte,
        type: q.type,
        options: q.options || []
      }));
    }

    this.closeCurrentAlert();
    
    this.currentSwal = Swal.fire({
      title: '<div class="swal-3d-title"><span class="swal-emoji-3d">📦</span><span style="color: #9D50BB">Création en cours</span></div>',
      html: '<div class="ia-loading-3d"><div class="spinner-3d"><div class="cube1"></div><div class="cube2"></div><div class="cube3"></div><div class="cube4"></div></div><p>Enregistrement de votre enquête...</p></div>',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    this.enqueteService.addNewEnqueteVide(enqueteData).subscribe({
      next: async () => {
        this.closeCurrentAlert();
        await this.show3DAlert('success', '🎉 Enquête créée !', 
          `<div style="text-align: left">
             <p><strong>📋 Titre:</strong> ${enqueteData.titre}</p>
             <p><strong>📝 Questions:</strong> ${this.selectedQuestions.length}</p>
             <p><strong>✨ Statut:</strong> Prête à être partagée</p>
           </div>`
        );
        
        this.enqueteForm.reset();
        this.selectedQuestions = [];
        this.iaPrompt = '';
        this.iaModeEnabled = false;
      },
      error: async (err) => {
        this.closeCurrentAlert();
        await this.show3DAlert('error', '❌ Erreur', err.error?.message || 'Une erreur est survenue lors de la création');
      }
    });
  }

  onSubmit(): void {
    this.addEnquete();
  }
}