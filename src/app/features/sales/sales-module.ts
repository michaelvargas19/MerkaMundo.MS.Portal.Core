import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Sales } from './pages/sales/sales';
import { CreateSale } from './pages/create-sale/create-sale';
import { UpdateSale } from './pages/update-sale/update-sale';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SalesRoutingModule } from './sales-routing-module';
import { ListDailySales } from './pages/list-daily-sales/list-daily-sales';

@NgModule({
  declarations: [Sales, CreateSale, UpdateSale, ListDailySales],
  imports: [
    CommonModule,
    SalesRoutingModule,
    MatButtonModule,  
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    // Soluciona el error: No provider found for DateAdapter
    provideNativeDateAdapter(),
    CurrencyPipe
  ]
})
export class SalesModule {}
