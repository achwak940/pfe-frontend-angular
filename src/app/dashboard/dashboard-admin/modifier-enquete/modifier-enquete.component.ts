import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
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
  enquete: any = null;

  // Statut de l'enquête
  isPublished = false;
  isArchived = false;
  currentStatut = '';

  // UI state
  isLoading = true;
  isSaving = false;
  isPublishing = false;
  activeTab: 'info' | 'questions' | 'share' = 'info';

  // Partage
  shareLinks: any = null;
  qrCodeUrl: string = '';
  shareLoading = false;
  copySuccess = false;

  // Types de questions
  questionTypes = [
    { value: 'TEXTE', label: 'Texte libre', icon: 'fa-align-left' },
    { value: 'CHOIX_UNIQUE', label: 'Choix unique', icon: 'fa-dot-circle' },
    { value: 'CHOIX_MULTIPLE', label: 'Choix multiple', icon: 'fa-check-square' },
    { value: 'NOTE', label: 'Note (1–5)', icon: 'fa-star' }
  ];

  constructor(
    private fb: FormBuilder,
    private service: EnqueteService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();

    const paramId = this.route.snapshot.paramMap.get('id');
    if (!paramId || isNaN(+paramId)) {
      Swal.fire({
        icon: 'warning',
        title: '⚠️ ID invalide',
        text: "L'ID de l'enquête est manquant ou incorrect.",
        confirmButtonText: 'OK',
        confirmButtonColor: '#9D50BB'
      }).then(() => this.router.navigate(['/gestionEnquete']));
      return;
    }

    this.id = +paramId;
    this.loadEnquete();
  }

  // ─── Init formulaire ───────────────────────────────────────────────────────

  initForm(): void {
    this.enqueteForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.minLength(10)],
      dateFin: ['', Validators.required],
      typeParticipation: ['connecte'],
      questions: this.fb.array([])
    });
  }

  get questionsArray(): FormArray {
    return this.enqueteForm.get('questions') as FormArray;
  }

  getOptionsArray(questionIndex: number): FormArray {
    return this.questionsArray.at(questionIndex).get('options') as FormArray;
  }

  // ─── Chargement de l'enquête ───────────────────────────────────────────────

  loadEnquete(): void {
    this.isLoading = true;

    this.service.getEnqueteById(this.id).subscribe({
      next: (res: any) => {
        this.enquete = res;
        this.currentStatut = res.statut || '';
        this.isPublished = this.currentStatut === 'PUBLIEE' || this.currentStatut === 'Publiee';
        this.isArchived = this.currentStatut === 'ARCHIVEE' || this.currentStatut === 'archive';

        // Patcher les champs de base
        this.enqueteForm.patchValue({
          titre: res.titre || '',
          description: res.description || '',
          dateFin: res.dateFin ? res.dateFin.split('T')[0] : '',
          typeParticipation: res.typeParticipation || 'connecte'
        });

        // Si publiée → désactiver les champs de base
        if (this.isPublished) {
          this.enqueteForm.get('titre')?.disable();
          this.enqueteForm.get('description')?.disable();
          this.enqueteForm.get('dateFin')?.disable();
          this.enqueteForm.get('typeParticipation')?.disable();
        }

        // Charger les questions via la route de détails
        this.loadQuestions();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: '❌ Erreur',
          text: 'Impossible de charger les données de l\'enquête.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#9D50BB'
        }).then(() => this.router.navigate(['/gestionEnquete']));
      }
    });
  }

  loadQuestions(): void {
    this.service.getAllEnquetesDetails(null, this.id).subscribe({
      next: (res: any) => {
        const questions = res?.data?.questions || res?.questions || [];
        this.questionsArray.clear();
        questions.forEach((q: any) => this.addExistingQuestion(q));
      },
      error: () => {
        // Silencieux — questions vides si erreur
      }
    });
  }

  // ─── Gestion des questions ─────────────────────────────────────────────────

  addExistingQuestion(q: any): void {
    const qGroup = this.fb.group({
      id: [q.id || null],
      texte: [{ value: q.texte || '', disabled: this.isPublished }, Validators.required],
      type: [{ value: q.type || 'TEXTE', disabled: this.isPublished }],
      required: [{ value: q.obligatoire !== false, disabled: this.isPublished }],
      options: this.fb.array([])
    });

    const optionsArray = qGroup.get('options') as FormArray;
    if (q.options && Array.isArray(q.options)) {
      q.options.forEach((opt: any) => {
        optionsArray.push(this.fb.control(
          { value: typeof opt === 'string' ? opt : opt.texte || '', disabled: this.isPublished }
        ));
      });
    }

    this.questionsArray.push(qGroup);
  }

  addNewQuestion(): void {
    if (this.isPublished) return;

    const qGroup = this.fb.group({
      id: [null],
      texte: ['', Validators.required],
      type: ['TEXTE'],
      required: [true],
      options: this.fb.array([])
    });

    this.questionsArray.push(qGroup);
  }

  removeQuestion(index: number): void {
    if (this.isPublished) return;

    Swal.fire({
      title: 'Supprimer cette question ?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#9D50BB',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then(result => {
      if (result.isConfirmed) {
        this.questionsArray.removeAt(index);
      }
    });
  }

  addOption(questionIndex: number): void {
    if (this.isPublished) return;
    this.getOptionsArray(questionIndex).push(this.fb.control('', Validators.required));
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    if (this.isPublished) return;
    this.getOptionsArray(questionIndex).removeAt(optionIndex);
  }

  needsOptions(questionIndex: number): boolean {
    const type = this.questionsArray.at(questionIndex).get('type')?.value;
    return type === 'CHOIX_UNIQUE' || type === 'CHOIX_MULTIPLE';
  }

  onTypeChange(questionIndex: number): void {
    const optArr = this.getOptionsArray(questionIndex);
    if (!this.needsOptions(questionIndex)) {
      optArr.clear();
    } else if (optArr.length === 0) {
      optArr.push(this.fb.control(''));
      optArr.push(this.fb.control(''));
    }
  }

  // ─── Sauvegarde ────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.isPublished) {
      this.showPublishedWarning();
      return;
    }
    this.updateEnquete();
  }

  updateEnquete(): void {
    if (this.enqueteForm.invalid) {
      this.enqueteForm.markAllAsTouched();
      this.questionsArray.controls.forEach(ctrl => (ctrl as FormGroup).markAllAsTouched());
      return;
    }

    this.isSaving = true;
    const rawValues = this.enqueteForm.getRawValue(); // getRawValue() inclut les champs disabled

    const questions = rawValues.questions.map((q: any) => ({
      id: q.id,
      texte: q.texte,
      type: q.type,
      obligatoire: q.required,
      options: q.options.filter((o: string) => o && o.trim() !== '')
    }));

    const payload = {
      titre: rawValues.titre,
      description: rawValues.description,
      dateFin: rawValues.dateFin || null,
      typeParticipation: rawValues.typeParticipation,
      questions
    };

    this.service.updateEnquete(payload, this.id).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        Swal.fire({
          icon: 'success',
          title: '✅ Modifié avec succès',
          text: res.message || 'Enquête mise à jour.',
          timer: 2000,
          showConfirmButton: false
        }).then(() => this.router.navigate(['/gestionEnquete']));
      },
      error: (err: any) => {
        this.isSaving = false;
        Swal.fire({
          icon: 'error',
          title: '❌ Erreur',
          text: err.error?.message || 'Erreur lors de la modification.',
          confirmButtonColor: '#9D50BB'
        });
      }
    });
  }

  // ─── Publication / Archivage ───────────────────────────────────────────────

  publishEnquete(): void {
    Swal.fire({
      title: '📢 Publier l\'enquête ?',
      html: `<p>Une fois publiée, <strong>la modification sera bloquée</strong>.</p>
             <p>Êtes-vous sûr(e) ?</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2ecc71',
      cancelButtonColor: '#95a5a6',
      confirmButtonText: 'Oui, publier',
      cancelButtonText: 'Annuler'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.isPublishing = true;
      this.service.publishEnquete(this.id).subscribe({
        next: () => {
          this.isPublishing = false;
          this.isPublished = true;
          this.currentStatut = 'Publiee';
          this.disableAllFields();

          Swal.fire({
            icon: 'success',
            title: '🎉 Publiée !',
            text: 'Votre enquête est maintenant en ligne.',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err: any) => {
          this.isPublishing = false;
          Swal.fire({
            icon: 'error',
            title: '❌ Erreur',
            text: err.error?.message || 'Erreur lors de la publication.',
            confirmButtonColor: '#9D50BB'
          });
        }
      });
    });
  }

  archiveEnquete(): void {
    Swal.fire({
      title: '📦 Archiver l\'enquête ?',
      text: 'L\'enquête sera archivée et ne sera plus accessible aux participants.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f39c12',
      cancelButtonColor: '#95a5a6',
      confirmButtonText: 'Oui, archiver',
      cancelButtonText: 'Annuler'
    }).then(result => {
      if (!result.isConfirmed) return;

      this.service.archiveEnquete(this.id).subscribe({
        next: () => {
          this.isArchived = true;
          this.currentStatut = 'archive';
          Swal.fire({
            icon: 'success',
            title: '📦 Archivée',
            text: 'Enquête archivée avec succès.',
            timer: 2000,
            showConfirmButton: false
          }).then(() => this.router.navigate(['/gestionEnquete']));
        },
        error: (err: any) => {
          Swal.fire({
            icon: 'error',
            title: '❌ Erreur',
            text: err.error?.message || 'Erreur lors de l\'archivage.',
            confirmButtonColor: '#9D50BB'
          });
        }
      });
    });
  }

  disableAllFields(): void {
    this.enqueteForm.get('titre')?.disable();
    this.enqueteForm.get('description')?.disable();
    this.enqueteForm.get('dateFin')?.disable();
    this.enqueteForm.get('typeParticipation')?.disable();
    this.questionsArray.controls.forEach(ctrl => ctrl.disable());
  }

  showPublishedWarning(): void {
    Swal.fire({
      icon: 'info',
      title: '🔒 Enquête publiée',
      text: 'Une enquête publiée ne peut plus être modifiée. Archivez-la pour pouvoir la recréer.',
      confirmButtonColor: '#9D50BB'
    });
  }

  // ─── Partage ───────────────────────────────────────────────────────────────

  loadShareLinks(): void {
    if (this.shareLinks) return;
    this.shareLoading = true;

    this.service.generateQRCode(this.id).subscribe({
      next: (blob: Blob) => {
        this.qrCodeUrl = URL.createObjectURL(blob);
        this.shareLoading = false;
      },
      error: () => {
        this.shareLoading = false;
      }
    });
  }

  getSurveyUrl(): string {
    return `${window.location.origin}/repondre/${this.id}`;
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.getSurveyUrl()).then(() => {
      this.copySuccess = true;
      setTimeout(() => (this.copySuccess = false), 2000);
    });
  }

  shareWhatsApp(): void {
    const url = encodeURIComponent(this.getSurveyUrl());
    const text = encodeURIComponent(`📊 ${this.enquete?.titre || 'Enquête'}\n\nParticipez ici :\n`);
    window.open(`https://wa.me/?text=${text}${url}`, '_blank');
  }

  shareFacebook(): void {
    const url = encodeURIComponent(this.getSurveyUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  }

  shareEmail(): void {
    const subject = encodeURIComponent(`📊 ${this.enquete?.titre || 'Enquête'}`);
    const body = encodeURIComponent(`Bonjour,\n\nJe vous invite à participer à l'enquête "${this.enquete?.titre}".\n\n🔗 ${this.getSurveyUrl()}\n\nMerci !`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  // ─── Navigation par onglet ─────────────────────────────────────────────────

  setTab(tab: 'info' | 'questions' | 'share'): void {
    this.activeTab = tab;
    if (tab === 'share') {
      this.loadShareLinks();
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  getStatutLabel(): string {
    const map: Record<string, string> = {
      Brouillon: 'Brouillon',
      Publiee: 'Publiée',
      PUBLIEE: 'Publiée',
      Fermee: 'Fermée',
      FERMEE: 'Fermée',
      archive: 'Archivée',
      ARCHIVEE: 'Archivée'
    };
    return map[this.currentStatut] || this.currentStatut;
  }

  getStatutClass(): string {
    if (this.isPublished) return 'badge-published';
    if (this.isArchived) return 'badge-archived';
    if (this.currentStatut === 'Fermee' || this.currentStatut === 'FERMEE') return 'badge-closed';
    return 'badge-draft';
  }

  hasError(controlPath: string, error?: string): boolean {
    const ctrl = this.enqueteForm.get(controlPath);
    if (!ctrl) return false;
    if (error) return ctrl.touched && ctrl.hasError(error);
    return ctrl.touched && ctrl.invalid;
  }

  hasQuestionError(index: number, field: string): boolean {
    const ctrl = this.questionsArray.at(index).get(field);
    return !!ctrl && ctrl.touched && ctrl.invalid;
  }

  trackByIndex(index: number): number {
    return index;
  }
}