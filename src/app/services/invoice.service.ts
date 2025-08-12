import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UnpaidCraItem {
  // '2025-08' (AAAA-MM). On normalise côté service si besoin.
  mois: string;
  estSigner?: boolean | null; 
  // ISO date (string) pour l’échéance
  dateEcheance: string;

  // (facultatif si backend les renvoie)
  prestataireId?: number | null;
  prestataireNom?: string | null;
  isExternal?: boolean | null;  // true = externe, false = interne

  craId: number;
  clientId?: number | string | null;
  dateDebut: string | Date;
  dateFin: string | Date;
  nomComplet?: string | null;

  // Champs parfois présents dans la payload
  clientDenomination?: string | null;
  idFournisseur?: number | null;
  vendorDenomination?: string | null;

  // autres champs éventuels
  invoiceId?: number | string | null;
}

export interface LineInput {
  description: string;
  prixUnitaire: number;
  prixFournisseur?: number; // requis si isExternal=true
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly base = environment.apiBase; // ex: http://localhost:7112/api/factures

  constructor(private http: HttpClient) {}

  /**
   * GET /unpaid-overdue
   * → normalise les champs "vides" ({}) en null + garantit les types attendus
   */
getUnpaid(): Observable<UnpaidCraItem[]> {
  return this.http.get<unknown[]>(`${this.base}/unpaid-overdue`).pipe(
    map((rawItems) =>
      (rawItems ?? []).map((x: any): UnpaidCraItem => {
        const normalizeObjectEmptyToNull = <T extends number | string | null>(v: any): T | null =>
          v && typeof v === 'object' && Object.keys(v).length === 0 ? null : (v as T ?? null);

        const toBoolOrNull = (v: any): boolean | null =>
          typeof v === 'boolean'
            ? v
            : v == null
              ? null
              : (String(v).toLowerCase() === 'true'
                  ? true
                  : String(v).toLowerCase() === 'false'
                    ? false
                    : null);

        const toDate = (v: any): Date | null => {
          if (!v) return null;
          if (v instanceof Date) return v;
          const d = new Date(v);
          return isNaN(d.getTime()) ? null : d;
        };

        const monthFromDate = (d: Date | null): string => {
          if (!d) return '';
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          return `${y}-${m}`;
        };

        const toMonth = (v: any): string => {
          if (typeof v === 'string' && /^\d{4}-\d{2}$/.test(v)) return v;
          if (typeof v === 'string') {
            const m = v.match(/^(\d{4})-(\d{2})/);
            if (m) return `${m[1]}-${m[2]}`;
          }
          if (v instanceof Date) return monthFromDate(v);
          return '';
        };

        const toISODate = (v: any): string => {
          const d = toDate(v);
          return d ? d.toISOString().slice(0, 10) : '';
        };

        // Dates brutes qu’on peut utiliser en fallback
        const dDebut = toDate(x?.dateDebut ?? x?.debut);
        const dFin = toDate(x?.dateFin ?? x?.fin);

        // mois: backend > sinon month(dateDebut) > sinon month(dateFin)
        const mois =
          toMonth(x?.mois ?? x?.month) ||
          monthFromDate(dDebut) ||
          monthFromDate(dFin) ||
          '';

        // échéance: backend > sinon dateFin (jj) > sinon ''
        const dateEcheance =
          String(x?.dateEcheance ?? x?.echeance ?? '') ||
          toISODate(dFin) ||
          '';

        return {
          mois,
          dateEcheance,

          prestataireId: normalizeObjectEmptyToNull<number>(x?.prestataireId),
          prestataireNom: normalizeObjectEmptyToNull<string>(x?.prestataireNom),
          isExternal: toBoolOrNull(x?.isExternal),

          craId: Number(x?.craId ?? x?.id ?? 0),
          clientId: normalizeObjectEmptyToNull<number | string>(x?.clientId),

          dateDebut: x?.dateDebut ?? x?.debut ?? '',
          dateFin: x?.dateFin ?? x?.fin ?? '',

          nomComplet: normalizeObjectEmptyToNull<string>(x?.nomComplet),

          clientDenomination: normalizeObjectEmptyToNull<string>(x?.clientDenomination),
          idFournisseur: normalizeObjectEmptyToNull<number>(x?.idFournisseur),
          vendorDenomination: normalizeObjectEmptyToNull<string>(x?.vendorDenomination),

          invoiceId: normalizeObjectEmptyToNull<number | string>(x?.invoiceId),
          estSigner: toBoolOrNull(x?.estSigner ?? x?.estSigne ?? x?.signed ?? x?.isSigned),

        };
      })
    )
  );
}

// invoice.service.ts (ou cra.service.ts selon ton organisation)
markCraPaid(craId: number) {
  return this.http.post<void>(`${this.base}/mark-paid/${craId}`, null);
}



