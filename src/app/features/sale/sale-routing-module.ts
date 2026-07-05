import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Sale } from './pages/sale/sale';

const routes: Routes = [
  //{ path: '', component: Sale } 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SaleRoutingModule {}
