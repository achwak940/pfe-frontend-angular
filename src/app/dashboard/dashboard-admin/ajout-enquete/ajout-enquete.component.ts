import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-ajout-enquete',
  templateUrl: './ajout-enquete.component.html',
  styleUrls: ['./ajout-enquete.component.css']
})
export class AjoutEnqueteComponent implements OnInit {

  enqueteForm!: FormGroup;
  today = new Date().toISOString().split('T')[0];

  // enums côté Angular avec type index signature
  status: { [key: string]: string } = {
    Brouillon: 'Brouillon',
    Publiee: 'Publiee',
    Fermee: 'Fermee',
    Archive: 'Archivée'
  };

  participationType: { [key: string]: string } = {
    connecte: 'CONNECTE',
    anonyme: 'ANONYME'
  };

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.enqueteForm = this.fb.group({
      titre: ['', Validators.required],
      description: [''],
      dateFin: [''],
      statut: [this.status['Brouillon']],
      typeParticipation: [this.participationType['connecte'], Validators.required]
    });
  }

  // Méthodes pour template
  getStatusKeys(): string[] {
    return Object.keys(this.status);
  }

  getParticipationKeys(): string[] {
    return Object.keys(this.participationType);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.enqueteForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.enqueteForm.invalid) return;
    console.log('Enquête créée:', this.enqueteForm.value);
    alert('Enquête créée avec succès !');
  }

  saveAsDraft() {
    console.log('Brouillon sauvegardé:', this.enqueteForm.value);
    alert('Brouillon sauvegardé !');
  }
}