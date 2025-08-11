import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Article {
  id?: number;
  titre: string;
  contenu: string;      // ← correspond à Article.Contenu côté C#
  ordre?: number | null;
  type: 'client' | 'fournisseur';
}

@Injectable({ providedIn: 'root' })
export class ArticleService {
  // ⚠️ Mets ici le port réel de ContratMS
  private apiUrl = 'https://localhost:7071/api/Article';

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(private http: HttpClient) {}

  getAll(): Observable<Article[]> {
    return this.http.get<Article[]>(this.apiUrl);
  }

  getById(id: number): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${id}`);
  }

  create(dto: Article): Observable<Article> {
    return this.http.post<Article>(this.apiUrl, dto, this.httpOptions);
  }

  update(id: number, dto: Article): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto, this.httpOptions);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
