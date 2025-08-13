import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Layout (mêmes composants que sur la page CRA)
import { SideBarComponent } from '../../../Layout/side-bar/side-bar.component';
import { NavLayoutComponent } from '../../../Layout/nav-layout/nav-layout.component';
import { FooterComponent } from '../../../Layout/footer/footer.component';

// Service
import { ProfilService } from '../../../services/profil.service';
import { HttpClient } from '@angular/common/http';

export interface MatchResult {
  profileId: number;
  displayName: string;
  score: number;         // 0..1
  reason: string;
  matchedSkills: string[];
}

@Component({
  standalone: true,
  selector: 'app-rh-matching',
  imports: [CommonModule, FormsModule, SideBarComponent, NavLayoutComponent, FooterComponent],
  templateUrl: './matching.component.html',
  styleUrls: ['./matching.component.css']
})
export class RhMatchingComponent {
    offerText: string | null = '';
  results: MatchResult[] = [];

  loading = false;
  error?: string;
  hasQueried = false;   // pour n’afficher “Aucun profil…” qu’après clic

 constructor(private profils: ProfilService, private http: HttpClient) {}

  filtrer(): void {
    if (!this.offerText || !this.offerText.trim()) return;

    this.loading = true;
    this.error = undefined;
    this.hasQueried = true;

    this.profils.matchProfiles(this.offerText).subscribe({
      next: res => {
        this.results = res ?? [];
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Impossible de récupérer les correspondances.';
        this.loading = false;
      }
    });
    
  }
genererCv(id: number): void {
    console.log('Générer CV pour profileId =', id);

    const url = `https://localhost:7079/api/Profil/${id}/cv`;
    const params = {
      template: 'enterprise',
      lang: 'fr',
      debug: 'false'
    };

    this.http.get(url, { params, responseType: 'blob' }).subscribe({
      next: (res: Blob) => {
        // Si l’API renvoie un PDF par ex., on peut le télécharger
        const fileURL = URL.createObjectURL(res);
        window.open(fileURL);
      },
      error: err => {
        console.error('Erreur génération CV:', err);
      }
    })
  }
  // helpers barre de progression
  scorePct(s: number): number {
    const v = Math.max(0, Math.min(1, Number(s) || 0));
    return Math.round(v * 100);
  }

  scoreClass(s: number): string {
    const v = Math.max(0, Math.min(1, Number(s) || 0));
    if (v >= 0.8) return 'bg-success';
    if (v >= 0.5) return 'bg-warning';
    return 'bg-danger';
  }
}
