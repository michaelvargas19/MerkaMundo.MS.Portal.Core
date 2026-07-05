import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SaleRoutingModule } from './sale-routing-module';
import { Sale } from './pages/sale/sale';

@NgModule({
  declarations: [Sale],
  imports: [CommonModule, SaleRoutingModule],
})
export class SaleModule {}
