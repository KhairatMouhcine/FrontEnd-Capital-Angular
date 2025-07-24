import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import { FooterComponent } from "../../Layout/footer/footer.component";
import { NavLayoutComponent } from "../../Layout/nav-layout/nav-layout.component";
import { SideBarComponent } from "../../Layout/side-bar/side-bar.component";

@Component({
  standalone: true,
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  imports: [
    CommonModule,
    RouterModule,
    FooterComponent,
    NavLayoutComponent,
    SideBarComponent
  ]
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  paginatedUsers: User[] = [];

  usersPerPage = 10;
  currentPage = 1;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    this.userService.getUsers().subscribe(users => {
      this.users = users;
      this.updatePaginatedUsers();
    });
  }

  updatePaginatedUsers() {
    const start = (this.currentPage - 1) * this.usersPerPage;
    const end = start + this.usersPerPage;
    this.paginatedUsers = this.users.slice(start, end);
  }

  changePage(page: number) {
    this.currentPage = page;
    this.updatePaginatedUsers();
  }

  get totalPages(): number[] {
    return Array(Math.ceil(this.users.length / this.usersPerPage))
      .fill(0)
      .map((_, i) => i + 1);
  }

  delete(id: number): void {
    if (confirm('Supprimer cet utilisateur ?')) {
      this.userService.deleteUser(id).subscribe(() => {
        this.users = this.users.filter(u => u.id !== id);
        this.updatePaginatedUsers(); // 🔁 met à jour la pagination
      });
    }
  }
}
