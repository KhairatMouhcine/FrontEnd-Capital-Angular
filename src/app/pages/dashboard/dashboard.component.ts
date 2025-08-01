import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FooterComponent } from "../../Layout/footer/footer.component";
import { NavLayoutComponent } from "../../Layout/nav-layout/nav-layout.component";
import { SideBarComponent } from "../../Layout/side-bar/side-bar.component";
// import { FixedPluginComponent } from "../../Layout/fixed-plugin/fixed-plugin.component"; // si besoin

import { UserManagementService, User } from '../../services/user-management.service';
import { AuthService } from '../../services/auth.service';

declare var Chart: any;
declare var Scrollbar: any;

// --- Rôles & thème ---
type AppRole = 'ADMIN' | 'MANAGER' | 'RH' | 'PRESTATAIRE';

const ROLE_THEME_CLASS: Record<AppRole, string> = {
  ADMIN: 'card admin',
  MANAGER: 'card manager',
  RH: 'card rh',
  PRESTATAIRE: 'card prestataire'
};

function normalizeRole(raw?: string): AppRole {
  const r = (raw || '').trim().toUpperCase();
  if (r.includes('ADMIN')) return 'ADMIN';
  if (r.includes('MANAGER')) return 'MANAGER';
  if (r.includes('PREST')) return 'PRESTATAIRE';
  return 'RH';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  imports: [CommonModule, FooterComponent, NavLayoutComponent, SideBarComponent] // + FixedPluginComponent si utilisé
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  // --- User & états UI ---
  user?: User;
  loading = false;
  error?: string;

  // --- Date & horloge ---
  todayStr = '';
  timeStr = '';
  private timer?: any;

  constructor(
    private userSrv: UserManagementService,
    private auth: AuthService
  ) {}

  // ---------------- Lifecycle ----------------
  ngOnInit(): void {
    // Charger l'utilisateur via /me si dispo, sinon via token -> getUser(id)
    this.loading = true;
    if (typeof (this.userSrv as any).getCurrentUser === 'function') {
      (this.userSrv as any).getCurrentUser().subscribe({
        next: (u: User) => { this.user = u; this.loading = false; },
        error: () => { this.error = 'Impossible de récupérer /me.'; this.loading = false; }
      });
    } else {
      const id = this.auth.getUserIdFromToken?.();
      if (!id) { this.error = 'Session invalide.'; this.loading = false; return; }
      this.userSrv.getUser(id).subscribe({
        next: (u) => { this.user = u; this.loading = false; },
        error: () => { this.error = 'Impossible de charger l’utilisateur.'; this.loading = false; }
      });
    }

    // Démarrer l’horloge
    this.updateDateTime();
    this.timer = setInterval(() => this.updateDateTime(), 1000);
  }

  ngAfterViewInit(): void {
    // ---------------- Chart.js ----------------
    const ctx = document.getElementById('chart-line') as HTMLCanvasElement | null;
    if (ctx) {
      const gctx = ctx.getContext('2d');
      const gradientStroke = gctx?.createLinearGradient(0, 230, 0, 50);

      if (gradientStroke) {
        gradientStroke.addColorStop(1, 'rgba(94, 114, 228, 0.2)');
        gradientStroke.addColorStop(0.2, 'rgba(94, 114, 228, 0.0)');
        gradientStroke.addColorStop(0, 'rgba(94, 114, 228, 0)');

        new Chart(ctx, {
          type: "line",
          data: {
            labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [{
              label: "Mobile apps",
              tension: 0.4,
              pointRadius: 0,
              borderColor: "#5e72e4",
              backgroundColor: gradientStroke,
              borderWidth: 3,
              fill: true,
              data: [50, 40, 300, 220, 500, 250, 400, 230, 500],
              maxBarThickness: 6
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
          }
        });
      }
    }

    // ---------------- Scrollbar ----------------
    const sidenavScrollbar = document.querySelector('#sidenav-scrollbar');
    if (sidenavScrollbar && Scrollbar) {
      Scrollbar.init(sidenavScrollbar, { damping: '0.5' });
    }

    // ---------------- Sidenav toggle (conserve ta logique) ----------------
    const iconNavbarSidenav = document.getElementById('iconNavbarSidenav');
    const sidenav = document.getElementById('sidenav-main');
    const body = document.getElementsByTagName('body')[0];
    const className = 'g-sidenav-pinned';

    if (iconNavbarSidenav && sidenav && body) {
      iconNavbarSidenav.addEventListener('click', () => {
        const isPinned = body.classList.contains(className);
        sidenav.setAttribute('data-manual-toggle', 'true');

        if (isPinned) {
          body.classList.remove(className);
          setTimeout(() => { sidenav.classList.remove('bg-white'); }, 100);
          sidenav.classList.remove('bg-transparent');
        } else {
          body.classList.add(className);
          sidenav.classList.add('bg-white');
          sidenav.classList.remove('bg-transparent');
        }
      });

      const navToggleLi = document.querySelector('.nav-item.d-xl-none');
      if (navToggleLi) {
        const observer = new MutationObserver(() => {
          const isHidden = window.getComputedStyle(navToggleLi as Element).display === 'none';
          if (isHidden) {
            body.classList.add(className);
            sidenav.classList.add('bg-white');
            sidenav.classList.remove('bg-transparent');
            sidenav.removeAttribute('data-manual-toggle');
          }
        });

        observer.observe(navToggleLi, { attributes: true, attributeFilter: ['style', 'class'] });
      }
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  // ---------------- Utils ----------------
  private updateDateTime(): void {
    const tz = 'Africa/Casablanca';
    const now = new Date();

    this.todayStr = new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      timeZone: tz
    }).format(now);

    this.timeStr = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: tz
    }).format(now);
  }

  /** Classe CSS de la grande card selon le rôle */
  getCardClass(): string {
    return ROLE_THEME_CLASS[ normalizeRole(this.user?.role) ];
  }
}