  /**
   * POST /{craId}/draft -> string (invoiceId GUID ou autre identifiant)
   */
  createDraft(craId: number): Observable<string> {
    return this.http.post(`${this.base}/${craId}/draft`, null, { responseType: 'text' }).pipe(
      map(raw => {
        if (!raw) return '';
        const dequoted = raw.trim().replace(/^"+|"+$/g, '');

        // Essaie de parser en JSON
        try {
          const parsed = JSON.parse(dequoted);
          const candidate = parsed.invoiceId ?? parsed.id ?? parsed.fileName;
          if (typeof candidate === 'string' && candidate.length > 0) return candidate;
          if (typeof candidate === 'number') return String(candidate);
        } catch {
          // pas du JSON
        }

        // Dernier recours : extraire un GUID
        const m = dequoted.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
        if (m) return m[0];

        return dequoted;
      })
    );
  }

  /**
   * PUT /{invoiceId}/lines?isExternal=... -> 204
   */
  updateLines(invoiceId: string, lines: LineInput[], isExternal: boolean): Observable<void> {
    const params = new HttpParams().set('isExternal', String(isExternal));
    return this.http.put<void>(`${this.base}/${invoiceId}/lines`, lines ?? [], { params });
  }

  /**
   * POST /{invoiceId}/generate -> binaire + filename via Content-Disposition
   */
  generate(invoiceId: string): Observable<{ blob: Blob; fileName: string }> {
    return this.http.post(`${this.base}/${invoiceId}/generate`, null, {
      observe: 'response',
      responseType: 'blob'
    }).pipe(
      map(res => {
        const rawBlob = res.body as Blob;
        const contentType =
          res.headers.get('Content-Type') ||
          res.headers.get('content-type') ||
          'application/octet-stream';

        const cd =
          res.headers.get('Content-Disposition') ||
          res.headers.get('content-disposition') ||
          '';

        // 1) Extraire le filename depuis Content-Disposition
        let fileName = '';
        const m1 = /filename\*=(?:UTF-8''|)([^;]+)/i.exec(cd);
        const m2 = /filename="?([^";]+)"?/i.exec(cd);
        if (m1?.[1]) fileName = decodeURIComponent(m1[1].replace(/"/g, ''));
        else if (m2?.[1]) fileName = m2[1];

        // 2) Déduire l'extension d'après Content-Type si manquante
        const isZip = /zip/i.test(contentType);
        const isPdf = /pdf/i.test(contentType);

        if (!fileName) {
          fileName = isZip ? 'facture.zip' : (isPdf ? 'facture.pdf' : 'facture.bin');
        } else if (!/\.(zip|pdf)$/i.test(fileName)) {
          fileName += isZip ? '.zip' : (isPdf ? '.pdf' : '');
        }

        // 3) Recréer un blob en conservant le bon type
        const blob = new Blob([rawBlob], { type: contentType });

        return { blob, fileName };
      })
    );
  }
}
