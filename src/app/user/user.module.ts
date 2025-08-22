import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { UserListComponent } from './user-list/user-list.component';
import { UserCreateComponent } from './user-create/user-create.component';
import { UserEditComponent } from './user-edit/user-edit.component'; // 👈 même s'il est standalone

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    RouterModule,
    UserEditComponent // ✅ L'importer ici car il est standalone
  ]
})
export class UserModule { }
