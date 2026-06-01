import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';

export interface GeneratedSurvey {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
  theme: string;
  targetAudience: string;
  estimatedTime: number;
}

export interface GeneratedQuestion {
  texte: string;
  type: string;
  options: string[];
  required: boolean;
  helpText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EnqueteService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  // ==================== MÉTHODES EXISTANTES ====================
  
  getAllEnquete(id: any): Observable<any[]> {
    const apiUrl = `${this.baseUrl}/utilisateur/enquetes/${id}`;
    return this.http.get<any[]>(apiUrl); 
  }
  
  getAllEnquetesDetails(idUser: any, idEnquete: any): Observable<any> {
    const apiUrl = `${this.baseUrl}/utilisateur/enquetes/${idUser}/${idEnquete}`;
    return this.http.get<any>(apiUrl);
  }
  
  addNewEnqueteVide(data: any): Observable<any> {
    const apiurl = `${this.baseUrl}/enquete/creation`;
    return this.http.post<any>(apiurl, data);
  }
  
  updateEnquete(data: any, id: any): Observable<any> {
    const apiurl = `${this.baseUrl}/enquete/update/${id}`;
    return this.http.patch<any>(apiurl, data);
  }
  
  getEnqueteById(id: any): Observable<any> {
    const apiurl = `${this.baseUrl}/enquete/${id}`;
    return this.http.get(apiurl);
  }
  
