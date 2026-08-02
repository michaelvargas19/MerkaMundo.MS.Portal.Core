import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// Importaciones de Angular Material específicas para esta vista
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthRoutingModule } from './auth-routing-module';
import { Login } from './pages/login/login';

@NgModule({
  declarations: [Login],
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule,   // Permite usar [formGroup]
    MatCardModule,         // Permite usar <mat-card>
    MatFormFieldModule,    // Permite usar <mat-form-field>
    MatInputModule,        // Permite usar matInput
    MatButtonModule,       // Permite usar mat-raised-button y mat-icon-button
    MatIconModule          // Permite usar <mat-icon>
  ],
})
export class AuthModule {}
