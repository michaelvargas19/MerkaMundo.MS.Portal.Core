import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Navbar } from './components/navbar/navbar';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';

import { Home } from './pages/home/home';
import { ResponseDTO } from './model/common/http/response-dto';
import { AccountDTO } from './model/account/account-dto';

@NgModule({
  declarations: [Navbar, Home],
  imports: [
    CommonModule, 
    RouterModule, 
    MatToolbarModule, 
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatDividerModule
  ],
  exports: [Navbar],
})
export class SharedModule {}
