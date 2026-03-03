import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EnqueteService } from '../enquete.service';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modifier-enquete',
  templateUrl: './modifier-enquete.component.html',
  styleUrls: ['./modifier-enquete.component.css']
})
export class ModifierEnqueteComponent implements OnInit {

  enqueteForm!: FormGroup;
  today = new Date().toISOString().split('T')[0];
  id!: number;

  constructor(
    private fb: FormBuilder,
    private service: EnqueteService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Créer le formulaire
    this.enqueteForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['', Validators.minLength(10)],
      dateFin: ['', Validators.required],
    });

    // Récupérer et valider l'id depuis la route
    const paramId = this.route.snapshot.paramMap.get('id');
    if (!paramId || isNaN(+paramId)) {
      Swal.fire({
        title: '⚠️ ID invalide',
        text: 'L’ID de l’enquête est manquant ou incorrect.',
        confirmButtonText: 'OK',
      }).then(() => {
        this.router.navigate(['/gestionEnquete']);
      });
      return; // Stopper si ID invalide
    }
    this.id = +paramId;

    // Charger les données existantes
    this.loadEnquete();
  }

  loadEnquete(): void {
    this.service.getEnqueteById(this.id).subscribe({
      next: (res: any) => {
        if (!res.dateFin) res.dateFin = null;
        this.enqueteForm.patchValue(res);
      },
      error: () => {
        Swal.fire({
          title: '❌ Erreur',
          text: 'Impossible de charger les données',
          confirmButtonText: 'OK',
        }).then(() => {
          this.router.navigate(['/gestionEnquete']);
        });
      }
    });
  }

  updateEnquete(): void {
    if (!this.enqueteForm) return;

    if (this.enqueteForm.invalid) {
      this.enqueteForm.markAllAsTouched();
      return;
    }

    const values = this.enqueteForm.value;
    if (!values.dateFin) values.dateFin = null;

    this.service.updateEnquete(values, this.id).subscribe({
      next: (res: any) => {
        Swal.fire({
          title: '✅ Modifié avec succès',
          text: res.message,
          confirmButtonText: 'OK',
        }).then(() => {
          this.router.navigate(['/gestionEnquete']);
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: '❌ Erreur',
          text: err.error?.message || 'Erreur lors de la modification',
          confirmButtonText: 'OK',
        });
      }
    });
  }

  onSubmit(): void {
    this.updateEnquete();
  }
}