import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router'; // 👈 Import router
import { AuthService } from '../../services/auth.service';
import { NavSignComponent } from '../../nav-sign/nav-sign.component';
import { FooterComponent } from "../../Layout/footer/footer.component";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, NavSignComponent, FooterComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router // 👈 Inject router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
  private redirectByRole(role: string | undefined): void {
  switch (role) {
    case 'admin':
      this.router.navigate(['/admin']);
      break;
    case 'manager':
      this.router.navigate(['/manager']);
      break;
    case 'rh':
      this.router.navigate(['/rh']);
      break;
    case 'prestataire':
      this.router.navigate(['/prestataire']);
      break;
    default:
      this.router.navigate(['/unauthorized']);
      break;
  }
}

  ngOnInit(): void {
    const token = this.authService.getToken();
    if (token) {
      const role = this.authService.getUserRole(); 
      this.redirectByRole(role  ?? undefined);
    }
  }
  onSubmit(): void {
    console.log('Bouton cliqué');

    if (this.loginForm.invalid) {
      console.warn('Formulaire invalide');
      return;
    }

    console.log('Formulaire valide, données envoyées :', this.loginForm.value);

    this.loading = true;
    this.error = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        console.log('Login success:', res);
          console.log('Token reçu:', res.token); // 👈 AJOUTE ÇA
        this.authService.storeToken(res.token);
        console.log('Login stocker:');


        const role = res.user?.role;
        
        // 👇 Redirection selon le rôle
        switch (role) {
          case 'admin':
            this.router.navigate(['/admin']);
            break;
          case 'manager':
            this.router.navigate(['/manager']);
            break;
          case 'rh':
            this.router.navigate(['/rh']);
            break;
          case 'prestataire':
            this.router.navigate(['/prestataire']);
            break;
          default:
            this.router.navigate(['/unauthorized']);
            break;
        }

        this.loading = false;
      },
      error: (err) => {
  console.error('Login failed:', err); // affiche tout l'objet erreur
  this.error = err.error?.message || 'Login failed. Please check your credentials.';
  this.loading = false;
}
    });
  }
}
