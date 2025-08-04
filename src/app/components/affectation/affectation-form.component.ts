import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Affectation, AffectationService } from '../../services/affectation.service';
import { SideBarComponent } from "../../Layout/side-bar/side-bar.component";
import { NavLayoutComponent } from "../../Layout/nav-layout/nav-layout.component";
import { FooterComponent } from "../../Layout/footer/footer.component";

@Component({
  selector: 'app-affectation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, SideBarComponent, NavLayoutComponent, FooterComponent],
  templateUrl: './affectation-form.component.html'
})
export class AffectationFormComponent implements OnInit {
  form: FormGroup;
  profils: any[] = [];
  clients: any[] = [];
  isEditMode = false;
  affectationId?: number;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private affectationService: AffectationService
  ) {
    this.form = this.fb.group({
      profilId: [''],
      clientId: [''],
      dateDebut: [''],
      dateFin: ['']
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.affectationId = +idParam;
      this.loadAffectation(this.affectationId);
    }

    this.fetchProfils();
    this.fetchClients();
  }

  fetchProfils(): void {
    this.http.get<any[]>('https://localhost:7039/api/Usermanagement/search').subscribe({
      next: data => this.profils = data ,
      error: err => console.error('Erreur chargement profils', err)
    });
  }

  fetchClients(): void {
    this.http.get<any[]>('https://localhost:7196/api/client/search').subscribe({
      next: data => this.clients = data,
      error: err => console.error('Erreur chargement clients', err)
    });
  }

  loadAffectation(id: number): void {
    this.affectationService.getById(id).subscribe({
      next: (a) => {
        this.form.patchValue({
          profilId: a.profilId,
          clientId: a.clientId,
          dateDebut: a.dateDebut?.split('T')[0],
          dateFin: a.dateFin?.split('T')[0]
        });
      },
      error: err => console.error('Erreur chargement affectation', err)
    });
  }

  onSubmit(): void {
    const formValue = this.form.value;

    const affectation = {
      id: this.isEditMode ? this.affectationId : 0,
      profilId: +formValue.profilId,
      clientId: +formValue.clientId,
      dateDebut: formValue.dateDebut,
      dateFin: formValue.dateFin
    };

    if (this.isEditMode && this.affectationId) {
      this.affectationService.update(this.affectationId, affectation).subscribe({
        next: () => this.router.navigate(['/Affectation']),
        error: err => console.error('❌ Erreur mise à jour affectation', err)
      });
    } else {
      this.affectationService.create(affectation).subscribe({
        next: () => this.router.navigate(['/Affectation']),
        error: err => console.error('❌ Erreur création affectation', err)
      });
    }
  }
}
