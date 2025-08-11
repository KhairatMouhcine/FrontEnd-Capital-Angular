import { Component } from '@angular/core';
import { CraService, Crat } from '../services/cra.service';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  imports: [
    BrowserModule,
    FormsModule,
    CommonModule,
    BrowserModule// ✅ ajoute ça ici
  ],
  selector: 'app-remplir-cra',
  templateUrl: './remplir-cra.component.html'
})
export class RemplirCraComponent {
  crats: Crat[] = [];
  affectationId: number = 0;

  constructor(private craService: CraService) {}

  chargerCra() {
    if (!this.affectationId) return;

    this.craService.getCratsByAffectationId(this.affectationId).subscribe({
      next: (data) => {
        this.crats = data;
      },
      error: (err) => {
        console.error('Erreur récupération CRA', err);
      }
    });
  }
}
