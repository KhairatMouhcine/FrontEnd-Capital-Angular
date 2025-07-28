import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, JsonPipe } from '@angular/common';
import { FournisseurService, Fournisseur } from '../../../services/fournisseur.service';
import { NavLayoutComponent } from "../../../Layout/nav-layout/nav-layout.component";
import { SideBarComponent } from "../../../Layout/side-bar/side-bar.component";
import { FooterComponent } from "../../../Layout/footer/footer.component";

@Component({
  selector: 'app-fournisseur-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavLayoutComponent, SideBarComponent, FooterComponent],
  templateUrl: './fournisseur-form.component.html',
})
export class FournisseurFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  fournisseurId?: number;

  constructor(
    private fb: FormBuilder,
    private fournisseurService: FournisseurService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      denomination: [''],
      siren: [''],
      adresse: [''],
      formeJuridique: [''],
      dateImmatriculation: [''],
      capitalSocial: [''],
      dateCommencement: [''],
      activites: this.fb.array([]),
      dirigeant: this.fb.group({
        nom: [''],
        prenom: [''],
        dateNaissance: [''],
        lieuNaissance: [''],
        adresse: ['']
      })
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.fournisseurId = +idParam;
      this.loadFournisseur(this.fournisseurId);
    } else {
      this.addActivite(); // init un champ vide en création
    }
  }

  get activites(): FormArray {
    return this.form.get('activites') as FormArray;
  }

  addActivite() {
    this.activites.push(this.fb.control(''));
  }
removeActivite(index: number) {
  this.activites.removeAt(index);
}
  loadFournisseur(id: number): void {
    this.fournisseurService.getById(id).subscribe({
      next: (f: Fournisseur) => {
        const d = f.donneesJson;

        // Clear activites form array
        this.activites.clear();
        (d?.Activites || []).forEach((act: string) => {
          this.activites.push(this.fb.control(act));
        });

        this.form.patchValue({
          denomination: d?.Denomination,
          siren: d?.Siren,
          adresse: d?.Adresse,
          formeJuridique: d?.FormeJuridique,
          dateImmatriculation: d?.DateImmatriculation,
          capitalSocial: d?.CapitalSocial,
          dateCommencement: d?.DateCommencement,
          dirigeant: {
            nom: d?.Dirigeant?.Nom,
            prenom: d?.Dirigeant?.Prenom,
            dateNaissance: d?.Dirigeant?.DateNaissance,
            lieuNaissance: d?.Dirigeant?.LieuNaissance,
            adresse: d?.Dirigeant?.Adresse,
          }
        });
      },
      error: err => console.error('Erreur de chargement', err)
    });
  }

  onSubmit(): void {
    const formValue = this.form.value;

    const fournisseur: any = {
  id: this.fournisseurId, // ✅ ajoute-le ici
  donneesJson: {
    Denomination: formValue.denomination,
    Siren: formValue.siren,
    Adresse: formValue.adresse,
    FormeJuridique: formValue.formeJuridique,
    DateImmatriculation: formValue.dateImmatriculation,
    CapitalSocial: formValue.capitalSocial,
    Activites: formValue.activites,
    DateCommencement: formValue.dateCommencement,
    Dirigeant: {
      Nom: formValue.dirigeant.nom,
      Prenom: formValue.dirigeant.prenom,
      DateNaissance: formValue.dirigeant.dateNaissance,
      LieuNaissance: formValue.dirigeant.lieuNaissance,
      Adresse: formValue.dirigeant.adresse
    }
  }
};


    if (this.isEditMode && this.fournisseurId) {
      fournisseur.id = this.fournisseurId; // ✅ ajoute cette ligne
      this.fournisseurService.update(this.fournisseurId, fournisseur).subscribe({
        next: () => this.router.navigate(['/fournisseurs']),
        error: err => console.error('Erreur update :', err)
      });
    } else {
      this.fournisseurService.create(fournisseur).subscribe({
        next: () => this.router.navigate(['/fournisseurs']),
        error: err => console.error('Erreur création :', err)
      });
    }
  }
  isLoading = false;
uploadMessage = '';
  onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  this.isLoading = true;        // active spinner
  this.uploadMessage = '';      // reset msg

  this.fournisseurService.analyseKbis(file).subscribe({
    next: (d) => {
      this.fillFormFromAnalyse(d);
      this.uploadMessage = '✅ Analyse KBIS terminée, formulaire rempli.';
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Erreur analyse KBIS :', err);
      this.uploadMessage = '❌ Erreur lors de l’analyse du KBIS.';
      this.isLoading = false;
    }
  });
}


private toDateInput(v?: string): string {
  if (!v) return '';
  const s = v.trim();
  let m = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return '';
}

private pickAdresse(d: any): string {
  return (
    d?.Adresse ??
    d?.AdresseSiege ??
    d?.Adresse_Siege ??
    d?.SiegeSocial?.Adresse ??
    d?.Siege ??
    d?.Address ??
    d.DomicilePersonnel??
    ''
  ).toString().trim();
}

private fillFormFromAnalyse(d: any) {
  this.activites.clear();

  // Découpe les activités longues en plusieurs petites
  const rawActs: string[] = d?.Activites || [];
  const splitted: string[] = [];

  rawActs.forEach((act) => {
    if (!act) return;
    // Découpe par ; ou . ou ,
    const parts = act.split(/[;,.]/);
    parts.forEach((p) => {
      const trimmed = p.trim();
      if (trimmed.length > 3) {
        splitted.push(trimmed);
      }
    });
  });

  // Injecte dans le FormArray
  if (splitted.length > 0) {
    splitted.forEach((a) => this.activites.push(this.fb.control(a)));
  } else {
    this.addActivite(); // au moins un champ vide
  }

  this.form.patchValue({
    denomination: d?.Denomination || '',
    siren: d?.Siren || '',
    adresse: this.pickAdresse(d),
    formeJuridique: d?.FormeJuridique || '',
    dateImmatriculation: this.toDateInput(d?.DateImmatriculation),
    capitalSocial: d?.CapitalSocial || '',
    dateCommencement: this.toDateInput(d?.DateCommencement),
    dirigeant: {
      nom: d?.Dirigeant?.Nom || '',
      prenom: d?.Dirigeant?.Prenom || '',
      dateNaissance: this.toDateInput(d?.Dirigeant?.DateNaissance),
      lieuNaissance: d?.Dirigeant?.LieuNaissance || '',
      adresse: this.pickAdresse(d?.Dirigeant || {})
    }
  });
}
}
