import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClientService, Client } from '../../../services/client.service';
import { NavLayoutComponent } from "../../../Layout/nav-layout/nav-layout.component";
import { SideBarComponent } from "../../../Layout/side-bar/side-bar.component";
import { FooterComponent } from "../../../Layout/footer/footer.component";

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavLayoutComponent, SideBarComponent, FooterComponent],
  templateUrl: './client-form.component.html',
})
export class ClientFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  clientId?: number;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
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
      this.clientId = +idParam;
      this.loadClient(this.clientId);
    } else {
      this.addActivite();
    }
  }

  get activites(): FormArray {
    return this.form.get('activites') as FormArray;
  }

  addActivite(): void {
    this.activites.push(this.fb.control(''));
  }

  removeActivite(index: number): void {
    this.activites.removeAt(index);
  }

  loadClient(id: number): void {
    this.clientService.getById(id).subscribe({
      next: (c: Client) => {
        const d = c.donneesJson;

        this.activites.clear();
        (d?.Activites || []).forEach((act: string) => this.activites.push(this.fb.control(act)));
        if (this.activites.length === 0) this.addActivite();

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
      },
      error: err => console.error('Erreur de chargement du client', err)
    });
  }

  onSubmit(): void {
    const formValue = this.form.value;

    const client: Client = {
      id: this.clientId,
      donneesJson: {
        Denomination: formValue.denomination,
        Siren: formValue.siren,
        Adresse: formValue.adresse,
        FormeJuridique: formValue.formeJuridique,
        DateImmatriculation: formValue.dateImmatriculation,
        CapitalSocial: formValue.capitalSocial,
        DateCommencement: formValue.dateCommencement,
        Activites: formValue.activites,
        Dirigeant: {
          Nom: formValue.dirigeant.nom,
          Prenom: formValue.dirigeant.prenom,
          DateNaissance: formValue.dirigeant.dateNaissance,
          LieuNaissance: formValue.dirigeant.lieuNaissance,
          Adresse: formValue.dirigeant.adresse
        }
      }
    };

    if (this.isEditMode && this.clientId) {
      this.clientService.update(this.clientId, client).subscribe({
        next: () => this.router.navigate(['/clients']),
        error: err => console.error('Erreur update client :', err)
      });
    } else {
      this.clientService.create(client).subscribe({
        next: () => this.router.navigate(['/clients']),
        error: err => console.error('Erreur création client :', err)
      });
    }
  }

  /** Upload & analyse puis remplissage automatique (même méthode que fournisseur) */
   isLoading = false;
uploadMessage = '';
  onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  this.isLoading = true;        // active spinner
  this.uploadMessage = '';      // reset msg

  this.clientService.analyseKbis(file).subscribe({
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



  // ---------- Helpers (identiques à Fournisseur) ----------

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
