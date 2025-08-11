import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CraService } from '../../services/cra.service';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { SideBarComponent } from "../../Layout/side-bar/side-bar.component";
import { NavLayoutComponent } from "../../Layout/nav-layout/nav-layout.component";
import { FooterComponent } from "../../Layout/footer/footer.component";

@Component({
  selector: 'app-crat',
  imports: [CommonModule, SideBarComponent, NavLayoutComponent, FooterComponent],
  templateUrl: './crat.component.html'
})
export class CratComponent implements OnInit {
  affectationId!: number;
  crats: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private craService: CraService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.affectationId = +this.route.snapshot.paramMap.get('id')!;
    this.craService.getCratsByAffectationId(this.affectationId).subscribe(data => {
      this.crats = data;
    });
  }
voirJours(craId: number) {
  console.log("Voir détails des jours pour le Crat ID =", craId);
  this.router.navigate(['/cra/jours', craId]); // redirection vers la route Angular
}
}
