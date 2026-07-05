import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Navbar } from './components/navbar/navbar';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { Home } from './pages/home/home';

@NgModule({
  declarations: [Navbar, Home],
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule],
  exports: [Navbar],
})
export class SharedModule {}
