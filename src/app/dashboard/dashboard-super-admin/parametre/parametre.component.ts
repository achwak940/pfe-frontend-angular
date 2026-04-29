// parametre.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-parametre',
  templateUrl: './parametre.component.html',
  styleUrls: ['./parametre.component.css']
})
export class ParametreComponent {
  // Active tab/section
  activeSection: string = 'general';

  // Notification state
  notification: { show: boolean; type: string; message: string } = {
    show: false,
    type: 'success',
    message: ''
  };

  // ==================== PARAMÈTRES GÉNÉRAUX ====================
  generalSettings = {
    appName: 'AdminPanel Pro',
    appVersion: '3.2.0',
    logoPreview: 'assets/logo-placeholder.png',
    language: 'fr',
    themeDark: false,
    timezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    maintenanceMode: false
  };

  languages = [
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'ar', label: 'العربية', flag: '🇸🇦' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'de', label: 'Deutsch', flag: '🇩🇪' }
  ];

  timezones = [
    { value: 'Europe/Paris', label: 'Europe/Paris (UTC+1)' },
    { value: 'Europe/London', label: 'Europe/London (UTC+0)' },
    { value: 'America/New_York', label: 'America/New_York (UTC-5)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
    { value: 'Africa/Casablanca', label: 'Africa/Casablanca (UTC+1)' },
    { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (UTC-3)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (UTC+4)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (UTC+11)' }
  ];

  dateFormats = [
    { value: 'DD/MM/YYYY', label: '31/12/2024' },
    { value: 'MM/DD/YYYY', label: '12/31/2024' },
    { value: 'YYYY-MM-DD', label: '2024-12-31' },
    { value: 'DD-MM-YYYY', label: '31-12-2024' }
  ];

  // ==================== PARAMÈTRES UTILISATEURS ====================
  userSettings = {
    enableRegistration: true,
    emailVerificationRequired: true,
    defaultRole: 'user',
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireStrongPassword: true,
    autoLockAfterAttempts: true,
    allowSocialLogin: true
  };

  defaultRoles = [
    { value: 'super_admin', label: 'Super Administrateur', color: '#9D50BB' },
    { value: 'admin', label: 'Administrateur', color: '#3b82f6' },
    { value: 'manager', label: 'Gestionnaire', color: '#10b981' },
    { value: 'user', label: 'Utilisateur', color: '#f59e0b' },
    { value: 'viewer', label: 'Observateur', color: '#64748b' }
  ];

  // ==================== PARAMÈTRES SONDAGES ====================
  surveySettings = {
    defaultDuration: 30,
    allowAnonymousResponses: false,
    allowMultipleAnswers: true,
    enableAIRecommendations: false,
    maxQuestionsPerSurvey: 50,
    allowEditingResponses: true,
    showResultsImmediately: false,
    requireLoginToParticipate: true
  };

  // ==================== PARAMÈTRES IA ====================
  iaSettings = {
    enableAI: true,
    recommendationType: 'advanced',
    confidenceThreshold: 75,
    showAILogs: false,
    autoModerationEnabled: true,
    aiModelVersion: 'v2.4',
    maxTokensPerRequest: 500,
    temperature: 0.7
  };

  recommendationTypes = [
    { value: 'simple', label: 'Simple (recommandations basiques)', description: 'Recommandations basées sur les règles simples' },
    { value: 'advanced', label: 'Avancé (analyse contextuelle)', description: 'Analyse du contexte et des préférences' },
    { value: 'ml', label: 'Machine Learning (prédictions)', description: 'Prédictions basées sur le ML' },
    { value: 'hybrid', label: 'Hybride (combiné)', description: 'Combinaison de plusieurs approches' }
  ];

  // ==================== PARAMÈTRES EXPORT ====================
  exportSettings = {
    defaultFormat: 'csv',
    maxFileSize: 10,
    exportPath: '/exports/',
    includeHeaders: true,
    compressExports: false,
    autoDeleteAfterDays: 30,
    encryptionEnabled: true
  };

  exportFormats = [
    { value: 'csv', label: 'CSV', icon: 'fa-file-csv' },
    { value: 'excel', label: 'Excel (XLSX)', icon: 'fa-file-excel' },
    { value: 'pdf', label: 'PDF', icon: 'fa-file-pdf' },
    { value: 'json', label: 'JSON', icon: 'fa-file-code' },
    { value: 'xml', label: 'XML', icon: 'fa-file-code' }
  ];

  // ==================== PARAMÈTRES NOTIFICATIONS ====================
  notificationSettings = {
    emailNotifications: true,
    inAppNotifications: true,
    pushNotifications: false,
    weeklyDigest: false,
    notifyOnNewSurvey: true,
    notifyOnResults: true,
    notifyOnUserRegistration: true,
    digestDay: 'monday',
    digestTime: '09:00'
  };

  digestDays = [
    { value: 'monday', label: 'Lundi' },
    { value: 'tuesday', label: 'Mardi' },
    { value: 'wednesday', label: 'Mercredi' },
    { value: 'thursday', label: 'Jeudi' },
    { value: 'friday', label: 'Vendredi' }
  ];

  // ==================== PARAMÈTRES SÉCURITÉ ====================
  securitySettings = {
    enable2FA: false,
    sessionTimeout: 30,
    enableLogs: true,
    passwordExpiryDays: 90,
    maxSessionsPerUser: 3,
    ipWhitelistEnabled: false,
    rateLimitEnabled: true,
    rateLimitRequests: 100,
    rateLimitMinutes: 15,
    backupFrequency: 'daily',
    backupRetentionDays: 30
  };

  backupFrequencies = [
    { value: 'daily', label: 'Quotidienne' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuelle' }
  ];

  // Sections for tabs
  sections = [
    { id: 'general', name: 'Paramètres généraux', icon: 'fas fa-sliders-h', description: 'Configuration de base de l\'application' },
    { id: 'users', name: 'Utilisateurs', icon: 'fas fa-users', description: 'Gestion des comptes et inscriptions' },
    { id: 'surveys', name: 'Sondages', icon: 'fas fa-chart-pie', description: 'Options des sondages' },
    { id: 'ia', name: 'Intelligence Artificielle', icon: 'fas fa-brain', description: 'Configuration IA et ML' },
    { id: 'export', name: 'Exportations', icon: 'fas fa-download', description: 'Formats et options d\'export' },
    { id: 'notifications', name: 'Notifications', icon: 'fas fa-bell', description: 'Alertes et communications' },
    { id: 'security', name: 'Sécurité', icon: 'fas fa-shield-alt', description: 'Protection et conformité' }
  ];

  constructor() { }

  // Change active section
  setActiveSection(sectionId: string): void {
    this.activeSection = sectionId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Save all settings
  saveSettings(): void {
    const allSettings = {
      general: this.generalSettings,
      user: this.userSettings,
      survey: this.surveySettings,
      ia: this.iaSettings,
      export: this.exportSettings,
      notification: this.notificationSettings,
      security: this.securitySettings,
      savedAt: new Date().toISOString()
    };
    
    console.log('Saving settings:', allSettings);
    localStorage.setItem('app_settings', JSON.stringify(allSettings));
    this.showNotification('success', 'Paramètres enregistrés avec succès ✔️');
  }

  // Reset all settings to default
  resetSettings(): void {
    this.generalSettings = {
      appName: 'AdminPanel Pro',
      appVersion: '3.2.0',
      logoPreview: 'assets/logo-placeholder.png',
      language: 'fr',
      themeDark: false,
      timezone: 'Europe/Paris',
      dateFormat: 'DD/MM/YYYY',
      maintenanceMode: false
    };
    
    this.userSettings = {
      enableRegistration: true,
      emailVerificationRequired: true,
      defaultRole: 'user',
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireStrongPassword: true,
      autoLockAfterAttempts: true,
      allowSocialLogin: true
    };
    
    this.surveySettings = {
      defaultDuration: 30,
      allowAnonymousResponses: false,
      allowMultipleAnswers: true,
      enableAIRecommendations: false,
      maxQuestionsPerSurvey: 50,
      allowEditingResponses: true,
      showResultsImmediately: false,
      requireLoginToParticipate: true
    };
    
    this.iaSettings = {
      enableAI: true,
      recommendationType: 'advanced',
      confidenceThreshold: 75,
      showAILogs: false,
      autoModerationEnabled: true,
      aiModelVersion: 'v2.4',
      maxTokensPerRequest: 500,
      temperature: 0.7
    };
    
    this.exportSettings = {
      defaultFormat: 'csv',
      maxFileSize: 10,
      exportPath: '/exports/',
      includeHeaders: true,
      compressExports: false,
      autoDeleteAfterDays: 30,
      encryptionEnabled: true
    };
    
    this.notificationSettings = {
      emailNotifications: true,
      inAppNotifications: true,
      pushNotifications: false,
      weeklyDigest: false,
      notifyOnNewSurvey: true,
      notifyOnResults: true,
      notifyOnUserRegistration: true,
      digestDay: 'monday',
      digestTime: '09:00'
    };
    
    this.securitySettings = {
      enable2FA: false,
      sessionTimeout: 30,
      enableLogs: true,
      passwordExpiryDays: 90,
      maxSessionsPerUser: 3,
      ipWhitelistEnabled: false,
      rateLimitEnabled: true,
      rateLimitRequests: 100,
      rateLimitMinutes: 15,
      backupFrequency: 'daily',
      backupRetentionDays: 30
    };
    
    this.showNotification('info', 'Paramètres réinitialisés aux valeurs par défaut');
  }

  // Load saved settings from localStorage
  loadSettings(): void {
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        Object.assign(this.generalSettings, settings.general);
        Object.assign(this.userSettings, settings.user);
        Object.assign(this.surveySettings, settings.survey);
        Object.assign(this.iaSettings, settings.ia);
        Object.assign(this.exportSettings, settings.export);
        Object.assign(this.notificationSettings, settings.notification);
        Object.assign(this.securitySettings, settings.security);
        this.showNotification('success', 'Paramètres chargés avec succès');
      } catch (e) {
        console.error('Error loading settings', e);
      }
    }
  }

  // Logo upload methods
  removeLogo(): void {
    this.generalSettings.logoPreview = 'assets/logo-placeholder.png';
    this.showNotification('info', 'Logo supprimé');
  }

  onLogoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      if (input.files[0].size > 2 * 1024 * 1024) {
        this.showNotification('error', 'Le fichier est trop volumineux (max 2MB)');
        return;
      }
      
      if (!input.files[0].type.match('image.*')) {
        this.showNotification('error', 'Veuillez sélectionner une image');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.generalSettings.logoPreview = e.target?.result as string;
        this.showNotification('success', 'Logo téléchargé avec succès');
      };
      reader.onerror = () => {
        this.showNotification('error', 'Erreur lors du téléchargement');
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  // Show notification
  showNotification(type: string, message: string): void {
    this.notification = { show: true, type, message };
    setTimeout(() => {
      this.notification.show = false;
    }, 3000);
  }

  closeNotification(): void {
    this.notification.show = false;
  }

  // Update confidence threshold
  updateConfidenceThreshold(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.iaSettings.confidenceThreshold = parseInt(input.value, 10);
  }
  // parametre.component.ts - Ajoutez cette méthode dans la classe ParametreComponent

// Get recommendation type description
getRecommendationDescription(): string {
  const type = this.recommendationTypes.find(t => t.value === this.iaSettings.recommendationType);
  return type ? type.description : '';
}
}