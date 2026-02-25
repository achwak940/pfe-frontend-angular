import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-modifier-enquete',
  templateUrl: './modifier-enquete.component.html',
  styleUrls: ['./modifier-enquete.component.css']
})
export class ModifierEnqueteComponent implements OnInit {
  enqueteForm!: FormGroup;
  today: string = new Date().toISOString().split('T')[0];
  
  // Statuts sous forme de tableau d'objets
  statusOptions = [
    { key: 'BROUILLON', value: 'Brouillon' },
    { key: 'PUBLIEE', value: 'Publiée' },
    { key: 'FERMEE', value: 'Fermée' },
    { key: 'ARCHIVEE', value: 'Archivée' }
  ];

  // Types de participation sous forme de tableau d'objets
  participationOptions = [
    { 
      key: 'ANONYME', 
      value: 'Anonyme', 
      icon: 'fa-user-secret', 
      description: 'Réponses totalement anonymes' 
    },
    { 
      key: 'IDENTIFIEE', 
      value: 'Identifiée', 
      icon: 'fa-user-check', 
      description: 'Participants identifiés' 
    },
    { 
      key: 'MIXTE', 
      value: 'Mixte', 
      icon: 'fa-user-friends', 
      description: 'Choix anonyme ou identifié' 
    }
  ];

  // Questions simulées
  questions = [
    { text: 'Comment évaluez-vous notre service ?', type: 'Évaluation', icon: 'fa-star' },
    { text: 'Que pourrions-nous améliorer ?', type: 'Texte libre', icon: 'fa-font' },
    { text: 'Recommanderiez-vous nos services ?', type: 'Choix unique', icon: 'fa-check-circle' }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.loadEnqueteData();
  }

  initForm(): void {
    this.enqueteForm = this.fb.group({
      titre: ['', Validators.required],
      description: [''],
      dateFin: [''],
      statut: ['Brouillon'],
      typeParticipation: ['', Validators.required]
    });
  }

  loadEnqueteData(): void {
    // Simuler le chargement des données d'une enquête existante
    this.enqueteForm.patchValue({
      titre: 'Enquête de satisfaction client 2024',
      description: 'Cette enquête vise à recueillir les avis de nos clients sur la qualité de nos services.',
      dateFin: '2024-12-31',
      statut: 'Publiée',
      typeParticipation: 'Anonyme'
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.enqueteForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getDaysRemaining(): number {
    const dateFin = this.enqueteForm.get('dateFin')?.value;
    if (!dateFin) return 0;
    
    const today = new Date();
    const endDate = new Date(dateFin);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  manageQuestions(): void {
    console.log('Gérer les questions');
  }

  editQuestion(index: number): void {
    console.log('Éditer la question', index);
  }

  copyLink(): void {
    navigator.clipboard.writeText('https://enquete.app/participate/ENQ-2024-001');
  }

  onSubmit(): void {
    if (this.enqueteForm.valid) {
      console.log('Formulaire soumis:', this.enqueteForm.value);
    }
  }

  saveAsDraft(): void {
    console.log('Sauvegarder comme brouillon:', this.enqueteForm.value);
  }

  duplicate(): void {
    console.log('Dupliquer l\'enquête');
  }

  delete(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette enquête ?')) {
      console.log('Supprimer l\'enquête');
    }
  }

  cancel(): void {
    console.log('Annuler');
  }
}