import { Component, OnInit } from '@angular/core';
import { ProfilService } from '../../../services/profil.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { SideBarComponent } from "../../../Layout/side-bar/side-bar.component";
import { NavLayoutComponent } from "../../../Layout/nav-layout/nav-layout.component";
import { FooterComponent } from "../../../Layout/footer/footer.component";

@Component({
  selector: 'app-profil-list',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, SideBarComponent, NavLayoutComponent, FooterComponent],
  templateUrl: './profil-list.component.html',
  styleUrls: ['./profil-list.component.css']
})
export class ProfilListComponent implements OnInit {
  profils: any[] = [];
  isLoading: boolean = false;
loading = false;
  constructor(
    private profilService: ProfilService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadProfils();
  }

  loadProfils(): void {
    this.isLoading = true;
    this.profilService.getAll().subscribe({
      next: (res) => {
        this.profils = res.filter(p => p.donneesJson);
        console.log('Profils chargés :', this.profils);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement profils :', err);
        this.isLoading = false;
      }
    });
  }

  goToEdit(id: number) {
    this.router.navigate(['/profils-edit', id]);
  }
  deleteProfil(id: number): void {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce profil ?')) {
    this.profilService.delete(id).subscribe({
      next: () => {
        this.profils = this.profils.filter(p => p.id !== id);
        alert('Profil supprimé avec succès.');
      },
      error: (err) => {
        console.error('Erreur lors de la suppression :', err);
        alert("Échec de la suppression.");
      }
    });
  }
}


onFileSelected(event: Event): void {
  const file = (event.target as HTMLInputElement)?.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  console.log('📤 Envoi du fichier en cours...');
  this.loading = true;

  this.http.post('https://localhost:7152/api/upload/analyse', formData, {
    responseType: 'text'
  }).subscribe({
    next: (res: string) => {
      console.log('📥 Réponse brute reçue :', res);

      // 🔍 Extraire le bloc JSON entre ```json ... ```
      const match = res.match(/```json([\s\S]*?)```/);

      if (match && match[1]) {
        const jsonText = match[1].trim();
        try {
          const parsed = JSON.parse(jsonText);
          console.log('✅ JSON extrait et parsé :', parsed);

          // ✅ Redirection vers la page du formulaire avec données pré-remplies
          this.router.navigate(['/profils-new'], { state: { data: parsed } });
        } catch (e) {
          console.error('❌ Erreur de parsing JSON :', e);
          alert("Erreur : le JSON extrait est mal formé.");
        }
      } else {
        console.error('❌ Aucun bloc JSON trouvé entre ```json ... ```');
        alert("Erreur : bloc JSON non trouvé dans la réponse.");
      }

      this.loading = false;
    },
    error: (err) => {
      console.error('❌ Erreur lors de l’envoi du fichier :', err);
      alert("Erreur réseau ou serveur.");
      this.loading = false;
    }
  });
}





}