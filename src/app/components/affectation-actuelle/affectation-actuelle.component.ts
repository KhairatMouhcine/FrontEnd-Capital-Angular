import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AffectationActuelleService, EmploiActuel } from '../../services/affectation-actuelle.service';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule, JsonPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NavLayoutComponent } from '../../Layout/nav-layout/nav-layout.component';
import { SideBarComponent } from '../../Layout/side-bar/side-bar.component';
import { FooterComponent } from '../../Layout/footer/footer.component';
import { Router } from '@angular/router';

@Component({
  imports: [CommonModule, ReactiveFormsModule, NavLayoutComponent, SideBarComponent, FooterComponent],
  selector: 'app-affectation-actuelle',
  templateUrl: './affectation-actuelle.component.html',
  styleUrls: ['./affectation-actuelle.component.css'] // <-- ICI tu l’ajoutes
})
export class AffectationActuelleComponent implements OnInit {
  emplois: EmploiActuel[] = [];

  constructor(private AffectationService: AffectationActuelleService,private router: Router) {}

  ngOnInit(): void {
    this.AffectationService.getEmploisActuels().subscribe({
      next: (data) => this.emplois = data,
      error: (err) => console.error('Erreur chargement emplois :', err)
    });
  }

  remplirCrat(affectationId: number) {
    console.log('Remplir CRA pour affectation ID =', affectationId);
    this.router.navigate(['/cra', affectationId]);
  }
  AfficherCra(affectationId: number) {
  this.router.navigate(['/cra', affectationId]);
}
}
