import { Component, OnInit } from '@angular/core';
import { Fournisseur, FournisseurService } from '../../../services/fournisseur.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SideBarComponent } from '../../../Layout/side-bar/side-bar.component';
import { NavLayoutComponent } from '../../../Layout/nav-layout/nav-layout.component';
import { FooterComponent } from '../../../Layout/footer/footer.component';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
@Component({
  selector: 'app-fournisseur-list',
  standalone: true, // 👉 Ajoute ceci si tu utilises Angular standalone components
  imports: [CommonModule, ReactiveFormsModule, SideBarComponent, NavLayoutComponent, FooterComponent],
  templateUrl: './fournisseur-list.component.html',
  styleUrls: ['./fournisseur-list.component.css']
})
export class FournisseurListComponent implements OnInit {
  fournisseurs: Fournisseur[] = [];
  pagedFournisseurs: Fournisseur[] = [];
searchControl = new FormControl('');
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;

  searchForm: FormGroup;
  filteredFournisseurs: Fournisseur[] = [];

  constructor(
    private fb: FormBuilder,
    private fournisseurService: FournisseurService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      query: ['']
    });
  }

ngOnInit(): void {
  this.fournisseurService.getAll().subscribe({
    next: (data) => {
      this.fournisseurs = data;
      this.filteredFournisseurs = [...this.fournisseurs];
      this.updatePagination();
    },
    error: (err) => console.error(err)
  });

  // 🔁 Ecoute des changements de recherche en temps réel
  this.searchControl.valueChanges
    .pipe(debounceTime(300)) // attendre 300ms après que l'utilisateur tape
    .subscribe(query => {
      const q = query?.toLowerCase() || '';
      this.filteredFournisseurs = this.fournisseurs.filter(f =>
        f.donneesJson?.Denomination?.toLowerCase().includes(q)
      );
      this.currentPage = 1;
      this.updatePagination();
    });
}
addFournisseur(): void {
  this.router.navigate(['/fournisseur-add']); // adapte selon ta route Angular
}

  onSearch(): void {
    const query = this.searchForm.get('query')?.value?.toLowerCase() || '';
    this.filteredFournisseurs = this.fournisseurs.filter(f =>
      f.donneesJson?.Denomination?.toLowerCase().includes(query)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedFournisseurs = this.filteredFournisseurs.slice(start, end);
    this.totalPages = Math.ceil(this.filteredFournisseurs.length / this.pageSize);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  editFournisseur(id: number): void {
    this.router.navigate(['/fournisseur-edit', id]);
  }

  deleteFournisseur(id: number): void {
    this.fournisseurService.delete(id).subscribe({
      next: () => {
        this.fournisseurs = this.fournisseurs.filter(f => f.id !== id);
        this.filteredFournisseurs = this.filteredFournisseurs.filter(f => f.id !== id);
        this.updatePagination();
      },
      error: (err) => console.error(err)
    });
  }
}
