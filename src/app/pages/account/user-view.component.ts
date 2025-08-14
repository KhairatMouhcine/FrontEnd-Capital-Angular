import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserManagementService, User } from '../../services/user-management.service';
import { AuthService } from '../../services/auth.service';

// Si tu utilises ces layouts comme pour tes autres pages :
import { SideBarComponent } from "../../Layout/side-bar/side-bar.component";
import { NavLayoutComponent } from "../../Layout/nav-layout/nav-layout.component";
import { FooterComponent } from "../../Layout/footer/footer.component";

@Component({
  selector: 'app-user-view',
  standalone: true,
  imports: [CommonModule, SideBarComponent, NavLayoutComponent, FooterComponent],
  templateUrl: './user-view.component.html'
})
export class UserViewComponent implements OnInit {
  userId: number | null = null;
  user?: User;
  loading = false;
  error?: string;

  constructor(
    private userSrv: UserManagementService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = this.auth.getUserIdFromToken();
    if (!this.userId) {
      this.error = 'Aucune session active. Merci de vous connecter.';
      // Si tu préfères rediriger automatiquement :
      // this.router.navigate(['/login']);
      return;
    }
    this.load();
  }

  load(): void {
    if (!this.userId) return;
    this.loading = true;
    this.error = undefined;

    this.userSrv.getUser(this.userId).subscribe({
      next: (u) => { this.user = u; this.loading = false; },
      error: (err) => { this.error = err?.error || 'Erreur de chargement.'; this.loading = false; }
    });
  }
}
