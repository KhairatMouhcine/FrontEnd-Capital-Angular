import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AdminComponent } from './pages/admin/admin.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { RhComponent } from './pages/rh/rh.component';
import { ManagerComponent } from './pages/manager/manager.component';
import { PrestataireComponent } from './pages/prestataire/prestataire.component';
import { UnauthorizedComponenComponent } from './pages/unauthorized-componen/unauthorized-componen.component';
import { FournisseurFormComponent } from './components/fournisseur/fournisseur-form/fournisseur-form.component';
import { FournisseurListComponent } from './pages/fournisseur/fournisseur-list/fournisseur-list.component';
import { ProfilListComponent } from './pages/profil/profil-list/profil-list.component';
import { ProfilFormComponent } from './pages/profil/profil-form/profil-form.component';
import { ClientFormComponent } from './pages/client/client-form/client-form.component';
import { ClientListComponent } from './pages/client/client-list/client-list.component';
import { AffectationListComponent } from './components/affectation/affectation-list.component';
import { AffectationFormComponent } from './components/affectation/affectation-form.component';
import { AffectationActuelleComponent } from './components/affectation-actuelle/affectation-actuelle.component';
import { RemplirCraComponent } from './remplir-cra/remplir-cra.component';
import { CratComponent } from './components/cra/crat.component';
import { CraJoursComponent } from './components/cra/cra-jours.component';
import { ArticleListComponent } from './pages/article/article-list/article-list.component';
import { ArticleEditComponent } from './pages/article/article-edit/article-edit.component';
import { ContratGenerateComponent } from './pages/contrat/contrat-generate/contrat-generate.component';
import { RhMatchingComponent } from './pages/rh/matching/matching.component';
import { UserViewComponent } from './pages/account/user-view.component';
import { AuthService } from './services/auth.service';

export const routes: Routes = [
  { path: '', component: LoginComponent },

  // ===== Mon compte =====
  { path: 'profil', component: UserViewComponent, canActivate: [AuthGuard] },
  { path: 'account', redirectTo: 'me', pathMatch: 'full' },

  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: ['admin']}
  },
  {
    path: 'rh',
    component: RhComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: ['rh'] }
  },
  {
    path: 'manager',
    component: ManagerComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: ['manager'] }
  },
  {
    path: 'prestataire',
    component: PrestataireComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: ['prestataire'] }
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponenComponent
  },
  {
    path: 'users',
    canActivate: [AuthGuard, RoleGuard],
    loadComponent: () =>
      import('./user/user-list/user-list.component').then(m => m.UserListComponent),
    data: { role: ['admin'] }
  },
  {
    path: 'users/create',
    canActivate: [AuthGuard, RoleGuard],
    loadComponent: () =>
      import('./user/user-create/user-create.component').then(m => m.UserCreateComponent),
    data: { role: ['admin']}
  },
  {
    path: 'users/:id',
    canActivate: [AuthGuard, RoleGuard],
    loadComponent: () =>
      import('./user/user-edit/user-edit.component').then(m => m.UserEditComponent),
    data: { role: ['admin'] }
  },
  { path: 'fournisseurs', component: FournisseurListComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['admin', 'rh'] }},
  { path: 'fournisseur-edit/:id', component: FournisseurFormComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['admin', 'rh'] } },
  { path: 'fournisseur-add', component: FournisseurFormComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['admin', 'rh'] } },
  { path: 'profils', component: ProfilListComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['admin', 'rh'] } },
  { path: 'profils-new', component: ProfilFormComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['admin', 'rh'] } },
  { path: 'profils-edit/:id', component: ProfilFormComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['admin', 'rh'] } },
  { path: 'clients', component: ClientListComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['admin', 'rh'] } },
  { path: 'client-edit/:id', component: ClientFormComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['admin', 'rh'] } },
  { path: 'client-add', component: ClientFormComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['admin', 'rh'] } },
  { path: 'Affectation', component: AffectationListComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['admin', 'rh'] } },
  { path: 'Affectation-add', component: AffectationFormComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['admin', 'rh'] } },
  { path: 'affectation-edit/:id', component: AffectationFormComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['admin', 'rh'] } },
  { path: 'Mission', component: AffectationActuelleComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['prestataire','admin'] } },
  { path: 'cra/:id', component: CratComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['prestataire','admin'] } },
  { path: 'cra/jours/:id', component: CraJoursComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['prestataire','admin'] } },

  { path: 'articles', component: ArticleListComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['manager','admin'] }},
  { path: 'article-add', component: ArticleEditComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['manager','admin'] }},
  { path: 'article-edit/:id', component: ArticleEditComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['manager','admin'] }},
  { path: 'contrats-generer', component: ContratGenerateComponent, canActivate: [AuthGuard, RoleGuard], data: { role: ['manager','admin'] }},
  {
    path: 'manager/cra',
    loadComponent: () =>
      import('./pages/manager/cra-list/cra-list.component')
        .then(m => m.ManagerCraListComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: ['manager','admin']},
  },
  {
    path: 'manager/facture/:invoiceId',
    loadComponent: () =>
      import('./pages/manager/invoice-editor/invoice-editor.component')
        .then(m => m.InvoiceEditorComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: ['manager','admin']},    
  },

  { path: 'rh/matching', component: RhMatchingComponent },
  { path: 'manager/documents',
  loadComponent: () => import('./pages/manager/documents/documents-page.component')
    .then(m => m.DocumentsPageComponent) },
];
