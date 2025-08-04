import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';

import { Affectation, AffectationService } from './../../services/affectation.service';
import { SideBarComponent } from "../../Layout/side-bar/side-bar.component";
import { NavLayoutComponent } from "../../Layout/nav-layout/nav-layout.component";
import { FooterComponent } from "../../Layout/footer/footer.component";

@Component({
  selector: 'app-affectation-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SideBarComponent,
    NavLayoutComponent,
    FooterComponent
  ],
  templateUrl: './affectation-list.component.html',
})
export class AffectationListComponent implements OnInit {
  affectations: Affectation[] = [];
  filteredAffectations: Affectation[] = [];
  filters!: FormGroup;

  loading = false;
  error: string | null = null;

  constructor(
    private affectationService: AffectationService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.filters = this.fb.group({
      denomination: [''],
      fullName: [''],
      from: [null],  // yyyy-MM-dd (string renvoyée par <input type="date">)
      to: [null]
    });

    this.filters.valueChanges.pipe(debounceTime(150)).subscribe(() => this.applyFilters());

    this.loading = true;
    this.affectationService.getAll().subscribe({
      next: (data) => {
        // ⚠️ Normaliser TOUT DE SUITE les dates de l’API au format Date (local, sans heure)
        this.affectations = (data ?? []).map(a => ({
          ...a,
          dateDebut: this.coerceToLocalDate(a.dateDebut as any),
          dateFin:   this.coerceToLocalDate(a.dateFin   as any),
        })) as any;

        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement affectations', err);
        this.error = 'Erreur de chargement des affectations';
        this.loading = false;
      }
    });
  }

  /** ---- Helpers de dates (évite UTC vs local & supprime l'heure) ---- */

  /** Retourne une Date à minuit local (Y,M,D) */
  private mkLocalDate(y: number, m1: number, d: number): Date {
    return new Date(y, m1 - 1, d); // local midnight, pas d’UTC
  }

  /** Supprime l'heure (au cas où) */
  private stripTime(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  /** Parse 'yyyy-MM-dd' de l’input date (toujours en local, pas UTC) */
  private parseYMD(ymd: string | null | undefined): Date | null {
    if (!ymd) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) return null;
    const y = +m[1], mm = +m[2], dd = +m[3];
    return this.mkLocalDate(y, mm, dd);
  }

  /** Convertit ce qui vient de l’API (Date | ISO string | 'dd/MM/yyyy') en Date locale J minuit */
  private coerceToLocalDate(v: any): Date | null {
    if (!v) return null;
    if (v instanceof Date) return this.stripTime(v);

    if (typeof v === 'string') {
      // ISO / yyyy-MM-ddTHH:mm:ss(.sss)Z?
      const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
      if (iso) return this.mkLocalDate(+iso[1], +iso[2], +iso[3]);

      // dd/MM/yyyy
      const fr = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
      if (fr) return this.mkLocalDate(+fr[3], +fr[2], +fr[1]);
    }

    const d = new Date(v);
    return isNaN(d as any) ? null : this.stripTime(d);
  }

  /** ---------------- Filtrage ---------------- */
  applyFilters(): void {
    const { denomination, fullName, from, to } = this.filters.value;

    const den = (denomination ?? '').toLowerCase().trim();
    const name = (fullName ?? '').toLowerCase().trim();

    // valeurs des inputs <input type="date"> (yyyy-MM-dd)
    const fromD = this.parseYMD(from);
    const toD   = this.parseYMD(to);

    this.filteredAffectations = (this.affectations ?? []).filter((a) => {
      // Texte
      const denOk  = !den  || (a.denomination ?? '').toLowerCase().includes(den);
      const full   = (`${a.nom ?? ''} ${a.prenom ?? ''}`).trim().toLowerCase();
      const nameOk = !name || full.includes(name);

      // Dates (déjà normalisées en Date locale)
      const start: Date | null = this.coerceToLocalDate(a.dateDebut as any);
      const end:   Date | null = this.coerceToLocalDate(a.dateFin   as any);
      if (!start || !end) return false;

      // ---- Choisis l'une des deux sémantiques (dé-commente celle que tu veux) ----

      // A) "Chevauchement de périodes" (classique pour plannings)
// version stricte : inclus dans la fenêtre
const startOk = !fromD || start >= fromD;
const endOk   = !toD   || end   <= toD;
const dateOk = startOk && endOk;


      // B) "Inclus dans la fenêtre" (start >= from && end <= to)
      // const insideFromOk = !fromD || start >= fromD;
      // const insideToOk   = !toD   || end   <= toD;
      // const dateOk = insideFromOk && insideToOk;

      return denOk && nameOk && dateOk;
    });
  }

  resetFilters(): void {
    this.filters.reset({ denomination: '', fullName: '', from: null, to: null });
    this.applyFilters();
  }

  editAffectation(id: number | undefined): void {
    if (!id) { console.error('❌ ID invalide pour édition'); return; }
    this.router.navigate(['/affectation-edit', id]);
  }

  deleteAffectation(id: number | undefined): void {
    if (!id) { console.error('❌ ID invalide pour suppression'); return; }
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette affectation ?')) return;

    this.affectationService.delete(id).subscribe({
      next: () => {
        this.affectations = this.affectations.filter(a => a.idAffectation !== id);
        this.applyFilters();
      },
      error: (err) => console.error('❌ Erreur suppression', err)
    });
  }
}
