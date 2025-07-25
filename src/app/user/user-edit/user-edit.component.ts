import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { FooterComponent } from '../../Layout/footer/footer.component';
import { SideBarComponent } from '../../Layout/side-bar/side-bar.component';
import { NavLayoutComponent } from '../../Layout/nav-layout/nav-layout.component';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FooterComponent,
    SideBarComponent,
    NavLayoutComponent
  ],
  templateUrl: './user-update.component.html',
  styleUrls: ['./user-edit.component.css']
})
export class UserEditComponent implements OnInit {
  userForm!: FormGroup;
  userId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Initialise un formulaire vide
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''], // vide par défaut
      role: ['', Validators.required]
    });

    this.userId = Number(this.route.snapshot.paramMap.get('id'));

    this.userService.getUser(this.userId).subscribe({
      next: (user) => {
        console.log('👤 Utilisateur chargé :', user);
        this.userForm.patchValue({
          name: user.name,
          email: user.email,
          role: user.role
        });
      },
      error: (err) => {
        console.error('❌ Erreur lors de la récupération de l\'utilisateur :', err);
        this.router.navigate(['/users']);
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      console.warn('⛔ Formulaire invalide');
      return;
    }

    const updatedUser = {
      id: this.userId,
      ...this.userForm.value
    };

    console.log('📤 Données envoyées pour mise à jour :', updatedUser);

    this.userService.updateUser(this.userId, updatedUser).subscribe({
      next: () => {
        console.log('✅ Utilisateur mis à jour avec succès');
        this.router.navigate(['/users']);
      },
      error: (err) => {
        console.error('❌ Erreur lors de la mise à jour :', err);
      }
    });
  }
}
