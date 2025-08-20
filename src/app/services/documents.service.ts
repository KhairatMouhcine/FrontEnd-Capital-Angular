import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VendorLite {
  id: number;
  name: string;
}

export interface DocumentResponse {
  id: string;
  type: string;
  validUntil: string;
  createdAt: string;
  vendorId: number;
}

export interface CreateDocumentRequest {
  type: string;        // 'Fiscal' | 'Social'
  validUntil: string;  // 'YYYY-MM-DD'
  vendorId: number;
}

export interface PagedVendors {
  items: VendorLite[];
  total: number;
}

// Payload réel de FournisseurMS (expose DonneesJson)
type RawVendor = {
  id: number;
  donneesJson?: any; // peut être objet JSON ou string JSON
};

// transforme la réponse « brute » en { id, name }
function toVendorLite(x: RawVendor): VendorLite {
  let name: string | undefined;

  try {
    const json =
      typeof x.donneesJson === 'string'
        ? JSON.parse(x.donneesJson)
        : x.donneesJson;

    name =
      json?.Denomination ??
      json?.denomination ??
      json?.Name ??
      json?.name;
  } catch {
    // ignore
  }

  if (!name) name = `Fournisseur #${x.id}`;
  return { id: x.id, name };
}

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private docsBase = environment.documentsApiBaseUrl;   // ex: https://localhost:7132/api
  private vendorBase = environment.vendorsApiBaseUrl;   // ex: https://localhost:7285/api

  constructor(private http: HttpClient) {}

  // Liste complète des fournisseurs (le backend ne pagine pas)
  listVendors(): Observable<PagedVendors> {
    return this.http.get<RawVendor[]>(`${this.vendorBase}/vendor`).pipe(
      map(arr => ({ items: arr.map(toVendorLite), total: arr.length }))
    );
  }

  // Recherche côté client (on filtre la liste obtenue)
  searchVendors(term: string): Observable<VendorLite[]> {
    const t = (term ?? '').trim();
    if (t.length < 2) return of([]);

    return this.http.get<RawVendor[]>(`${this.vendorBase}/vendor`).pipe(
      map(arr => arr.map(toVendorLite)),
      map(items =>
        items.filter(v =>
          v.name.toLowerCase().includes(t.toLowerCase())
        )
      )
    );
  }

  // Documents valides du fournisseur
  getValidByVendor(vendorId: number): Observable<DocumentResponse[]> {
    return this.http.get<DocumentResponse[]>(
      `${this.docsBase}/document/vendor/${vendorId}/valid`
    );
  }

  // Création d’un document
  create(body: CreateDocumentRequest): Observable<DocumentResponse> {
    return this.http.post<DocumentResponse>(`${this.docsBase}/document`, body);
  }
}
