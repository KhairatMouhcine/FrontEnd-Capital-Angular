import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { AffectationActuelleService, EmploiActuel } from '../../../services/affectation-actuelle.service';
import { ContratService, ContratPayload } from '../../../services/contrat.service';
import { NavLayoutComponent } from "../../../Layout/nav-layout/nav-layout.component";
import { SideBarComponent } from "../../../Layout/side-bar/side-bar.component";
import { FooterComponent } from "../../../Layout/footer/footer.component";

@Component({
  standalone: true,
  selector: 'app-contrat-generate',
  imports: [CommonModule, ReactiveFormsModule, NavLayoutComponent, SideBarComponent, FooterComponent],
  templateUrl: './contrat-generate.component.html',
  styleUrls: ['./contrat-generate.component.css']
})
export class ContratGenerateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private affectation = inject(AffectationActuelleService);
  private contrat = inject(ContratService);

  emplois = signal<EmploiActuel[]>([]);
  loading = signal<boolean>(false);
  generating = signal<boolean>(false);
  selectedEmploiId = signal<number | null>(null);

  form = this.fb.group({
    objet: ['', [Validators.required, Validators.minLength(3)]],
    lieuExecution: ['', [Validators.required, Validators.minLength(2)]],
  });

  onSelectEmploi(id: number) {
    this.selectedEmploiId.set(id);
    console.log('[ContratGenerate] selectedEmploiId =', this.selectedEmploiId(), 'form.valid =', this.form.valid);
  }

  canGenerateNow(): boolean {
    return this.selectedEmploiId() !== null && this.form.valid;
  }

ngOnInit(): void {
  this.loading.set(true);

  this.affectation.getClientProfilsWithNames().subscribe({
    next: (list) => {
      console.log('[ContratGenerate] clientProfils normalisés =', list);
      this.emplois.set(list);
      this.loading.set(false);

      // force Angular à recalculer la validité après màj
      queueMicrotask(() => this.form.updateValueAndValidity());
    },
    error: (err) => {
      console.error('[ContratGenerate] ERREUR GET ClientProfilsWithNames', err);
      this.loading.set(false);
    }
  });
}


  generate() {
    if (!this.canGenerateNow()) return;
    this.generating.set(true);

    const payload: ContratPayload = {
      clientProfilId: this.selectedEmploiId()!,                  
      objet: this.form.value.objet || '',                       
      lieuExecution: this.form.value.lieuExecution || '',       
      clientContenu: '',
      fournisseurContenu: ''
    };

    this.contrat.genererPdf(payload).subscribe({
      next: (res) => {
        const blob = res.body!;
        const ct = res.headers.get('Content-Type') || 'application/pdf';
        const ext = ct.includes('zip') ? 'zip' : 'pdf';
        const filename = `Contrats_${new Date().toISOString().replace(/[:.]/g,'-')}.${ext}`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);

        this.generating.set(false);
      },
      error: () => this.generating.set(false)
    });
  }
}
