import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { InvoiceService, UnpaidCraItem } from '../../../services/invoice.service';
import { ClientService } from '../../../services/client.service';

// Layout
import { SideBarComponent } from '../../../Layout/side-bar/side-bar.component';
import { NavLayoutComponent } from '../../../Layout/nav-layout/nav-layout.component';
import { FooterComponent } from '../../../Layout/footer/footer.component';

@Component({
  standalone: true,
  selector: 'app-manager-cra-list',
  imports: [CommonModule, RouterModule, DatePipe, SideBarComponent, NavLayoutComponent, FooterComponent],
  templateUrl: './cra-list.component.html'
})
export class ManagerCraListComponent implements OnInit {
  items: UnpaidCraItem[] = [];
  loading = false;
  error?: string;

  // id client -> nom à afficher
  clientNames: Record<number, string> = {};

  constructor(
    private invoice: InvoiceService,
    private router: Router,
    private clients: ClientService
  ) {}

  ngOnInit(): void {
    this.fetch();
  }

fetch(): void {
  this.loading = true;
  this.error = undefined;

  this.invoice.getUnpaid().subscribe({
    next: (data) => {
      console.log('[CRA] getUnpaid() -> data:', data);
      try { console.table(data as any[]); } catch {}

      this.items = data ?? [];
      this.loading = false;
      this.loadClientNames();
    },
    error: (err) => {
      console.error(err);
      this.error = 'Impossible de charger les CRA impayés.';
      this.loading = false;
    }
  });
}



  private loadClientNames() {
    // Option simple : on récupère tous les clients puis on remplit la map id -> nom
    this.clients.getAll().subscribe({
      next: (all: any[]) => {
        const map: Record<number, string> = {};
        for (const c of all || []) {
          const id = Number(c?.id ?? c?.clientId);
          if (!isNaN(id)) map[id] = this.buildDisplayName(c);
        }
        this.clientNames = map;
      },
      error: err => console.warn('Impossible de charger la liste des clients, on affichera les IDs.', err)
    });
  }

  // essaie plusieurs propriétés possibles pour trouver un nom “humain”
  private buildDisplayName(c: any): string {
    return (
      c?.denomination ||
      c?.name ||
      c?.raisonSociale ||
      c?.donneesJson?.Denomination ||
      c?.donneesJson?.RaisonSociale ||
      c?.email ||
      `Client ${c?.id ?? ''}`
    );
  }

  asNumber(v: number | string | null | undefined): number | null {
    if (v == null) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  formatMonth(monthStr: string | null | undefined): string {
    // Attend "YYYY-MM". Si vide, affiche '-'.
    if (!monthStr) return '-';
    const m = /^(\d{4})-(\d{2})$/.exec(monthStr);
    if (!m) return monthStr;
    // Affiche "2025-08" → "2025-08" (ou "août 2025" si tu préfères)
    return `${m[1]}-${m[2]}`;
  }

async createOrOpen(item: UnpaidCraItem) {
  this.loading = true;
  this.error = undefined;

  try {
    let invoiceId = item.invoiceId ?? null;

    if (invoiceId == null || invoiceId === '') {
      const draftId = await firstValueFrom(this.invoice.createDraft(item.craId));
      if (draftId == null || draftId === '') {
        throw new Error('ID de brouillon non retourné par createDraft');
      }
      invoiceId = draftId;
    }

    // ⬇️ on passe idFournisseur en query param (vendorId)
    await this.router.navigate(
      ['/manager/facture', typeof invoiceId === 'number' ? invoiceId : String(invoiceId)],
      { queryParams: { vendorId: item.idFournisseur ?? undefined } }
    );
  } catch (e) {
    console.error(e);
    this.error = 'Erreur lors de la création/ouverture du brouillon.';
  } finally {
    this.loading = false;
  }
}

loadingRow: Record<number, boolean> = {};

async markPaid(it: UnpaidCraItem) {
  try {
    this.loadingRow[it.craId] = true;
    await firstValueFrom(this.invoice.markCraPaid(it.craId));
    this.items = this.items.filter(x => x.craId !== it.craId); // disparaît de la liste
  } catch (e: any) {
    console.error(e);
    // aide au debug :
    this.error = `Impossible de marquer ce CRA comme payé. (HTTP ${e?.status ?? '??'})`;
  } finally {
    this.loadingRow[it.craId] = false;
  }
}




}