  removeEnquete(id: any): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/delete/${id}`;
    return this.http.delete(apiUrl);
  }
  
  getEnqueteStats(idEnquete: number): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/${idEnquete}/stats`;
    return this.http.get(apiUrl);
  }
  
  getReponsesByQuestion(idEnquete: number, questionId: number): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/${idEnquete}/question/${questionId}/reponses`;
    return this.http.get(apiUrl);
  }
  
  generateQRCode(idEnquete: number): Observable<Blob> {
    const apiUrl = `${this.baseUrl}/enquete/${idEnquete}/qrcode`;
    return this.http.get(apiUrl, { responseType: 'blob' });
  }
  
  getEvolutionReponses(idEnquete: number): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/${idEnquete}/evolution`;
    return this.http.get(apiUrl);
  }
  
  publishEnquete(idEnquete: number): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/${idEnquete}/publier`;
    return this.http.patch(apiUrl, {});
  }
  
  archiveEnquete(idEnquete: number): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/${idEnquete}/archiver`;
    return this.http.patch(apiUrl, {});
  }
  
  changeStatut(idEnquete: number, statut: string): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/change-statut/${idEnquete}`;
    return this.http.patch(apiUrl, { statut });
  }
  
  changeTypeParticipation(idEnquete: number, type: string): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/changeTypeParticipation/${idEnquete}`;
    return this.http.patch(apiUrl, { typeParticipation: type });
  }

  getTauxReponseAdmin(userId: number): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/taux-reponse-admin/${userId}`;
    return this.http.get(apiUrl);
  }

  getNombreParticipants(userId: number): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/participants/${userId}`;
    return this.http.get(apiUrl);
  }

  getEvolutionReponsesAdmin(userId: number): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/evolution-admin/${userId}`;
    return this.http.get(apiUrl);
  }

  getStatistiquesGlobales(userId: number): Observable<any> {
    const apiUrl = `${this.baseUrl}/enquete/statistiques-globales/${userId}`;
    return this.http.get(apiUrl);
  }

  // ==================== ترجمة الدارجة التونسية للـ API ====================
  
  /**
   * تحويل النص التونسي إلى فرنسية للـ API
   * باش يفهم الـ IA ويخدم بالصحيح
   */
  private translateTunisianToFrench(tunisianText: string): string {
    const translations: { [key: string]: string } = {
      // كلمات شائعة بالدارجة
      'شنو': 'Quoi',
      'علاش': 'Pourquoi',
      'كيفاش': 'Comment',
      'برشا': 'Beaucoup',
      'شكون': 'Qui',
      'فما': 'Il y a',
      'حاجة': 'Chose',
      'نحبو': 'Nous voulons',
      'نحب': 'Je veux',
      'عندي': 'J\'ai',
      'تجي': 'Viens',
      'تمشي': 'Va',
      'توا': 'Maintenant',
      'بربي': 'Dieu',
      'صحيح': 'Vrai',
      'مليح': 'Bon',
      'وحش': 'Mauvais',
      'زوز': 'Deux',
      'ثلاثة': 'Trois',
      'أربعة': 'Quatre',
      'خمسة': 'Cinq',
      'رايك': 'Ton avis',
      'استبيان': 'Sondage',
      'تصويت': 'Vote',
      'خدمة': 'Service',
      'زباون': 'Client',
      'منتج': 'Produit',
      'جودة': 'Qualité',
      'سعر': 'Prix',
      'سرعة': 'Vitesse',
      'ثقة': 'Confiance',
      'نقاط القوة': 'Points forts',
      'نقاط الضعف': 'Points faibles',
      'تحسينات': 'Améliorations',
      'اقتراحات': 'Suggestions',
      'تجربة': 'Expérience',
      'رضى': 'Satisfaction',
      'شكون يخمم': 'Qui pense',
      'باش تخدم': 'Pour travailler',
      'باهي': 'Bien',
      'موش باهي': 'Pas bien'
    };
    
    let result = tunisianText;
    for (const [tn, fr] of Object.entries(translations)) {
      const regex = new RegExp(tn, 'gi');
      result = result.replace(regex, fr);
    }
    return result;
  }

  /**
   * كشف اللغة التونسية في النص
   */
  private isTunisianText(text: string): boolean {
    const tunisianKeywords = ['باش', 'شنو', 'علاش', 'هاذا', 'هاذي', 'كيفاش', 'برشا', 'شكون', 'توا', 'بربي'];
    const lowerText = text.toLowerCase();
    return tunisianKeywords.some(keyword => lowerText.includes(keyword));
  }

  // ==================== GÉNÉRATION IA INTELLIGENTE ====================
  
  async generateSurveyWithAI(idea: string, numberOfQuestions: number = 5, language: string = 'fr'): Promise<GeneratedSurvey> {
    let processedIdea = idea;
    let processedLanguage = language;
    
    // إذا كان النص بالدارجة التونسية، نترجمه للفرنسية باش يفهم الـ IA
    if (this.isTunisianText(idea) || language === 'tn') {
      processedIdea = this.translateTunisianToFrench(idea);
      processedLanguage = 'fr';
      console.log('🔄 ترجمة من التونسي للفرنسي:', idea, '->', processedIdea);
    }
    
    // بناء النص المطلوب للـ IA
    const prompt = this.buildPromptFromUserText(processedIdea, numberOfQuestions, processedLanguage);
    
    try {
      const response = await lastValueFrom(
        this.http.post<any>(`${this.baseUrl}/ai-questions/generate`, {
          question: prompt,
          lang: processedLanguage
        })
      );
      
      const survey = this.parseAIResponse(response.result, processedIdea, processedLanguage);
      
      // إذا كان المستخدم طلب تونسي، نرجع الأسئلة للدارجة
      if (language === 'tn' || this.isTunisianText(idea)) {
        survey.title = this.translateFrenchToTunisian(survey.title);
        survey.description = this.translateFrenchToTunisian(survey.description);
        survey.questions = survey.questions.map(q => ({
          ...q,
          texte: this.translateFrenchToTunisian(q.texte),
          options: q.options.map(opt => this.translateFrenchToTunisian(opt))
        }));
      }
      
      return survey;
    } catch (error) {
      console.error('Erreur API, utilisation mode offline:', error);
      return this.generateOfflineSurvey(idea, numberOfQuestions, language);
    }
  }

  /**
   * ترجمة من الفرنسي للتونسي
   */
  private translateFrenchToTunisian(frenchText: string): string {
    const translations: { [key: string]: string } = {
      'satisfaction': 'رضى',
      'client': 'زباون',
      'service': 'خدمة',
      'qualité': 'جودة',
      'prix': 'سعر',
      'rapidité': 'سرعة',
      'innovation': 'ابتكار',
      'amélioration': 'تحسين',
      'expérience': 'تجربة',
      'avis': 'رأي',
      'globalement': 'بصفة عامة',
      'comment évaluez-vous': 'شنو رايك في',
      'Que pensez-vous': 'شنو تحس بيه',
      'Qu\'est-ce qui vous a le plus satisfait': 'شنو أكثر حاجة عجبتك',
      'que recommanderiez-vous': 'شنو تحب توصي بيه',
      'quels problèmes avez-vous rencontrés': 'شنو المشاكل اللي صادفتك',
      'que pourrait-on améliorer': 'شنو لازم نطورو',
      'excellent': 'ممتاز',
      'bon': 'مليح',
      'moyen': 'متوسط',
      'faible': 'ضعيف',
      'très faible': 'ضعيف جدا',
      'très satisfait': 'راضي بزوز',
      'satisfait': 'راضي',
      'neutre': 'متوسط',
      'insatisfait': 'مش راضي',
      'très insatisfait': 'مش راضي بالكل',
      'qualité du produit': 'جودة المنتوج',
      'rapport qualité-prix': 'العلاقة بين الجودة والسعر',
      'délais de livraison': 'وقت التسليم',
      'fonctionnalités': 'الخصائص',
      'design': 'التصميم',
      'fiabilité': 'الموثوقية',
      'support': 'الدعم',
      'rapidité d\'exécution': 'السرعة في الإنجاز',
      'écoute client': 'تسماع الزبون',
      'résolution du problème': 'حل المشكلة',
      'proactivité': 'المبادرة',
      'transparence': 'الشفافية'
    };
    
    let result = frenchText;
    for (const [fr, tn] of Object.entries(translations)) {
      const regex = new RegExp(fr, 'gi');
      result = result.replace(regex, tn);
    }
    return result;
  }

  /**
   * بناء النص المطلوب للـ IA
   */
  private buildPromptFromUserText(userText: string, numberOfQuestions: number, language: string): string {
    const prompts: Record<string, string> = {
      fr: `Tu es un expert en création de sondages.

