import { Component, OnInit } from '@angular/core';
import { Client, ClientService } from '../../../services/client.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { SideBarComponent } from '../../../Layout/side-bar/side-bar.component';
import { NavLayoutComponent } from '../../../Layout/nav-layout/nav-layout.component';
import { FooterComponent } from '../../../Layout/footer/footer.component';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SideBarComponent,
    NavLayoutComponent,
    FooterComponent
  ],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.css']
})
export class ClientListComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  pagedClients: Client[] = [];

  searchControl = new FormControl('');
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  constructor(
    private clientService: ClientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.clientService.getAll().subscribe({
      next: (data) => {
        this.clients = data;
        this.filteredClients = [...this.clients];
        this.updatePagination();
      },
      error: (err) => console.error('❌ Erreur chargement clients', err)
    });

    this.searchControl.valueChanges
  .pipe(debounceTime(300))
  .subscribe(query => {
    const q = query?.toLowerCase() || '';
    this.filteredClients = this.clients.filter(c =>
      c.donneesJson?.Denomination?.toLowerCase().includes(q)
    );
    this.currentPage = 1;
    this.updatePagination();
  });

  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedClients = this.filteredClients.slice(start, end);
    this.totalPages = Math.ceil(this.filteredClients.length / this.pageSize);
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

  addClient(): void {
    this.router.navigate(['/client-add']);
  }

  editClient(id: number): void {
    this.router.navigate(['/client-edit', id]);
  }

  deleteClient(id: number): void {
    this.clientService.delete(id).subscribe({
      next: () => {
        this.clients = this.clients.filter(c => c.id !== id);
        this.filteredClients = this.filteredClients.filter(c => c.id !== id);
        this.updatePagination();
      },
      error: (err) => console.error('❌ Erreur suppression client', err)
    });
  }
}
