import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../services/user.service';
import { SideBarComponent } from "../../Layout/side-bar/side-bar.component";
import { NavLayoutComponent } from "../../Layout/nav-layout/nav-layout.component";
import { FooterComponent } from "../../Layout/footer/footer.component";

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SideBarComponent, NavLayoutComponent, FooterComponent],
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.css']
})
export class UserCreateComponent {
  userForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]], // ➕ Ajouté
      role: ['user', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;

    const user: User = this.userForm.value;

    this.userService.createUser(user).subscribe({
      next: () => {
        console.log('✅ Utilisateur créé avec succès');
        this.router.navigate(['/users']);
      },
      error: (err) => {
        console.error('❌ Erreur lors de la création :', err);
      }
    });
  }
}