L'UTILISATEUR VEUT UNE ENQUÊTE SUR CE SUJET EXACT: "${userText}"

RÈGLES IMPORTANTES:
1. TOUTES les questions doivent être basées UNIQUEMENT sur le sujet: "${userText}"
2. Ne sort PAS du sujet - reste strictement sur ce thème
3. Génère EXACTEMENT ${numberOfQuestions} questions
4. Retourne UNIQUEMENT un JSON valide
5. Utilise un langage simple et clair

TYPES DE QUESTIONS:
- TEXTE: réponse libre
- CHOIX_UNIQUE: une seule option
- CHOIX_MULTIPLE: plusieurs options
- NOTE: évaluation sur 5

FORMAT JSON:
{
  "title": "Titre basé sur: ${userText.substring(0, 60)}",
  "description": "Description courte de cette enquête spécifique",
  "questions": [
    {
      "texte": "Question précise sur ${userText.substring(0, 30)}",
      "type": "NOTE|TEXTE|CHOIX_UNIQUE|CHOIX_MULTIPLE",
      "options": ["option1", "option2"]
    }
  ]
}

IMPORTANT: Retourne UNIQUEMENT le JSON, rien d'autre.`,

      en: `You are a survey creation expert.

THE USER WANTS A SURVEY ON THIS EXACT TOPIC: "${userText}"

IMPORTANT RULES:
1. ALL questions must be based ONLY on the topic: "${userText}"
2. Do NOT go off topic - stay strictly on this theme
3. Generate EXACTLY ${numberOfQuestions} questions
4. Return ONLY valid JSON

QUESTION TYPES:
- TEXT: free text answer
- SINGLE_CHOICE: one option only
- MULTIPLE_CHOICE: multiple options
- RATING: 1-5 scale

JSON FORMAT:
{
  "title": "Title based on: ${userText.substring(0, 60)}",
  "description": "Short description of this specific survey",
  "questions": [
    {
      "texte": "Specific question about ${userText.substring(0, 30)}",
      "type": "TEXT|SINGLE_CHOICE|MULTIPLE_CHOICE|RATING",
      "options": ["option1", "option2"]
    }
  ]
}

IMPORTANT: Return ONLY valid JSON.`,

      ar: `أنت خبير في إنشاء الاستبيانات.

يريد المستخدم استبياناً حول هذا الموضوع بالضبط: "${userText}"

قواعد مهمة:
1. يجب أن تكون جميع الأسئلة مبنية فقط على الموضوع: "${userText}"
2. لا تخرج عن الموضوع - التزم بهذا الموضوع فقط
3. قم بإنشاء ${numberOfQuestions} سؤالاً بالضبط
4. قم بإرجاع JSON صالح فقط

أنواع الأسئلة:
- نص: إجابة حرة
- اختيار واحد: خيار واحد فقط
- اختيار متعدد: خيارات متعددة
- تقييم: مقياس 1-5

تنسيق JSON:
{
  "title": "عنوان مبني على: ${userText.substring(0, 60)}",
  "description": "وصف قصير لهذا الاستبيان",
  "questions": [
    {
      "texte": "سؤال محدد حول ${userText.substring(0, 30)}",
      "type": "TEXTE|CHOIX_UNIQUE|CHOIX_MULTIPLE|NOTE",
      "options": ["خيار 1", "خيار 2"]
    }
  ]
}

مهم: قم بإرجاع JSON صالح فقط.`
    };

    return prompts[language] || prompts['fr'];
  }

  /**
   * تحليل الرد من الـ IA
   */
  private parseAIResponse(response: string, originalIdea: string, language: string): GeneratedSurvey {
    try {
      let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];
      
      const parsed = JSON.parse(cleaned);
      
      const questions = (parsed.questions || []).map((q: any, index: number) => ({
        texte: q.texte || q.text || `Question ${index + 1}`,
        type: this.validateType(q.type),
        options: Array.isArray(q.options) ? q.options : [],
        required: true
      }));
      
      return {
        title: parsed.title || `Enquête: ${originalIdea.substring(0, 50)}`,
        description: parsed.description || `Cette enquête concerne ${originalIdea}`,
        questions: questions.slice(0, 5),
        theme: originalIdea.substring(0, 50),
        targetAudience: 'Participants',
        estimatedTime: Math.ceil(questions.length * 0.5)
      };
    } catch (error) {
      console.error('Erreur parsing:', error);
      return this.generateOfflineSurvey(originalIdea, 5, language);
    }
  }

  /**
   * وضعية دون إنترنت - توليد أسئلة بالدارجة مباشرة
   */
  private generateOfflineSurvey(idea: string, count: number, language: string): GeneratedSurvey {
    // توليد أسئلة بالدارجة التونسية
    const questions = this.generateTunisianQuestions(idea, count);
    
    return {
      title: `📊 استبيان: ${idea.substring(0, 50)}`,
      description: `هذا الاستبيان باش يجمع آرائكم على ${idea}. شكرا على وقتكم! 🙏`,
      questions: questions,
      theme: idea.substring(0, 50),
      targetAudience: 'الكل',
      estimatedTime: Math.ceil(count * 0.5)
    };
  }

  /**
   * توليد أسئلة بالدارجة التونسية مباشرة
   */
  private generateTunisianQuestions(idea: string, count: number): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = [];
    const shortIdea = idea.length > 40 ? idea.substring(0, 37) + '...' : idea;
    
    const tunisianTemplates = [
      { type: 'NOTE', template: `⭐ شنو رايك في ${shortIdea} من 1 لـ 5؟`, options: ['1 - وحش جدا', '2 - موش باهي', '3 - مقبول', '4 - باهي', '5 - باهي بزوز'] },
      { type: 'CHOIX_UNIQUE', template: `🎯 شنو أهم حاجة في ${shortIdea} بالنسبة ليك؟`, options: ['الجودة', 'الخدمة', 'السعر', 'السرعة', 'الثقة'] },
      { type: 'TEXTE', template: `💬 كيفاش تصف تجربتك مع ${shortIdea}؟ (أكتب بالدارجة إذا تحب)` },
      { type: 'CHOIX_MULTIPLE', template: `✅ شنو نقاط القوة في ${shortIdea}؟ (تنجم تختار أكثر من واحد)`, options: ['جودة عالية', 'خدمة ممتازة', 'أسعار مناسبة', 'سرعة في الإنجاز', 'ثقة كبيرة'] },
      { type: 'TEXTE', template: `💡 شنو التحسينات اللي تقترحها لـ ${shortIdea}؟` },
      { type: 'NOTE', template: `⭐ قداش تثق في ${shortIdea}؟`, options: ['1 - ما عنديش ثقة', '2 - شوية', '3 - مقبول', '4 - نعم', '5 - ثقة كبيرة'] }
    ];
    
    for (let i = 0; i < count; i++) {
      const tpl = tunisianTemplates[i % tunisianTemplates.length];
      questions.push({
        texte: tpl.template,
        type: tpl.type,
        options: tpl.options || [],
        required: true
      });
    }
    
    return questions;
  }

  /**
   * التحقق من نوع السؤال
   */
  private validateType(type: string): string {
    const valid = ['TEXTE', 'CHOIX_UNIQUE', 'CHOIX_MULTIPLE', 'NOTE'];
    const upperType = type?.toUpperCase() || 'TEXTE';
    return valid.includes(upperType) ? upperType : 'TEXTE';
  }
  getParticipationTypeStats(adminId: number): Observable<any> {
  return this.http.get(`${this.baseUrl}/enquete/participation-type/${adminId}`);
}
}