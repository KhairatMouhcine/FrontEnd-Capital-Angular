import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ArticleService, Article } from '../../../services/article.service';
import { FooterComponent } from "../../../Layout/footer/footer.component";
import { SideBarComponent } from "../../../Layout/side-bar/side-bar.component";
import { NavLayoutComponent } from "../../../Layout/nav-layout/nav-layout.component";

@Component({
  standalone: true,
  selector: 'app-article-edit',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FooterComponent, SideBarComponent, NavLayoutComponent],
  templateUrl: './article-edit.component.html',
  styleUrls: ['./article-edit.component.css']
})
export class ArticleEditComponent implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(ArticleService);

  id: number | null = null;
  saving = false;

  form = this.fb.group({
    titre: this.fb.control('', { validators: [Validators.required, Validators.minLength(3)] }),
    contenu: this.fb.control('', { validators: [Validators.required] }),
    ordre: this.fb.control<number | null>(null, { validators: [Validators.required] }),
    type: this.fb.control<'client' | 'fournisseur'>('client', { validators: [Validators.required] })
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = +idParam;
      this.svc.getById(this.id).subscribe(a => {
        this.form.patchValue({
          titre: a.titre,
          contenu: a.contenu,
          ordre: a.ordre ?? null,
          type: (a.type as 'client' | 'fournisseur') || 'client'
        });
      });
    }
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;

    const raw = this.form.getRawValue();
    const dto: Article = {
      id: this.id ?? undefined,
      titre: raw.titre,
      contenu: raw.contenu,
      ordre: raw.ordre ?? null,
      type: raw.type
    };

    if (this.id) {
      this.svc.update(this.id, dto).subscribe({
        next: () => this.router.navigate(['/articles']),
        error: (err) => { this.handleError(err); this.saving = false; }
      });
    } else {
      this.svc.create(dto).subscribe({
        next: () => this.router.navigate(['/articles']),
        error: (err) => { this.handleError(err); this.saving = false; }
      });
    }
  }

  /** Affiche un message lisible à partir du ProblemDetails ASP.NET Core */
  private handleError(err: unknown) {
    const httpErr = err as HttpErrorResponse;

    // Valeurs par défaut
    let title = 'Erreur';
    let detail = 'Une erreur est survenue lors de la sauvegarde.';

    // ProblemDetails attendu: { title, detail, status, type }
    if (httpErr?.error) {
      title = httpErr.error.title ?? title;
      detail = httpErr.error.detail ?? detail;
    }

    // Cas spécifique: 409 Conflict (doublon Type+Ordre)
    if (httpErr?.status === 409) {
      // Marque le champ ordre en erreur pour feedback visuel
      this.form.controls.ordre.setErrors({ conflict: true });
      this.form.controls.ordre.markAsTouched();
    }

    // Message utilisateur (remplace par un toast si tu en as un)
    alert(`${title} : ${detail}`);
    console.error('Save error:', httpErr);
  }
}
