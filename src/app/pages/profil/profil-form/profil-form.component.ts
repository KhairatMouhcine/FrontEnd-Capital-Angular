import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfilService } from '../../../services/profil.service';
import { CommonModule } from '@angular/common';
import { SideBarComponent } from "../../../Layout/side-bar/side-bar.component";
import { NavLayoutComponent } from "../../../Layout/nav-layout/nav-layout.component";
import { FooterComponent } from "../../../Layout/footer/footer.component";

// ✅ AJOUT: OnDestroy pour libérer les ObjectURLs
import { OnDestroy } from '@angular/core';

@Component({
  selector: 'app-profil-form',
  standalone: true,
  templateUrl: './profil-form.component.html',
  imports: [CommonModule, ReactiveFormsModule, SideBarComponent, NavLayoutComponent, FooterComponent],
})
export class ProfilFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  isEditMode = false;
  profilId?: number;
  userId ?: number = 0;
  fournisseurs: any[] = [];

  // ========= AJOUTS: état pour la photo =========
  selectedFile: File | null = null;          // fichier sélectionné (local)
  photoPreviewUrl: string | null = null;     // aperçu local (ObjectURL)
  photoServerUrl: string | null = null;      // aperçu venant du serveur (Blob -> ObjectURL)
  photoError: string | null = null;
  photoInfo: string | null = null;
  private objectUrls: string[] = [];         // pour révoquer proprement les ObjectURLs
  // =============================================

  constructor(
    private fb: FormBuilder,
    private profilService: ProfilService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.loadFournisseurs(); // 👈 Ajout ici

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.profilId = +id;
      this.loadProfil(this.profilId);
    }

    const imported = history.state.data;
    if (imported && !this.isEditMode) {
      this.patchFormWithData(imported);
    }
  }

  // ✅ AJOUT: libération des ObjectURLs
  ngOnDestroy(): void {
    this.objectUrls.forEach(u => URL.revokeObjectURL(u));
  }

  loadFournisseurs(): void {
    this.profilService.getFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs = data.map(f => ({
          ...f,
          donneesJson: typeof f.donneesJson === 'string' ? JSON.parse(f.donneesJson) : f.donneesJson
        }));
      },
      error: (err) => console.error("Erreur lors du chargement des fournisseurs :", err)
    });
  }

  initForm(): void {
    this.form = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      ville: [''],
      idFournisseur: [null], // ✅ Ajout
      competences: this.fb.array([]),
      langues: this.fb.array([]),
      experiences: this.fb.array([]),
      formations: this.fb.array([]),
      centresInteret: this.fb.array([])
    });
  }

  loadProfil(id: number): void {
    this.profilService.get(id).subscribe(profil => {
      if (!profil) return;

      this.profilId = profil.id;
      this.userId = profil.userId;

      const data = profil.donneesJson;

      this.form.patchValue({
        prenom: data?.prenom || '',
        nom: data?.nom || '',
        email: data?.email || '',
        telephone: data?.telephone || '',
        ville: data?.ville || '',
        idFournisseur: profil.idFournisseur ?? null  // ✅ Patch ici pour select
      });

      this.setArrayValues('competences', data?.competences);
      this.setArrayValues('langues', data?.langues);
      this.setArrayValues('centresInteret', data?.centresInteret);
      this.setArrayObjects('experiences', data?.experiences);
      this.setArrayObjects('formations', data?.formations);

      // ✅ AJOUT: si profil existant, tenter de charger la photo serveur
      this.refreshServerPhoto();
    });
  }

  patchFormWithData(data: any): void {
    this.form.patchValue({
      prenom: data.prenom || '',
      nom: data.nom || '',
      email: data.email || '',
      telephone: data.telephone || '',
      ville: data.ville || ''
    });

    this.setArrayValues('competences', data.competences);
    this.setArrayValues('langues', data.langues);
    this.setArrayValues('centresInteret', data.centresInteret);
    this.setArrayObjects('experiences', data.experiences);
    this.setArrayObjects('formations', data.formations);
  }

  get competences(): FormArray {
    return this.form.get('competences') as FormArray;
  }

  get langues(): FormArray {
    return this.form.get('langues') as FormArray;
  }

  get experiences(): FormArray {
    return this.form.get('experiences') as FormArray;
  }

  get formations(): FormArray {
    return this.form.get('formations') as FormArray;
  }

  get centresInteret(): FormArray {
    return this.form.get('centresInteret') as FormArray;
  }

  setArrayValues(arrayName: string, values: string[]): void {
    const control = this.form.get(arrayName) as FormArray;
    control.clear(); // on évite les doublons
    values?.forEach(val => control.push(new FormControl(val)));
  }

  setArrayObjects(arrayName: string, values: any[]): void {
    const control = this.form.get(arrayName) as FormArray;
    control.clear();
    values?.forEach(val => control.push(this.fb.group(val)));
  }

  addCompetence() {
    this.competences.push(new FormControl(''));
  }

  addLangue() {
    this.langues.push(new FormControl(''));
  }

  addCentreInteret() {
    this.centresInteret.push(new FormControl(''));
  }

  addExperience() {
    this.experiences.push(this.fb.group({
      poste: [''],
      lieu: [''],
      debut: [''],
      fin: [''],
      description: ['']
    }));
  }

  addFormation() {
    this.formations.push(this.fb.group({
      titre: [''],
      institution: [''],
      annee: ['']
    }));
  }

  removeFromArray(arrayName: string, index: number): void {
    const control = this.form.get(arrayName) as FormArray;
    control.removeAt(index);
  }

  onSubmit(): void {
    const formValues = this.form.value;

    const payload = {
      donneesJson: {
        prenom: formValues.prenom,
        nom: formValues.nom,
        email: formValues.email,
        telephone: formValues.telephone,
        ville: formValues.ville,
        competences: formValues.competences,
        langues: formValues.langues,
        centresInteret: formValues.centresInteret,
        experiences: formValues.experiences,
        formations: formValues.formations
      },
      idFournisseur: formValues.idFournisseur ? +formValues.idFournisseur : null // assure que c'est un number
    };

    if (this.isEditMode && this.profilId) {
      this.profilService.update(this.profilId, payload).subscribe(() => {
        // ✅ AJOUT: si une photo a été sélectionnée, on l’upload après la mise à jour
        if (this.selectedFile) {
          this.profilService.uploadPhoto(this.profilId!, this.selectedFile).subscribe({
            next: () => {
              alert('Profil mis à jour avec succès (photo incluse).');
              this.router.navigate(['/profils']);
            },
            error: () => {
              alert('Profil mis à jour (sans photo) : échec upload photo.');
              this.router.navigate(['/profils']);
            }
          });
        } else {
          alert('Profil mis à jour avec succès.');
          this.router.navigate(['/profils']);
        }
      });
    } else {
      this.profilService.create(payload).subscribe((created: any) => {
        // ✅ AJOUT: si création OK et photo sélectionnée, on enchaîne l’upload
        const newId = created?.id as number | undefined;
        if (newId && this.selectedFile) {
          this.profilId = newId;
          this.profilService.uploadPhoto(newId, this.selectedFile).subscribe({
            next: () => {
              alert('Profil créé avec succès (photo incluse).');
              this.router.navigate(['/profils']);
            },
            error: () => {
              alert('Profil créé avec succès (sans photo) : échec upload photo.');
              this.router.navigate(['/profils']);
            }
          });
        } else {
          alert('Profil créé avec succès.');
          this.router.navigate(['/profils']);
        }
      });
    }
  }

  // ====================== AJOUTS : gestion de la photo ======================

  // Sélection d’un fichier local + validation + aperçu
  onFileSelected(evt: Event) {
    this.photoError = null;
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    if (!file) { this.selectedFile = null; this.clearPreview(); return; }

    const okTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!okTypes.includes(file.type)) {
      this.photoError = 'Formats autorisés: JPG, PNG, WebP.';
      input.value = '';
      return;
    }
    if (file.size > 5_000_000) {
      this.photoError = 'Fichier trop volumineux (max 5 MB).';
      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.makeLocalPreview(file);
  }

  // Crée un aperçu local
  makeLocalPreview(file: File) {
    this.clearPreview();
    const url = URL.createObjectURL(file);
    this.photoPreviewUrl = url;
    this.objectUrls.push(url);
  }

  // Efface l’aperçu local
  clearPreview() {
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
    }
    this.photoPreviewUrl = null;
  }

  // Annule la sélection locale
  clearSelectedFile() {
    this.selectedFile = null;
    this.clearPreview();
    this.photoInfo = null;
    this.photoError = null;
  }

  // Upload direct (bouton optionnel dans le template)
  uploadPhoto() {
    if (!this.profilId || !this.selectedFile) return;
    this.photoError = null;
    this.photoInfo = null;

    this.profilService.uploadPhoto(this.profilId, this.selectedFile).subscribe({
      next: () => {
        this.photoInfo = 'Photo mise à jour avec succès.';
        this.clearSelectedFile();
        this.refreshServerPhoto();
      },
      error: (err) => {
        this.photoError = err?.error || 'Échec de l’upload.';
      }
    });
  }

  // Tente de récupérer la photo depuis le serveur (404 => aucune photo)
  refreshServerPhoto() {
    if (!this.profilId) return;
    this.profilService.getPhoto(this.profilId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.photoServerUrl = url;
        this.objectUrls.push(url);
      },
      error: () => {
        this.photoServerUrl = null;
      }
    });
  }

  // Si l’image serveur échoue à se charger (corrompue, mauvais type…)
  onImgError(_e: Event) {
    this.photoServerUrl = null;
  }
// Supprime uniquement l’aperçu affiché (ne touche pas au serveur)
removePhoto(): void {
  // si tu veux retirer seulement l’aperçu "serveur"
  this.photoServerUrl = null;

  // si tu veux VRAIMENT supprimer l’aperçu local aussi, décommente :
  // if (this.photoPreviewUrl) {
  //   URL.revokeObjectURL(this.photoPreviewUrl);
  // }
  // this.photoPreviewUrl = null;
}

  // ========================================================================
}
