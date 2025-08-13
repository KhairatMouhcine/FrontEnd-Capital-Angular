import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InvoiceService, LineInput } from '../../../services/invoice.service';

import { SideBarComponent } from '../../../Layout/side-bar/side-bar.component';
import { NavLayoutComponent } from '../../../Layout/nav-layout/nav-layout.component';
import { FooterComponent } from '../../../Layout/footer/footer.component';

@Component({
  standalone: true,
  selector: 'app-invoice-editor',
  imports: [CommonModule, FormsModule, SideBarComponent, NavLayoutComponent, FooterComponent],
  templateUrl: './invoice-editor.component.html'
})
export class InvoiceEditorComponent {
  invoiceId = '';
  /** Si un fournisseur est passé, on bascule en mode “externe” */
  vendorId: number | null = null;
  /** Flag UI: si true, on affiche le champ Prix fournisseur et on le rend requis */
  showSupplierPrice = false;

  // (on n'utilise plus isExternal côté UI; on s'appuie sur showSupplierPrice)
  lines: LineInput[] = [{ description: '', prixUnitaire: 0 }];

  saving = false;
  generating = false;
  info?: string;
  error?: string;

  constructor(private route: ActivatedRoute, private invoice: InvoiceService) {
    this.invoiceId = this.route.snapshot.paramMap.get('invoiceId') ?? '';

    const rawVendor = this.route.snapshot.queryParamMap.get('vendorId');
    const parsed = rawVendor != null ? Number(rawVendor) : NaN;
    this.vendorId = !isNaN(parsed) ? parsed : null;

    // ⬇️ Logique demandée: si vendorId existe → afficher le champ Prix fournisseur
    this.showSupplierPrice = this.vendorId !== null;
  }

  addRow() {
    this.lines.push({ description: '', prixUnitaire: 0 });
  }

  removeRow(i: number) {
    this.lines.splice(i, 1);
    if (this.lines.length === 0) this.addRow();
  }

  private valid(): boolean {
    if (this.showSupplierPrice) {
      return this.lines.every(
        l => !!l.description && l.prixUnitaire > 0 && (l.prixFournisseur ?? 0) > 0
      );
    }
    return this.lines.every(l => !!l.description && l.prixUnitaire > 0);
  }

save() {
  this.info = undefined;
  this.error = undefined;

  if (!this.valid()) {
    this.error = 'Complète les lignes correctement (prix > 0, description requise).';
    return;
  }

  // 👇 Affiche le payload et le flag dans la console dev (F12)
  console.log('--- Requête updateLines ---');
  console.log('InvoiceId:', this.invoiceId);
  console.log('isExternal:', this.showSupplierPrice);
  console.log('Payload (lines):', JSON.stringify(this.lines, null, 2));

  this.saving = true;
  this.invoice.updateLines(this.invoiceId, this.lines, this.showSupplierPrice).subscribe({
    next: () => {
      this.info = 'Lignes sauvegardées.';
      this.saving = false;
    },
    error: err => {
      console.error(err);
      this.error = 'Échec de sauvegarde.';
      this.saving = false;
    }
  });
}


  generate() {
    this.info = undefined;
    this.error = undefined;
    this.generating = true;

    this.invoice.generate(this.invoiceId).subscribe({
      next: ({ blob, fileName }) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'facture';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.generating = false;
        this.info = `Fichier généré : ${a.download}`;
      },
      error: err => {
        console.error(err);
        this.generating = false;
        this.error = 'Échec de génération.';
      }
    });
  }
}
