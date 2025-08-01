// src/app/services/affectation-actuelle.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { AffectationService, Affectation } from './affectation.service';

export interface EmploiActuel {
  id: number;
  denomination: string;     // libellé affiché (ici: nom du client)
  profilNom?: string;       // nom complet du profil (ex: "ELFAIZE Youssef")
  clientNom?: string;       // nom du client (ex: "TM SERVICES")
}

// Structure brute de MissionMS (si tu l’utilises ailleurs)
export interface ClientProfil {
  id: number;
  profilId: number;
  clientId: number;
  profilNom?: string;
  clientNom?: string;
  dateDebut: string;
  dateFin?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AffectationActuelleService {
  private apiUrl = 'https://localhost:7107/api/ClientProfil'; // MissionMS

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private affectationSvc: AffectationService    // ⬅️ on réutilise la même API que la liste
  ) {}

  // ===== Ancienne méthode (conservée) =====
  getEmploisActuels(): Observable<EmploiActuel[]> {
    const userId = this.auth.getUserIdFromToken();
    return this.http.get<number>(`https://localhost:7079/api/profil/by-user/${userId}`).pipe(
      switchMap((profilId: number) =>
        this.http
          .get<{ id: number; denomination: string }[]>(
            `${this.apiUrl}/currentEmploi?id=${profilId}`
          )
          .pipe(
            map(list =>
              list.map(x => ({
                id: x.id,
                denomination: x.denomination,
                profilNom: `Profil#${profilId}` // fallback
              }))
            )
          )
      )
    );
  }

  // ===== Méthode existante (MissionMS brut) =====
  getAllClientProfils(): Observable<EmploiActuel[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(list => {
        if (!Array.isArray(list)) return [];
        return list
          .map(raw => {
            const id = Number(raw.id ?? raw.Id ?? raw.ID ?? raw.idAffectation);
            if (!Number.isFinite(id)) return null;

            const profilId = raw.profilId ?? raw.ProfilId;
            const clientId = raw.clientId ?? raw.ClientId;

            return <EmploiActuel>{
              id,
              denomination: raw.denomination ?? raw.Denomination ?? `CP#${id}`,
              profilNom: raw.profilNom ?? raw.ProfilNom ?? (profilId ? `Profil#${profilId}` : undefined),
              clientNom: raw.clientNom ?? raw.ClientNom ?? raw.clientDenomination ?? (clientId ? `Client#${clientId}` : undefined),
            };
          })
          .filter(Boolean) as EmploiActuel[];
      })
    );
  }

  // ===== NOUVELLE MÉTHODE : mêmes noms que la vue "Affectation" =====
  // Utilise l'API déjà affichée dans la liste (dénomination, nom, prénom)
  getClientProfilsWithNames(): Observable<EmploiActuel[]> {
    return this.affectationSvc.getCurrent().pipe(
      map((rows: Affectation[] = []) =>
        rows
          .map(r => {
            const id = Number(r.idAffectation ?? r.clientId ?? r.profilId);
            if (!Number.isFinite(id)) return null;

            const clientNom =
              (r as any).denomination ?? (r as any).clientNom ?? `Client#${(r as any).clientId ?? ''}`;

            const profilNom =
              [ (r as any).nom, (r as any).prenom ].filter(Boolean).join(' ') ||
              (r as any).profilNom ||
              `Profil#${(r as any).profilId ?? ''}`;

            return <EmploiActuel>{
              id,
              denomination: clientNom, // libellé principal dans la liste
              clientNom,
              profilNom,
            };
          })
          .filter(Boolean) as EmploiActuel[]
      )
    );
  }
}
