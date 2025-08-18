import { DocumentsService, VendorLite, DocumentResponse, CreateDocumentRequest, PagedVendors } from './../../../services/documents.service';
import { Component, OnInit } from '@angular/core';
import { NavLayoutComponent } from "../../../Layout/nav-layout/nav-layout.component";
import { SideBarComponent } from "../../../Layout/side-bar/side-bar.component";
import { FooterComponent } from "../../../Layout/footer/footer.component";
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';


@Component({
  selector: 'app-documents-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,NavLayoutComponent, SideBarComponent, FooterComponent],
  templateUrl: './documents-page.component.html',
  styleUrls: ['./documents-page.component.css']
})
export class DocumentsPageComponent implements OnInit {
  // recherche
  query = '';
  suggestions: VendorLite[] = [];
  private search$ = new Subject<string>();

  // liste fournisseurs
  vendors: VendorLite[] = [];
  total = 0;

  // sélection + documents
  selectedVendor?: VendorLite;
  rows: DocumentResponse[] = [];

  loading = false;
  error?: string;

  // --- Ajout document (nouveau) ---
  showForm = false;
  addDocForm!: FormGroup;
  today = new Date(); // pour limiter la date min dans l'input

  constructor(private svc: DocumentsService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadVendors();

    // form réactif pour l'ajout
    this.addDocForm = this.fb.group({
      type: ['Fiscal', Validators.required],         // 'Fiscal' | 'Social'
      validUntil: ['', Validators.required]           // 'YYYY-MM-DD'
    });

    // autocomplete (filtre côté service)
    this.search$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap(term => this.svc.searchVendors(term))
      )
      .subscribe(list => (this.suggestions = list));
  }

  loadVendors() {
    this.loading = true;
    this.svc.listVendors().subscribe({
      next: (res: PagedVendors) => {
        this.vendors = res.items;
        this.total = res.total;
        this.loading = false;
      },
      error: e => {
        this.error = 'Erreur chargement fournisseurs';
        this.loading = false;
        console.error(e);
      }
    });
  }

  onQueryChange(val: string) {
    this.query = val;
    this.selectedVendor = undefined;
    this.suggestions = [];
    this.search$.next(val);
  }

  pick(v: VendorLite) {
    this.selectedVendor = v;
    this.query = `${v.name} (#${v.id})`;
    this.suggestions = [];
    this.loadDocs();
  }

  loadDocs() {
    if (!this.selectedVendor) return;
    this.loading = true;
    this.svc.getValidByVendor(this.selectedVendor.id).subscribe({
      next: d => {
        this.rows = d;
        this.loading = false;
      },
      error: e => {
        this.error = 'Erreur de chargement des documents';
        this.loading = false;
        console.error(e);
      }
    });
  }

  // Au clic sur "+ Ajouter un document" on affiche juste le formulaire
  addDocument() {
    if (!this.selectedVendor) {
      this.error = 'Choisissez d’abord un fournisseur.';
      return;
    }
    this.showForm = true;
  }

  // Soumission du formulaire
  submitAddDocument() {
    if (!this.selectedVendor) return;
    if (this.addDocForm.invalid) {
      this.addDocForm.markAllAsTouched();
      return;
    }

    const { type, validUntil } = this.addDocForm.value;
    const body: CreateDocumentRequest = {
      type, // 'Fiscal' ou 'Social'
      validUntil,
      vendorId: this.selectedVendor.id
    };

    this.loading = true;
    this.svc.create(body).subscribe({
      next: _ => {
        this.loading = false;
        this.showForm = false;
        this.addDocForm.reset({ type: 'Fiscal', validUntil: '' });
        this.loadDocs();
      },
      error: e => {
        this.loading = false;
        alert('Erreur création document');
        console.error(e);
      }
    });
  }

  // Annuler l'ajout
  cancelAddDocument() {
    this.showForm = false;
    this.addDocForm.reset({ type: 'Fiscal', validUntil: '' });
  }
}
